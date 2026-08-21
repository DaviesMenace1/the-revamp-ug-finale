'use server'

import { db } from '@/lib/db/client'
import { eventRsvps } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'

export async function rsvpToEvent(eventId: string) {
  const user = await getOrCreateCurrentUser()
  if (!user) return { success: false, error: 'Not signed in.' }

  try {
    await db.insert(eventRsvps).values({ eventId, userId: user.id }).onConflictDoNothing()
    revalidatePath('/membership/events')
    return { success: true }
  } catch (error) {
    console.error('Failed to RSVP:', error)
    return { success: false, error: 'Failed to RSVP.' }
  }
}

export async function cancelRsvp(eventId: string) {
  const user = await getOrCreateCurrentUser()
  if (!user) return { success: false, error: 'Not signed in.' }

  try {
    await db
      .delete(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, user.id)))
    revalidatePath('/membership/events')
    return { success: true }
  } catch (error) {
    console.error('Failed to cancel RSVP:', error)
    return { success: false, error: 'Failed to cancel RSVP.' }
  }
}
