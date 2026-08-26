import { and, desc, eq, gte } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/client'
import { carts, consultations, orders } from '@/lib/db/schema'
import { getOrCreateCurrentUser, getUserMembership } from '@/lib/auth/utils'
import { getLoyaltyOverview, attributeReferralCodeForUser } from '@/lib/loyalty/service'
import { safeQuery } from '@/lib/server/safe-query'

type AccountUser = NonNullable<Awaited<ReturnType<typeof getOrCreateCurrentUser>>>

export async function getAccountOverview(userOverride?: AccountUser) {
  // The account page passes the profile it already resolved at the protected
  // route boundary. Other server callers can still use the on-demand path.
  const user = userOverride ?? (await getOrCreateCurrentUser())
  if (!user) return null

  const referralCode = (await cookies()).get('revamp_referral')?.value
  const [cartResult, ordersResult, consultationsResult, membershipResult, loyaltyResult] = await Promise.all([
    safeQuery(
      db.select().from(carts).where(eq(carts.userId, user.id)).limit(1),
      'account cart',
      [],
    ),
    safeQuery(
      db.select().from(orders).where(eq(orders.userId, user.clerkId)).orderBy(desc(orders.createdAt)).limit(3),
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
    safeQuery(getLoyaltyOverview(user.id), 'account loyalty', null),
  ])
  if (referralCode) {
    void safeQuery(attributeReferralCodeForUser(user.id, referralCode), 'account referral attribution', null)
  }

  const cart = cartResult.data
  const userOrders = ordersResult.data
  const upcomingConsultations = consultationsResult.data
  const membership = membershipResult.data
  const loyalty = loyaltyResult.data
  const cartItems = Array.isArray(cart[0]?.items) ? cart[0].items : []
  const loadError = [cartResult, ordersResult, consultationsResult, membershipResult, loyaltyResult].some((result) => result.error)

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
    loyalty,
  }
}
