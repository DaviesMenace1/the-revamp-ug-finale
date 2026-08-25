import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { safelyReleasePointsForOrder } from '@/lib/loyalty/service'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

  try {
    const body = (await request.json()) as { txRef?: unknown }
    const txRef = typeof body.txRef === 'string' ? body.txRef.trim() : ''
    if (!txRef) return NextResponse.json({ error: 'Missing order reference.' }, { status: 400 })

    const [order] = await db
      .select({ id: orders.id, userId: orders.userId, paymentStatus: orders.paymentStatus })
      .from(orders)
      .where(eq(orders.orderNumber, txRef))
      .limit(1)
    if (!order || order.userId !== userId) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    if (order.paymentStatus !== 'pending') return NextResponse.json({ released: false }, { status: 200 })

    await db.update(orders).set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() }).where(eq(orders.id, order.id))
    const result = await safelyReleasePointsForOrder(order.id)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[checkout] release points failed:', error)
    return NextResponse.json({ error: 'The checkout could not be cancelled cleanly. Please contact support if your points do not return.' }, { status: 500 })
  }
}
