import { asc } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { membershipEvents } from '@/lib/db/schema'
import EventsAdminClient from './events-admin-client'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const events = await db.select().from(membershipEvents).orderBy(asc(membershipEvents.eventDate)).limit(100)
  return <EventsAdminClient events={events.map((event) => ({ ...event, meetingMode: event.meetingProvider === 'google_meet' ? 'virtual' as const : 'in_person' as const, eventDate: event.eventDate.toISOString(), createdAt: event.createdAt.toISOString(), updatedAt: event.updatedAt.toISOString() }))} />
}
