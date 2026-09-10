import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { orders, tradeMembers } from '@/lib/db/schema'
import { eq, count, sum, gte, and, ne } from 'drizzle-orm'
import TradeDashboardView from './trade-dashboard-view'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function TradeDashboard() {
  const user = await requirePortalUser(['customer', 'trade_member', 'admin', 'designer', 'architect', 'interior_designer'], '/trade')
  const yearStart = new Date(new Date().getFullYear(), 0, 1)
  const [memberResult, orderCountResult, pendingCountResult, ytdSpendResult] = await Promise.all([
    safeQuery(db.query.tradeMembers.findFirst({ where: eq(tradeMembers.userId, user.id) }), 'trade membership', null),
    safeQuery(db.select({ value: count() }).from(orders).where(and(eq(orders.userId, user.clerkId), ne(orders.status, 'cancelled'), ne(orders.paymentStatus, 'failed'), ne(orders.paymentStatus, 'refunded'))), 'trade order count', []),
    safeQuery(db.select({ value: count() }).from(orders).where(and(eq(orders.userId, user.clerkId), eq(orders.status, 'pending'))), 'trade pending order count', []),
    safeQuery(db.select({ value: sum(orders.total) }).from(orders).where(and(eq(orders.userId, user.clerkId), gte(orders.createdAt, yearStart), ne(orders.status, 'cancelled'), ne(orders.paymentStatus, 'failed'), ne(orders.paymentStatus, 'refunded'))), 'trade year-to-date spend', []),
  ])

  const member = memberResult.data
  const orderCountRow = orderCountResult.data
  const pendingCountRow = pendingCountResult.data
  const ytdSpendRow = ytdSpendResult.data

  return (
    <TradeDashboardView
      member={member ? { businessName: member.businessName, tier: member.tier ?? 'standard', status: member.status ?? 'pending' } : null}
      stats={{ totalOrders: Number(orderCountRow[0]?.value ?? 0), pendingOrders: Number(pendingCountRow[0]?.value ?? 0), ytdSpend: Number(ytdSpendRow[0]?.value ?? 0) }}
      dataIssue={Boolean(memberResult.error || orderCountResult.error || pendingCountResult.error || ytdSpendResult.error)}
    />
  )
}
