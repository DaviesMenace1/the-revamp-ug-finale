import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { memberships, membershipEvents } from '@/lib/db/schema'
import { eq, gte, asc } from 'drizzle-orm'
import MembershipDashboardClient from './membership-dashboard-client'

export const dynamic = 'force-dynamic'

export default async function MembershipDashboard() {
  const user = await requirePortalUser(['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'], '/membership')

  const [membership, upcomingEvents] = await Promise.all([
    db.query.memberships.findFirst({ where: eq(memberships.userId, user.id) }),
    db
      .select()
      .from(membershipEvents)
      .where(gte(membershipEvents.eventDate, new Date()))
      .orderBy(asc(membershipEvents.eventDate))
      .limit(3),
  ])

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
