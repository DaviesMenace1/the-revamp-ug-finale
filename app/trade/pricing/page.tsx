import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { tradeMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import TradePricingClient from './trade-pricing-client'

export const dynamic = 'force-dynamic'

const TIER_KEY_MAP: Record<string, string> = {
  standard: 'Entry-Level Trade',
  professional: 'Professional Trade',
  strategic: 'Strategic Partner',
}

export default async function TradePricing() {
  const user = await requirePortalUser(['trade_member', 'admin'], '/trade/pricing')

  const member = await db.query.tradeMembers.findFirst({ where: eq(tradeMembers.userId, user.id) })

  const currentTierTitle = member?.tier ? TIER_KEY_MAP[member.tier] ?? null : null

  return <TradePricingClient currentTierTitle={currentTierTitle} discountRate={member?.discountRate ? Number(member.discountRate) : null} />
}