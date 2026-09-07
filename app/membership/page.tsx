import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { membershipEvents } from '@/lib/db/schema'
import { and, asc, eq, gte, isNull, or } from 'drizzle-orm'
import MembershipDashboardClient from './membership-dashboard-client'
import { getLoyaltyOverview } from '@/lib/loyalty/service'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function MembershipDashboard() {
  const user = await requirePortalUser(['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'], '/membership')
  const [loyaltyResult, upcomingEventsResult] = await Promise.all([
    safeQuery(getLoyaltyOverview(user.id), 'membership rewards overview', null),
    safeQuery(db.select().from(membershipEvents).where(and(eq(membershipEvents.status, 'published'), gte(membershipEvents.eventDate, new Date()), or(eq(membershipEvents.membershipTier, 'all'), eq(membershipEvents.membershipTier, 'membership'), isNull(membershipEvents.membershipTier)))).orderBy(asc(membershipEvents.eventDate)).limit(3), 'membership events', []),
  ])

  const overview = loyaltyResult.data
  const upcomingEvents = upcomingEventsResult.data

  return <MembershipDashboardClient
    dataIssue={Boolean(loyaltyResult.error || upcomingEventsResult.error)}
    rewards={overview ? {
      tier: overview.tier,
      balancePoints: overview.balancePoints,
      lifetimeEarned: overview.lifetimeEarned,
      lifetimeRedeemed: overview.lifetimeRedeemed,
      tierPrivileges: overview.tierPrivileges,
      nextTier: overview.nextTier,
      pointsToNextTier: overview.pointsToNextTier,
      nextTierPoints: overview.nextTierPoints,
      referralCode: overview.referralCode,
      referralLinkPath: overview.referralLinkPath,
      recentTransactions: overview.recentTransactions.map((item) => ({ id: item.id, points: item.points, description: item.description, createdAt: item.createdAt.toISOString() })),
      rules: { dailyLoginPoints: overview.rules.dailyLoginPoints, reviewPoints: overview.rules.reviewPoints, consultationPoints: overview.rules.consultationPoints, referralRewardPoints: overview.rules.referralRewardPoints },
    } : null}
    upcomingEvents={upcomingEvents.map((event) => ({ id: event.id, title: event.title, eventDate: event.eventDate.toISOString(), location: event.location }))}
  />
}
