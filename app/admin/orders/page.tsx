import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { orders, users } from '@/lib/db/schema'
import { safeQuery } from '@/lib/server/safe-query'
import OrdersClient from './orders-client'

export const dynamic = 'force-dynamic'

function parseJson(value: unknown, fallback: unknown) {
  if (typeof value !== 'string') return value ?? fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

async function getAdminOrders() {
  const result = await safeQuery(
    db
      .select({
        order: orders,
        customerFirstName: users.firstName,
        customerLastName: users.lastName,
        customerEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(users.clerkId, orders.userId))
      .orderBy(desc(orders.createdAt))
      .limit(200),
    'admin orders page',
    [],
  )

  const formattedOrders = result.data.map(({ order, customerFirstName, customerLastName, customerEmail }) => ({
    ...order,
    customerFirstName,
    customerLastName,
    customerEmail,
    items: parseJson(order.items, []),
    deliveryAddress: parseJson(order.deliveryAddress, {}),
  }))

  return {
    orders: formattedOrders,
    loadError: result.error ? 'The order list is temporarily unavailable. No order data was changed.' : null,
  }
}

export default async function AdminOrdersPage() {
  const { orders: initialOrders, loadError } = await getAdminOrders()
  return <OrdersClient initialOrders={initialOrders} loadError={loadError} />
}
