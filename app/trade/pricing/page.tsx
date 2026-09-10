import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { tradeMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import TradePricingClient from './trade-pricing-client'

export const dynamic = 'force-dynamic'

export default async function TradePricing() {
  const user = await requirePortalUser(['trade_member', 'admin'], '/trade/pricing')
  const member = await db.query.tradeMembers.findFirst({ where: eq(tradeMembers.userId, user.id) })

  return <TradePricingClient member={member ? { businessName: member.businessName, tier: member.tier || 'Trade access', status: member.status || 'pending' } : null} />
}
