'use server'

import { db } from '@/lib/db/client'
import { eventRsvps, membershipEvents, users } from '@/lib/db/schema'
import { and, count, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { createGoogleMeetEvent } from '@/lib/google-calendar'
import { notifyUser } from '@/lib/notifications/service'

const EVENT_STATUSES = new Set(['draft', 'published', 'cancelled'])
const EVENT_AUDIENCES = new Set(['all', 'membership', 'trade'])
type PortalRole = 'customer' | 'admin' | 'designer' | 'trade_member' | 'architect' | 'interior_designer'
const MEMBERSHIP_ROLES = new Set<PortalRole>(['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'])
const TRADE_ROLES = new Set<PortalRole>(['admin', 'trade_member', 'designer', 'architect', 'interior_designer'])

type EventInput = {
  title: string
  description?: string | null
  image?: string | null
  location?: string | null
  meetingMode?: string | null
  eventDate: string
  capacity?: number | null
  membershipTier?: string | null
  status?: string
}

type ValidatedEvent = {
  title: string
  description: string | null
  image: string | null
  location: string | null
  meetingMode: 'virtual' | 'in_person'
  eventDate: Date
  capacity: number | null
  membershipTier: string
  status: string
}

function validateEvent(input: EventInput): { value?: ValidatedEvent; error?: string } {
  const title = input.title.trim().slice(0, 255)
  const description = input.description?.trim().slice(0, 4000) || null
  const image = input.image?.trim().slice(0, 1000) || null
  const meetingMode = input.meetingMode === 'virtual' ? 'virtual' : 'in_person'
  const location = input.location?.trim().slice(0, 255) || null
  const eventDate = new Date(input.eventDate)
  const capacity = input.capacity == null || input.capacity === 0 ? null : Math.floor(Number(input.capacity))
  const membershipTier = input.membershipTier?.trim() || 'all'
  const status = input.status?.trim() || 'draft'
  if (!title) return { error: 'Event title is required.' }
  if (Number.isNaN(eventDate.getTime())) return { error: 'Choose a valid event date.' }
  if (meetingMode === 'in_person' && !location) return { error: 'Enter the venue location for an in-person event.' }
  if (capacity !== null && (!Number.isFinite(capacity) || capacity < 1)) return { error: 'Capacity must be a positive whole number.' }
  if (!EVENT_AUDIENCES.has(membershipTier)) return { error: 'Choose a valid audience.' }
  if (!EVENT_STATUSES.has(status)) return { error: 'Choose a valid event status.' }
  return { value: { title, description, image, location: meetingMode === 'virtual' ? null : location, meetingMode, eventDate, capacity, membershipTier, status } }
}

function revalidateEventPaths() {
  revalidatePath('/admin/events')
  revalidatePath('/membership/events')
  revalidatePath('/membership')
  revalidatePath('/membership/community')
  revalidatePath('/trade/events')
  revalidatePath('/trade')
}

async function requireAdmin() {
  const authorization = await getCurrentUserWithRole(['admin', 'editor'])
  return authorization.authorized && authorization.user ? authorization.user : null
}

export async function createEvent(input: EventInput) {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'You are not authorized to manage events.' }
  const parsed = validateEvent(input)
  if (!parsed.value) return { success: false, error: parsed.error || 'Invalid event.' }

  try {
    const meeting = parsed.value.meetingMode === 'virtual'
      ? await createGoogleMeetEvent({ summary: parsed.value.title, description: parsed.value.description, start: parsed.value.eventDate, durationMinutes: 60 })
      : null
    const [event] = await db.insert(membershipEvents).values({
      ...parsed.value,
      meetingProvider: meeting ? 'google_meet' : null,
      meetingUrl: meeting?.meetUrl || null,
      calendarEventId: meeting?.calendarEventId || null,
    }).returning()
    if (event && parsed.value.status === 'published') {
      const roles = parsed.value.membershipTier === 'membership' ? [...MEMBERSHIP_ROLES] : parsed.value.membershipTier === 'trade' ? [...TRADE_ROLES] : [...new Set([...MEMBERSHIP_ROLES, ...TRADE_ROLES])]
      const recipients = await db.select({ id: users.id }).from(users).where(inArray(users.role, roles)).limit(500)
      for (const recipient of recipients) {
        await notifyUser({
          userId: recipient.id,
          type: 'event_published',
          priority: 'important',
          title: `New event: ${event.title}`,
          message: `${event.eventDate.toLocaleString('en-UG')} · ${event.meetingUrl || event.location || 'Details in your portal.'}`,
          actionUrl: parsed.value.membershipTier === 'trade' ? '/trade/events' : '/membership/events',
          metadata: { eventId: event.id, meetingUrl: event.meetingUrl || '', location: event.location || '' },
          channels: ['in_app', 'push', 'email'],
        })
      }
    }
    revalidateEventPaths()
    return { success: true, event }
  } catch (error) {
    console.error('Failed to create event:', error)
    return { success: false, error: 'Failed to create event.' }
  }
}

export async function updateEvent(eventId: string, input: EventInput) {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'You are not authorized to manage events.' }
  const parsed = validateEvent(input)
  if (!parsed.value) return { success: false, error: parsed.error || 'Invalid event.' }

  try {
    const existing = await db.query.membershipEvents.findFirst({ where: eq(membershipEvents.id, eventId), columns: { meetingUrl: true, meetingProvider: true, calendarEventId: true } })
    const meeting = parsed.value.meetingMode === 'virtual' && !existing?.meetingUrl
      ? await createGoogleMeetEvent({ summary: parsed.value.title, description: parsed.value.description, start: parsed.value.eventDate, durationMinutes: 60 })
      : null
    const [event] = await db.update(membershipEvents).set({
      ...parsed.value,
      meetingProvider: parsed.value.meetingMode === 'virtual' ? (existing?.meetingProvider || (meeting ? 'google_meet' : null)) : null,
      meetingUrl: parsed.value.meetingMode === 'virtual' ? (existing?.meetingUrl || meeting?.meetUrl || null) : null,
      calendarEventId: parsed.value.meetingMode === 'virtual' ? (existing?.calendarEventId || meeting?.calendarEventId || null) : null,
      updatedAt: new Date(),
    }).where(eq(membershipEvents.id, eventId)).returning()
    if (!event) return { success: false, error: 'Event not found.' }
    revalidateEventPaths()
    return { success: true, event }
  } catch (error) {
    console.error('Failed to update event:', error)
    return { success: false, error: 'Failed to update event.' }
  }
}

export async function deleteEvent(eventId: string) {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'You are not authorized to manage events.' }
  try {
    const [event] = await db.delete(membershipEvents).where(eq(membershipEvents.id, eventId)).returning({ id: membershipEvents.id })
    if (!event) return { success: false, error: 'Event not found.' }
    revalidateEventPaths()
    return { success: true }
  } catch (error) {
    console.error('Failed to delete event:', error)
    return { success: false, error: 'Failed to delete event.' }
  }
}

export async function rsvpToEvent(eventId: string) {
  const user = await getOrCreateCurrentUser()
  if (!user) return { success: false, error: 'Not signed in.' }

  try {
    const result = await db.transaction(async (transaction) => {
      const [event] = await transaction
        .select({
          id: membershipEvents.id,
          status: membershipEvents.status,
          eventDate: membershipEvents.eventDate,
          capacity: membershipEvents.capacity,
          membershipTier: membershipEvents.membershipTier,
          title: membershipEvents.title,
          location: membershipEvents.location,
          meetingUrl: membershipEvents.meetingUrl,
        })
        .from(membershipEvents)
        .where(eq(membershipEvents.id, eventId))
        .for('update')

      if (!event) return { success: false, error: 'Event not found.' }
      if (event.status !== 'published') return { success: false, error: 'This event is not open for registration.' }
      if (event.eventDate <= new Date()) return { success: false, error: 'This event has already started or ended.' }

      const audience = event.membershipTier ?? 'all'
      const hasAudienceAccess = audience === 'all'
        || (audience === 'membership' && Boolean(user.role && MEMBERSHIP_ROLES.has(user.role as PortalRole)))
        || (audience === 'trade' && Boolean(user.role && TRADE_ROLES.has(user.role as PortalRole)))
      if (!hasAudienceAccess) return { success: false, error: 'This event is not available to your account.' }

      const [existing] = await transaction
        .select({ id: eventRsvps.id })
        .from(eventRsvps)
        .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, user.id)))
        .limit(1)
      if (existing) return { success: true, event }

      if (event.capacity !== null) {
        const [rsvpTotal] = await transaction
          .select({ value: count() })
          .from(eventRsvps)
          .where(eq(eventRsvps.eventId, eventId))
        if (Number(rsvpTotal?.value ?? 0) >= event.capacity) {
          return { success: false, error: 'This event is already full.' }
        }
      }

      await transaction.insert(eventRsvps).values({ eventId, userId: user.id })
      return { success: true, event }
    })

    if (result.success) {
      revalidateEventPaths()
      if (result.event) {
        await notifyUser({
          userId: user.id,
          type: 'event_rsvp_confirmed',
          priority: 'important',
          title: `You are registered for ${result.event.title}`,
          message: `${result.event.eventDate.toLocaleString('en-UG')} · ${result.event.meetingUrl || result.event.location || 'Event details are in your portal.'}`,
          actionUrl: result.event.meetingUrl || '/membership/events',
          metadata: { eventId, meetingUrl: result.event.meetingUrl || '', location: result.event.location || '' },
          channels: ['in_app', 'push', 'email'],
        })
      }
    }
    return result
  } catch (error) {
    console.error('Failed to RSVP:', error)
    return { success: false, error: 'Failed to RSVP.' }
  }
}

export async function cancelRsvp(eventId: string) {
  const user = await getOrCreateCurrentUser()
  if (!user) return { success: false, error: 'Not signed in.' }

  try {
    await db.delete(eventRsvps).where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, user.id)))
    revalidateEventPaths()
    return { success: true }
  } catch (error) {
    console.error('Failed to cancel RSVP:', error)
    return { success: false, error: 'Failed to cancel RSVP.' }
  }
}
