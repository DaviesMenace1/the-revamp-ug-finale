import { requirePortalUser } from '@/lib/auth/portal-auth'
import MembershipBenefitsClient from './membership-benefits-client'
import { getLoyaltyOverview } from '@/lib/loyalty/service'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function MembershipBenefits() {
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/membership/benefits',
  )
  const result = await safeQuery(getLoyaltyOverview(user.id), 'membership privilege overview', null)
  const overview = result.data

  return <MembershipBenefitsClient rewards={overview ? {
    tier: overview.tier,
    lifetimeEarned: overview.lifetimeEarned,
    balancePoints: overview.balancePoints,
    tierPrivileges: overview.tierPrivileges,
    nextTier: overview.nextTier,
    pointsToNextTier: overview.pointsToNextTier,
  } : null} />
}
