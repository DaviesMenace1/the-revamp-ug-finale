import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import OrdersClient from './orders-client'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function ClientOrders() {
  const user = await requirePortalUser(['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'], '/client/orders')

  const result = await safeQuery(
    db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt)),
    'client orders',
    [],
  )

  const formatted = result.data.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: Array.isArray(o.items) ? o.items : [],
  }))

  return <OrdersClient orders={formatted} loadError={result.error ? 'Orders are temporarily unavailable. You can retry the page.' : null} />
}
