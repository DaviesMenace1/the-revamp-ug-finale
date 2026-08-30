import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { tradeMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import TradePricingClient from './trade-pricing-client'
import { getSubscriptionPricing } from '@/lib/subscriptions'

export const dynamic = 'force-dynamic'

const TIER_KEY_MAP: Record<string, string> = {
  entry: 'Entry-Level Trade',
  standard: 'Entry-Level Trade',
  professional: 'Professional Trade',
  strategic: 'Strategic Partner',
}

export default async function TradePricing() {
  const user = await requirePortalUser(['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'], '/trade/pricing')

  const member = await db.query.tradeMembers.findFirst({ where: eq(tradeMembers.userId, user.id) })
  const pricing = await getSubscriptionPricing()

  const currentTierTitle = member?.tier ? TIER_KEY_MAP[member.tier] ?? null : null
  const currentPlanKey = member?.tier === 'standard' ? 'entry' : member?.tier ?? null

  return <TradePricingClient currentTierTitle={currentTierTitle} currentPlanKey={currentPlanKey} hasActiveSubscription={member?.status === 'active'} discountRate={member?.discountRate ? Number(member.discountRate) : null} subscriptionPlans={pricing.trade} />
}