import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { orders, tradeMembers } from '@/lib/db/schema'
import { eq, count, sum, gte, and } from 'drizzle-orm'
import TradeDashboardView from './trade-dashboard-view'

export const dynamic = 'force-dynamic'

export default async function TradeDashboard() {
  const user = await requirePortalUser(['trade_member', 'admin'], '/trade')

  const yearStart = new Date(new Date().getFullYear(), 0, 1)

  const [member, orderCountRow, pendingCountRow, ytdSpendRow] = await Promise.all([
    db.query.tradeMembers.findFirst({ where: eq(tradeMembers.userId, user.id) }),
    db.select({ value: count() }).from(orders).where(eq(orders.userId, user.clerkId)),
    db
      .select({ value: count() })
      .from(orders)
      .where(and(eq(orders.userId, user.clerkId), eq(orders.status, 'pending'))),
    db
      .select({ value: sum(orders.subtotal) })
      .from(orders)
      .where(and(eq(orders.userId, user.clerkId), gte(orders.createdAt, yearStart))),
  ])

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
