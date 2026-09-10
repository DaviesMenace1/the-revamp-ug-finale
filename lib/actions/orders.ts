'use server'

import { db } from '@/lib/db/client'
import { orders, orderShipments, orderTrackingEvents, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { notifyUser } from '@/lib/notifications/service'

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const authorization = await getCurrentUserWithRole(['admin', 'operations_manager'])
  if (!authorization.authorized || !authorization.user) return { success: false, error: 'You are not authorized to update orders.' }
  try {
    const [order] = await db.select({ id: orders.id, orderNumber: orders.orderNumber, userId: orders.userId, total: orders.total, paymentMode: orders.paymentMode, paymentMethod: orders.paymentMethod, deliveryAddress: orders.deliveryAddress, items: orders.items }).from(orders).where(eq(orders.id, orderId)).limit(1)
    if (!order) return { success: false, error: 'Order not found.' }
    const now = new Date()
    await db.update(orders).set({ status, updatedAt: now }).where(eq(orders.id, orderId))
    const shipmentStatus = status === 'cancelled' ? 'cancelled' : status === 'delivered' ? 'delivered' : status === 'shipped' ? 'out_for_delivery' : status === 'processing' || status === 'confirmed' ? 'processing' : 'awaiting_payment'
    const [shipment] = await db.select({ id: orderShipments.id }).from(orderShipments).where(eq(orderShipments.orderId, orderId)).limit(1)
    if (shipment) {
      await db.update(orderShipments).set({ status: shipmentStatus, lastNote: `Order status updated to ${status}.`, updatedAt: now, deliveredAt: shipmentStatus === 'delivered' ? now : undefined }).where(eq(orderShipments.id, shipment.id))
      await db.insert(orderTrackingEvents).values({ orderId, shipmentId: shipment.id, status: shipmentStatus, note: `Order status updated to ${status}.`, actorId: authorization.user.id, customerVisible: true })
    }

    const [customer] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, order.userId)).limit(1)
    if (customer) {
      const statusLabel = status.replaceAll('_', ' ')
      void notifyUser({
        userId: customer.id,
        type: 'order_update',
        priority: status === 'cancelled' ? 'important' : 'informational',
        title: `Order ${order.orderNumber}: ${statusLabel}`,
        message: `Your order is now ${statusLabel}. Open your client portal for the latest order and fulfilment details.`,
        actionUrl: `/client/orders?order=${encodeURIComponent(order.id)}`,
        metadata: { orderId: order.id, orderNumber: order.orderNumber, status, total: order.total, currency: 'UGX', paymentMode: order.paymentMode, paymentMethod: order.paymentMethod, deliveryAddress: order.deliveryAddress, items: order.items },
        channels: ['in_app', 'push', 'email'],
      }).catch((error) => console.error('[orders] customer status notification failed:', error))
    }

    revalidatePath('/admin/orders')
    revalidatePath('/admin/logistics')
    revalidatePath('/client/orders')
    revalidatePath('/track-order')
    return { success: true }
  } catch (error) {
    console.error('Failed to update order status:', error)
    return { success: false, error: 'Failed to update status' }
  }
}

export async function deleteOrder(orderId: string) {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false, error: 'You are not authorized to delete orders.' }
  try {
    await db.delete(orders).where(eq(orders.id, orderId))
    revalidatePath('/admin/orders')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete order:', error)
    return { success: false, error: 'Failed to delete order' }
  }
}
