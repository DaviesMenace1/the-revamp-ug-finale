'use server'

import { db } from '@/lib/db/client'
import { consultationSlots, consultations, users } from '@/lib/db/schema'
import { eq, and, gte, asc, isNull, lt, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { notifyUser } from '@/lib/notifications/service'
import { createGoogleMeetEvent, GoogleCalendarApiError, GoogleCalendarConfigError } from '@/lib/google-calendar'

const VALID_MODES = new Set(['virtual', 'on_site', 'in_person', 'showroom'])
const BUDGET_LABELS: Record<string, string> = {
  under_10m: 'Under UGX 10 million',
  '10m_30m': 'UGX 10–30 million',
  '30m_75m': 'UGX 30–75 million',
  '75m_plus': 'UGX 75 million and above',
  not_sure: 'Not sure yet',
}

function parseBudget(value?: string) {
  const normalized = value?.trim()
  if (!normalized) return { amount: null, label: null }

  const amount = Number(normalized.replace(/,/g, ''))
  if (Number.isFinite(amount) && amount >= 0) return { amount: String(amount), label: null }

  return { amount: null, label: BUDGET_LABELS[normalized] ?? normalized.slice(0, 100) }
}

function revalidateConsultationPaths() {
  revalidatePath('/admin/consultations')
  revalidatePath('/book-consultation')
}

export async function createSlots(data: {
  startTimes: string[]
  durationMinutes: number
  mode: string
  location?: string
}) {
  try {
    const authorization = await getCurrentUserWithRole(['admin'])
    if (!authorization.authorized) return { success: false, error: 'Only administrators can manage consultation availability.' }

    const durationMinutes = Number(data.durationMinutes)
    const dates = Array.from(new Set(data.startTimes))
      .map((value) => new Date(value))
      .filter((date) => Number.isFinite(date.getTime()) && date.getTime() > Date.now())

    if (dates.length === 0) return { success: false, error: 'Pick at least one future time.' }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 240) return { success: false, error: 'Duration must be between 15 and 240 minutes.' }
    const mode = data.mode === 'in_person' ? 'on_site' : data.mode
    if (!VALID_MODES.has(mode)) return { success: false, error: 'Choose a valid consultation format.' }
    const location = data.location?.trim().slice(0, 255) || null
    if (mode === 'showroom' && !location) return { success: false, error: 'Enter the showroom location.' }

    const meetingEvents = mode === 'virtual'
      ? await Promise.all(dates.map((startTime) => createGoogleMeetEvent({
          summary: 'The Revamp UG consultation',
          description: 'Consultation availability created by The Revamp UG.',
          start: startTime,
          durationMinutes,
        })))
      : dates.map(() => null)
    const rows = dates.map((startTime, index) => ({
      startTime,
      durationMinutes,
      mode,
      location: mode === 'showroom' ? location : null,
      meetingProvider: meetingEvents[index] ? 'google_meet' : null,
      meetingUrl: meetingEvents[index]?.meetUrl || null,
      calendarEventId: meetingEvents[index]?.calendarEventId || null,
    }))
    const created = await db.insert(consultationSlots).values(rows).returning({
      id: consultationSlots.id,
      startTime: consultationSlots.startTime,
      durationMinutes: consultationSlots.durationMinutes,
      mode: consultationSlots.mode,
      location: consultationSlots.location,
      meetingProvider: consultationSlots.meetingProvider,
      meetingUrl: consultationSlots.meetingUrl,
      calendarEventId: consultationSlots.calendarEventId,
      isBooked: consultationSlots.isBooked,
      consultationId: consultationSlots.consultationId,
    })

    revalidateConsultationPaths()
    return { success: true, slots: created.map((slot) => ({ ...slot, startTime: slot.startTime.toISOString() })) }
  } catch (error) {
    console.error('Failed to create slots:', error)
    if (error instanceof GoogleCalendarConfigError || error instanceof GoogleCalendarApiError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create availability.' }
  }
}

export async function deleteSlot(slotId: string) {
  try {
    const authorization = await getCurrentUserWithRole(['admin'])
    if (!authorization.authorized) return { success: false, error: 'Only administrators can manage consultation availability.' }
    if (!slotId) return { success: false, error: 'A slot is required.' }

    const deleted = await db
      .delete(consultationSlots)
      .where(and(eq(consultationSlots.id, slotId), eq(consultationSlots.isBooked, false)))
      .returning({ id: consultationSlots.id })
    if (deleted.length === 0) return { success: false, error: 'Booked or unavailable slots cannot be removed.' }

    revalidateConsultationPaths()
    return { success: true }
  } catch (error) {
    console.error('Failed to delete slot:', error)
    return { success: false, error: 'Failed to delete slot.' }
  }
}

export async function bookConsultationSlot(data: {
  slotId: string
  title: string
  description?: string
  serviceType?: string
  budget?: string
  mode?: string
}) {
  const user = await getOrCreateCurrentUser()
  if (!user) return { success: false, error: 'Not signed in.' }
  if (!data.slotId || !data.title?.trim()) return { success: false, error: 'Please choose a time and tell us what you would like to discuss.' }

  const budget = parseBudget(data.budget)

  try {
    const booking = await db.transaction(async (transaction) => {
      const [slot] = await transaction
        .update(consultationSlots)
        .set({ isBooked: true, holdUntil: null, holdUserId: null })
        .where(and(eq(consultationSlots.id, data.slotId), eq(consultationSlots.isBooked, false), gte(consultationSlots.startTime, new Date()), or(isNull(consultationSlots.holdUntil), lt(consultationSlots.holdUntil, new Date()), eq(consultationSlots.holdUserId, user.id)), ...(data.mode ? [eq(consultationSlots.mode, data.mode)] : [])))
        .returning({ id: consultationSlots.id, startTime: consultationSlots.startTime, durationMinutes: consultationSlots.durationMinutes, mode: consultationSlots.mode })

      if (!slot) return null

      const [consultation] = await transaction
        .insert(consultations)
        .values({
          userId: user.id,
          title: data.title.trim().slice(0, 255),
          description: [
            data.description?.trim(),
            budget.label ? `Budget range: ${budget.label}` : null,
          ]
            .filter(Boolean)
            .join('\n\n')
            .slice(0, 5000) || null,
          serviceType: data.serviceType?.trim().slice(0, 100) || null,
          budget: budget.amount,
          preferredDate: slot.startTime,
          mode: slot.mode,
          durationMinutes: slot.durationMinutes,
          status: 'scheduled',
          confirmedAt: new Date(),
        })
        .returning()

      await transaction.update(consultationSlots).set({ consultationId: consultation.id }).where(eq(consultationSlots.id, slot.id))
      return { slot, consultation }
    })

    if (!booking) return { success: false, error: 'This time slot is no longer available or does not match the selected meeting format.' }

    try {
      await notifyUser({
        userId: user.id,
        type: 'consultation_booked',
        priority: 'important',
        title: 'Consultation booked',
        message: `Your ${booking.slot.mode.replaceAll('_', ' ')} consultation is booked for ${booking.slot.startTime.toLocaleString('en-UG')}.`,
        actionUrl: '/client/consultations',
        metadata: { consultationId: booking.consultation.id, slotId: booking.slot.id },
        channels: ['in_app'],
      })
      const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(20)
      for (const admin of admins) {
        await notifyUser({
          userId: admin.id,
          type: 'consultation_booked',
          priority: 'important',
          title: 'New consultation booked',
          message: `${user.firstName || 'A client'} booked ${booking.slot.mode.replaceAll('_', ' ')} for ${booking.slot.startTime.toLocaleString('en-UG')}.`,
          actionUrl: '/admin/consultations',
          metadata: { consultationId: booking.consultation.id, slotId: booking.slot.id, clientId: user.id },
          channels: ['in_app'],
        })
      }
    } catch (notificationError) {
      console.error('[consultation] notification follow-up failed:', notificationError)
    }

    revalidatePath('/client/consultations')
    revalidateConsultationPaths()
    return { success: true, consultation: booking.consultation }
  } catch (error) {
    console.error('Failed to book consultation:', error)
    return { success: false, error: 'We could not reserve that consultation right now. Please try the slot again or contact the studio if it remains unavailable.' }
  }
}

export async function getAvailableSlots() {
  try {
    const slots = await db
      .select()
      .from(consultationSlots)
      .where(and(eq(consultationSlots.isBooked, false), gte(consultationSlots.startTime, new Date()), or(isNull(consultationSlots.holdUntil), lt(consultationSlots.holdUntil, new Date()))))
      .orderBy(asc(consultationSlots.startTime))
      .limit(100)

    return { success: true, slots: slots.map((slot) => ({ ...slot, startTime: slot.startTime.toISOString() })) }
  } catch (error) {
    console.error('Failed to load slots:', error)
    return { success: false, slots: [] }
  }
}
