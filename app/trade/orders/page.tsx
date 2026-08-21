import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import TradeOrdersClient from './trade-orders-client'

export const dynamic = 'force-dynamic'

export default async function TradeOrders() {
  const user = await requirePortalUser(['trade_member', 'admin'], '/trade/orders')

  const myOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt))

  const formatted = myOrders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    items: Array.isArray(o.items) ? o.items : [],
  }))

  return <TradeOrdersClient orders={formatted} />
}
