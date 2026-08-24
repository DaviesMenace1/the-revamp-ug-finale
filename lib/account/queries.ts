import { and, desc, eq, gte } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { carts, consultations, memberships, orders } from '@/lib/db/schema'
import { getOrCreateCurrentUser, getUserMembership } from '@/lib/auth/utils'
import { safeQuery } from '@/lib/server/safe-query'

export async function getAccountOverview() {
  // Provisions the local profile on demand, so a user who just signed up is
  // never treated as unauthenticated while the user.created webhook is in flight.
  const user = await getOrCreateCurrentUser()
  if (!user) return null

  const [cartResult, ordersResult, consultationsResult, membershipResult] = await Promise.all([
    safeQuery(
      db.select().from(carts).where(eq(carts.userId, user.id)).limit(1),
      'account cart',
      [],
    ),
    safeQuery(
      db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(3),
      'account orders',
      [],
    ),
    safeQuery(
      db
        .select()
        .from(consultations)
        .where(and(eq(consultations.userId, user.id), gte(consultations.preferredDate, new Date())))
        .orderBy(consultations.preferredDate)
        .limit(1),
      'account consultations',
      [],
    ),
    safeQuery(getUserMembership(user.id), 'account membership', null),
  ])

  const cart = cartResult.data
  const userOrders = ordersResult.data
  const upcomingConsultations = consultationsResult.data
  const membership = membershipResult.data
  const cartItems = Array.isArray(cart[0]?.items) ? cart[0].items : []
  const loadError = [cartResult, ordersResult, consultationsResult, membershipResult].some((result) => result.error)

  return {
    user,
    loadError: loadError ? 'Some account details are temporarily unavailable. You can retry the page.' : null,
    cartCount: cartItems.reduce((total, item) => {
      if (typeof item === 'object' && item !== null && 'quantity' in item) {
        const quantity = Number(item.quantity)
        return total + (Number.isFinite(quantity) ? quantity : 0)
      }
      return total
    }, 0),
    orders: userOrders,
    nextConsultation: upcomingConsultations[0] ?? null,
    membership,
  }
}
