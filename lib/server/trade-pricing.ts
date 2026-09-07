import 'server-only'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { tradeMembers } from '@/lib/db/schema'

const APPROVED_TRADE_STATUSES = new Set(['approved', 'active'])

export async function hasApprovedTradeAccess(userId: string, role?: string | null) {
  if (role === 'admin') return true
  const member = await db.query.tradeMembers.findFirst({
    where: eq(tradeMembers.userId, userId),
    columns: { status: true },
  })
  return Boolean(member?.status && APPROVED_TRADE_STATUSES.has(member.status))
}

export function getTradePrice(price: number, discountPercent: number) {
  const basePrice = Math.max(0, Number(price) || 0)
  const rate = Math.min(100, Math.max(0, Number(discountPercent) || 0))
  return Math.round(basePrice * (1 - rate / 100) * 100) / 100
}
