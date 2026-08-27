'use server'

import { db } from '@/lib/db/client'
import { orders, orderShipments, orderTrackingEvents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithRole } from '@/lib/auth/server'

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const authorization = await getCurrentUserWithRole(['admin', 'operations_manager'])
  if (!authorization.authorized || !authorization.user) return { success: false, error: 'You are not authorized to update orders.' }
  try {
    const now = new Date()
    await db.update(orders).set({ status, updatedAt: now }).where(eq(orders.id, orderId))
    const shipmentStatus = status === 'cancelled' ? 'cancelled' : status === 'delivered' ? 'delivered' : status === 'shipped' ? 'out_for_delivery' : status === 'processing' || status === 'confirmed' ? 'processing' : 'awaiting_payment'
    const [shipment] = await db.select({ id: orderShipments.id }).from(orderShipments).where(eq(orderShipments.orderId, orderId)).limit(1)
    if (shipment) {
      await db.update(orderShipments).set({ status: shipmentStatus, lastNote: `Order status updated to ${status}.`, updatedAt: now, deliveredAt: shipmentStatus === 'delivered' ? now : undefined }).where(eq(orderShipments.id, shipment.id))
      await db.insert(orderTrackingEvents).values({ orderId, shipmentId: shipment.id, status: shipmentStatus, note: `Order status updated to ${status}.`, actorId: authorization.user.id, customerVisible: true })
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
