import { auth } from '@clerk/nextjs/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'
import { settleOrderPayment } from '@/lib/order-payments'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Please sign in to reconcile this order.' }, { status: 401 })

    const orderRef = new URL(request.url).searchParams.get('ref')?.trim() || ''
    if (!orderRef) return Response.json({ error: 'Order reference required.' }, { status: 400 })

    const order = await db.query.orders.findFirst({ where: and(eq(orders.orderNumber, orderRef), eq(orders.userId, userId)), columns: { orderNumber: true } })
    if (!order) return Response.json({ error: 'Order not found.' }, { status: 404 })

    const result = await settleOrderPayment({ orderRef: order.orderNumber })
    return Response.json({ status: result.status, success: result.success, error: result.error || null })
  } catch (error) {
    console.error('[order-payment] reconciliation failed:', error)
    return Response.json({ error: 'We could not re-check this order yet.' }, { status: 500 })
  }
}
