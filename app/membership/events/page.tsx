import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { membershipEvents, eventRsvps } from '@/lib/db/schema'
import { eq, asc, count } from 'drizzle-orm'
import MembershipEventsClient from './membership-events-client'

export const dynamic = 'force-dynamic'

export default async function MembershipEvents() {
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/membership/events',
  )

  const events = await db
    .select()
    .from(membershipEvents)
    .where(eq(membershipEvents.status, 'published'))
    .orderBy(asc(membershipEvents.eventDate))

  const myRsvps = await db
    .select({ eventId: eventRsvps.eventId })
    .from(eventRsvps)
    .where(eq(eventRsvps.userId, user.id))

  const rsvpEventIds = new Set(myRsvps.map((r) => r.eventId))

  const rsvpCounts = await Promise.all(
    events.map((e) =>
      db.select({ value: count() }).from(eventRsvps).where(eq(eventRsvps.eventId, e.id)),
    ),
  )

  const formatted = events.map((e, idx) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    image: e.image,
    location: e.location,
    eventDate: e.eventDate.toISOString(),
    capacity: e.capacity,
    rsvpCount: rsvpCounts[idx][0]?.value ?? 0,
    isRegistered: rsvpEventIds.has(e.id),
  }))

  return <MembershipEventsClient events={formatted} />
}

