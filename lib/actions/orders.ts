'use server'

import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    await db
      .update(orders)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    revalidatePath('/admin/orders')
    return { success: true }
  } catch (error) {
    console.error('Failed to update order status:', error)
    return { success: false, error: 'Failed to update status' }
  }
}

export async function deleteOrder(orderId: string) {
  try {
    await db.delete(orders).where(eq(orders.id, orderId))
    revalidatePath('/admin/orders')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete order:', error)
    return { success: false, error: 'Failed to delete order' }
  }
}
