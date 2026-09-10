import { and, eq, gte, lt } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { carts, notifications, orders, users } from '@/lib/db/schema'
import { notifyUser } from '@/lib/notifications/service'

const DEFAULT_ABANDONED_AFTER_HOURS = 24
const MAX_CARTS_PER_RUN = 100

function abandonedAfterHours() {
  const configured = Number(process.env.ABANDONED_CART_AFTER_HOURS)
  return Number.isFinite(configured) && configured > 0 ? Math.min(configured, 168) : DEFAULT_ABANDONED_AFTER_HOURS
}

function cartItems(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as Record<string, unknown>[] : []
}

function itemName(item: Record<string, unknown>) {
  const product = item.product && typeof item.product === 'object' ? item.product as Record<string, unknown> : null
  const name = item.name || product?.name || item.title
  return typeof name === 'string' && name.trim() ? name.trim().slice(0, 120) : 'Saved selection'
}

export async function sendAbandonedCartNotifications(now = new Date()) {
  const staleBefore = new Date(now.getTime() - abandonedAfterHours() * 60 * 60 * 1000)
  const candidates = await db
    .select({
      cartId: carts.id,
      userId: users.id,
      clerkId: users.clerkId,
      items: carts.items,
      updatedAt: carts.updatedAt,
    })
    .from(carts)
    .innerJoin(users, eq(carts.userId, users.id))
    .where(lt(carts.updatedAt, staleBefore))
    .limit(MAX_CARTS_PER_RUN)

  const summary = { scanned: candidates.length, sent: 0, skipped: 0, failed: 0 }

  for (const candidate of candidates) {
    const items = cartItems(candidate.items)
    if (!items.length) {
      summary.skipped += 1
      continue
    }

    const completedOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.userId, candidate.clerkId),
        eq(orders.paymentStatus, 'completed'),
        gte(orders.createdAt, candidate.updatedAt),
      ),
      columns: { id: true },
    })
    if (completedOrder) {
      summary.skipped += 1
      continue
    }

    const existingNotification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.userId, candidate.userId),
        eq(notifications.type, 'abandoned_cart'),
        gte(notifications.createdAt, candidate.updatedAt),
      ),
      columns: { id: true },
    })
    if (existingNotification) {
      summary.skipped += 1
      continue
    }

    const itemCount = items.reduce((total, item) => total + Math.max(1, Number(item.quantity) || 1), 0)
    const names = items.slice(0, 3).map(itemName)
    const result = await notifyUser({
      userId: candidate.userId,
      type: 'abandoned_cart',
      priority: 'marketing',
      title: 'Your saved selection is waiting',
      message: `You still have ${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your cart${names.length ? `, including ${names.join(', ')}` : ''}. Return when you are ready to continue.`,
      actionUrl: '/cart',
      metadata: {
        cartId: candidate.cartId,
        itemCount,
        itemNames: names,
        updatedAt: candidate.updatedAt.toISOString(),
      },
      channels: ['in_app', 'push', 'email'],
    })

    if (result.success) summary.sent += 1
    else summary.failed += 1
  }

  return summary
}
