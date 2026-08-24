import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { orders, tradeMembers } from '@/lib/db/schema'
import { eq, count, sum, gte, and } from 'drizzle-orm'
import TradeDashboardView from './trade-dashboard-view'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function TradeDashboard() {
  const user = await requirePortalUser(['trade_member', 'admin'], '/trade')

  const yearStart = new Date(new Date().getFullYear(), 0, 1)

  const memberResult = await safeQuery(
    db.query.tradeMembers.findFirst({ where: eq(tradeMembers.userId, user.id) }),
    'trade membership',
    null,
  )
  const orderCountResult = await safeQuery(
    db.select({ value: count() }).from(orders).where(eq(orders.userId, user.clerkId)),
    'trade order count',
    [],
  )
  const pendingCountResult = await safeQuery(
    db
      .select({ value: count() })
      .from(orders)
      .where(and(eq(orders.userId, user.clerkId), eq(orders.status, 'pending'))),
    'trade pending order count',
    [],
  )
  const ytdSpendResult = await safeQuery(
    db
      .select({ value: sum(orders.subtotal) })
      .from(orders)
      .where(and(eq(orders.userId, user.clerkId), gte(orders.createdAt, yearStart))),
    'trade year-to-date spend',
    [],
  )

  const member = memberResult.data
  const orderCountRow = orderCountResult.data
  const pendingCountRow = pendingCountResult.data
  const ytdSpendRow = ytdSpendResult.data
  const discountRate = member?.discountRate ? Number(member.discountRate) : 10
  const ytdSpend = Number(ytdSpendRow[0]?.value ?? 0)
  const ytdSavings = ytdSpend * (discountRate / 100)

  return (
    <TradeDashboardView
      member={
        member
          ? {
              businessName: member.businessName,
              tier: member.tier ?? 'standard',
              discountRate,
              status: member.status ?? 'pending',
            }
          : null
      }
      stats={{
        totalOrders: orderCountRow[0]?.value ?? 0,
        pendingOrders: pendingCountRow[0]?.value ?? 0,
        ytdSavings,
      }}
    />
  )
}
