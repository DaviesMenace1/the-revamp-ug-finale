import { and, desc, eq, gte } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { carts, consultations, memberships, orders } from '@/lib/db/schema'
import { getCurrentUser, getUserMembership } from '@/lib/auth/utils'

export async function getAccountOverview() {
  const user = await getCurrentUser()
  if (!user) return null

  const [cart, userOrders, upcomingConsultations, membership] = await Promise.all([
    db.select().from(carts).where(eq(carts.userId, user.id)).limit(1),
    db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(3),
    db
      .select()
      .from(consultations)
      .where(and(eq(consultations.userId, user.id), gte(consultations.preferredDate, new Date())))
      .orderBy(consultations.preferredDate)
      .limit(1),
    getUserMembership(user.id),
  ])

  const cartItems = Array.isArray(cart[0]?.items) ? cart[0].items : []

  return {
    user,
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
