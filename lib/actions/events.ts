'use server'

import { db } from '@/lib/db/client'
import { eventRsvps, membershipEvents } from '@/lib/db/schema'
import { and, count, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { getCurrentUserWithRole } from '@/lib/auth/server'

const EVENT_STATUSES = new Set(['draft', 'published', 'cancelled'])
const EVENT_AUDIENCES = new Set(['all', 'membership', 'trade'])
const MEMBERSHIP_ROLES = new Set(['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'])
const TRADE_ROLES = new Set(['admin', 'trade_member', 'designer', 'architect', 'interior_designer'])

type EventInput = {
  title: string
  description?: string | null
  image?: string | null
  location?: string | null
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
  eventDate: Date
  capacity: number | null
  membershipTier: string
  status: string
}

function validateEvent(input: EventInput): { value?: ValidatedEvent; error?: string } {
  const title = input.title.trim().slice(0, 255)
  const description = input.description?.trim().slice(0, 4000) || null
  const image = input.image?.trim().slice(0, 1000) || null
  const location = input.location?.trim().slice(0, 255) || null
  const eventDate = new Date(input.eventDate)
  const capacity = input.capacity == null || input.capacity === 0 ? null : Math.floor(Number(input.capacity))
  const membershipTier = input.membershipTier?.trim() || 'all'
  const status = input.status?.trim() || 'draft'
  if (!title) return { error: 'Event title is required.' }
  if (Number.isNaN(eventDate.getTime())) return { error: 'Choose a valid event date.' }
  if (capacity !== null && (!Number.isFinite(capacity) || capacity < 1)) return { error: 'Capacity must be a positive whole number.' }
  if (!EVENT_AUDIENCES.has(membershipTier)) return { error: 'Choose a valid audience.' }
  if (!EVENT_STATUSES.has(status)) return { error: 'Choose a valid event status.' }
  return { value: { title, description, image, location, eventDate, capacity, membershipTier, status } }
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
  const authorization = await getCurrentUserWithRole(['admin'])
  return authorization.authorized && authorization.user ? authorization.user : null
}

export async function createEvent(input: EventInput) {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'Only an administrator can manage events.' }
  const parsed = validateEvent(input)
  if (!parsed.value) return { success: false, error: parsed.error || 'Invalid event.' }

  try {
    const [event] = await db.insert(membershipEvents).values(parsed.value).returning()
    revalidateEventPaths()
    return { success: true, event }
  } catch (error) {
    console.error('Failed to create event:', error)
    return { success: false, error: 'Failed to create event.' }
  }
}

export async function updateEvent(eventId: string, input: EventInput) {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'Only an administrator can manage events.' }
  const parsed = validateEvent(input)
  if (!parsed.value) return { success: false, error: parsed.error || 'Invalid event.' }

  try {
    const [event] = await db.update(membershipEvents).set({ ...parsed.value, updatedAt: new Date() }).where(eq(membershipEvents.id, eventId)).returning()
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
  if (!admin) return { success: false, error: 'Only an administrator can manage events.' }
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
        })
        .from(membershipEvents)
        .where(eq(membershipEvents.id, eventId))
        .for('update')

      if (!event) return { success: false, error: 'Event not found.' }
      if (event.status !== 'published') return { success: false, error: 'This event is not open for registration.' }
      if (event.eventDate <= new Date()) return { success: false, error: 'This event has already started or ended.' }

      const audience = event.membershipTier ?? 'all'
      const hasAudienceAccess = audience === 'all'
        || (audience === 'membership' && MEMBERSHIP_ROLES.has(user.role ?? ''))
        || (audience === 'trade' && TRADE_ROLES.has(user.role ?? ''))
      if (!hasAudienceAccess) return { success: false, error: 'This event is not available to your account.' }

      const [existing] = await transaction
        .select({ id: eventRsvps.id })
        .from(eventRsvps)
        .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, user.id)))
        .limit(1)
      if (existing) return { success: true }

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
      return { success: true }
    })

    if (result.success) revalidateEventPaths()
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
