import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { tradeResources } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import TradeResourcesClient from './trade-resources-client'

export const dynamic = 'force-dynamic'

export default async function TradeResources() {
  await requirePortalUser(['trade_member', 'admin'], '/trade/resources')

  const resources = await db
    .select()
    .from(tradeResources)
    .where(eq(tradeResources.status, 'published'))
    .orderBy(desc(tradeResources.createdAt))

  const formatted = resources.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }))

  return <TradeResourcesClient resources={formatted} />
}
