'use server'

import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithRole } from '@/lib/auth/server'

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false, error: 'You are not authorized to update orders.' }
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
