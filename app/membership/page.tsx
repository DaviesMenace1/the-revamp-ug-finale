import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { memberships, membershipEvents } from '@/lib/db/schema'
import { and, asc, eq, gte, isNull, or } from 'drizzle-orm'
import MembershipDashboardClient from './membership-dashboard-client'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function MembershipDashboard() {
  const user = await requirePortalUser(['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'], '/membership')

  const membershipResult = await safeQuery(
    db.query.memberships.findFirst({ where: eq(memberships.userId, user.id) }),
    'membership profile',
    null,
  )
  const upcomingEventsResult = await safeQuery(
    db
      .select()
      .from(membershipEvents)
      .where(and(eq(membershipEvents.status, 'published'), gte(membershipEvents.eventDate, new Date()), or(eq(membershipEvents.membershipTier, 'all'), eq(membershipEvents.membershipTier, 'membership'), isNull(membershipEvents.membershipTier))))
      .orderBy(asc(membershipEvents.eventDate))
      .limit(3),
    'membership events',
    [],
  )
  const membership = membershipResult.data
  const upcomingEvents = upcomingEventsResult.data

  return (
    <MembershipDashboardClient
      membership={
        membership
          ? {
              type: membership.membershipType,
              status: membership.status ?? 'active',
              benefits: Array.isArray(membership.benefits) ? (membership.benefits as string[]) : [],
            }
          : null
      }
      upcomingEvents={upcomingEvents.map((e) => ({
        id: e.id,
        title: e.title,
        eventDate: e.eventDate.toISOString(),
        location: e.location,
      }))}
    />
  )
}
