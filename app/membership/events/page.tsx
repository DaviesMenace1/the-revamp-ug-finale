import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { membershipEvents, eventRsvps } from '@/lib/db/schema'
import { and, asc, count, eq, gte, isNull, or } from 'drizzle-orm'
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
    .where(and(eq(membershipEvents.status, 'published'), gte(membershipEvents.eventDate, new Date()), or(eq(membershipEvents.membershipTier, 'all'), eq(membershipEvents.membershipTier, 'membership'), isNull(membershipEvents.membershipTier))))
    .orderBy(asc(membershipEvents.eventDate))
    .limit(50)

  const myRsvps = await db
    .select({ eventId: eventRsvps.eventId })
    .from(eventRsvps)
    .where(eq(eventRsvps.userId, user.id))

  const rsvpEventIds = new Set(myRsvps.map((r) => r.eventId))

  const rsvpCounts: Record<string, number> = {}
  for (const event of events) {
    const [result] = await db.select({ value: count() }).from(eventRsvps).where(eq(eventRsvps.eventId, event.id))
    rsvpCounts[event.id] = Number(result?.value ?? 0)
  }

  const formatted = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    image: e.image,
    location: e.location,
    meetingUrl: e.meetingUrl,
    eventDate: e.eventDate.toISOString(),
    capacity: e.capacity,
    rsvpCount: rsvpCounts[e.id] ?? 0,
    isRegistered: rsvpEventIds.has(e.id),
  }))

  return <MembershipEventsClient events={formatted} />
}

