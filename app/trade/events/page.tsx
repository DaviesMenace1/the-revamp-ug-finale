import { and, asc, count, eq, gte, isNull, or } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { eventRsvps, membershipEvents } from '@/lib/db/schema'
import { requirePortalUser } from '@/lib/auth/portal-auth'
import TradeEventsClient from './trade-events-client'

export const dynamic = 'force-dynamic'

export default async function TradeEventsPage() {
  const user = await requirePortalUser(['trade_member', 'admin', 'designer', 'architect', 'interior_designer'], '/trade/events')
  const events = await db.select().from(membershipEvents).where(and(eq(membershipEvents.status, 'published'), gte(membershipEvents.eventDate, new Date()), or(eq(membershipEvents.membershipTier, 'all'), eq(membershipEvents.membershipTier, 'trade'), isNull(membershipEvents.membershipTier)))).orderBy(asc(membershipEvents.eventDate)).limit(50)
  const myRsvps = await db.select({ eventId: eventRsvps.eventId }).from(eventRsvps).where(eq(eventRsvps.userId, user.id))
  const registered = new Set(myRsvps.map((item) => item.eventId))
  const rsvpCounts: Record<string, number> = {}
  for (const event of events) {
    const [result] = await db.select({ value: count() }).from(eventRsvps).where(eq(eventRsvps.eventId, event.id))
    rsvpCounts[event.id] = Number(result?.value ?? 0)
  }
  return <TradeEventsClient events={events.map((event) => ({ id: event.id, title: event.title, description: event.description, image: event.image, location: event.location, eventDate: event.eventDate.toISOString(), capacity: event.capacity, rsvpCount: rsvpCounts[event.id] ?? 0, isRegistered: registered.has(event.id) }))} />
}
