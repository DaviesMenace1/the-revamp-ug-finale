'use server'

import { db } from '@/lib/db/client'
import { consultationSlots, consultations } from '@/lib/db/schema'
import { eq, and, gte, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'

// --- Admin: define availability ---

export async function createSlots(data: {
  startTimes: string[]
  durationMinutes: number
  mode: string
}) {
  if (data.startTimes.length === 0) return { success: false, error: 'Pick at least one time.' }

  try {
    const rows = data.startTimes.map((t) => ({
      startTime: new Date(t),
      durationMinutes: data.durationMinutes,
      mode: data.mode,
    }))

    await db.insert(consultationSlots).values(rows)

    revalidatePath('/admin/consultations')
    revalidatePath('/book-consultation')
    return { success: true }
  } catch (error) {
    console.error('Failed to create slots:', error)
    return { success: false, error: 'Failed to create availability.' }
  }
}

export async function deleteSlot(slotId: string) {
  try {
    await db.delete(consultationSlots).where(eq(consultationSlots.id, slotId))
    revalidatePath('/admin/consultations')
    revalidatePath('/book-consultation')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete slot:', error)
    return { success: false, error: 'Failed to delete slot.' }
  }
}

// --- Client: book a slot ---

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

  try {

    const slot = await db.query.consultationSlots.findFirst({
      where: and(eq(consultationSlots.id, data.slotId), eq(consultationSlots.isBooked, false)),
    })

        if (!slot) {
      return { success: false, error: 'This time slot is no longer available.' }
    }

    if (data.mode && data.mode !== slot.mode) {
      return { success: false, error: 'That meeting format does not match the selected time. Please choose another slot.' }
    }

    const [consultation] = await db

      .insert(consultations)
      .values({
        userId: user.id,
        title: data.title,
        description: data.description || null,
                serviceType: data.serviceType || null,
        budget: data.budget || null,
        preferredDate: slot.startTime,

        mode: slot.mode,
        durationMinutes: slot.durationMinutes,
        status: 'scheduled',
        confirmedAt: new Date(),
      })
      .returning()

    await db
      .update(consultationSlots)
      .set({ isBooked: true, consultationId: consultation.id })
      .where(eq(consultationSlots.id, data.slotId))

    revalidatePath('/client/consultations')
    revalidatePath('/book-consultation')
    revalidatePath('/admin/consultations')
    return { success: true, consultation }
  } catch (error) {
    console.error('Failed to book consultation:', error)
    return { success: false, error: 'Failed to book consultation.' }
  }
}

export async function getAvailableSlots() {
  try {
    const slots = await db
      .select()
      .from(consultationSlots)
      .where(and(eq(consultationSlots.isBooked, false), gte(consultationSlots.startTime, new Date())))
      .orderBy(asc(consultationSlots.startTime))

    return {
      success: true,
      slots: slots.map((s) => ({ ...s, startTime: s.startTime.toISOString() })),
    }
  } catch (error) {
    console.error('Failed to load slots:', error)
    return { success: false, slots: [] }
  }
}
