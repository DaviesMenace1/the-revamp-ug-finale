import { NextRequest, NextResponse } from 'next/server'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'
import { safelyReleasePointsForOrder } from '@/lib/loyalty/service'
import { settleOrderPayment } from '@/lib/order-payments'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderRef = searchParams.get('reference') || searchParams.get('tx_ref') || ''
  const chargeId = searchParams.get('id') || searchParams.get('charge_id') || searchParams.get('transaction_id') || ''
  const status = (searchParams.get('status') || '').toLowerCase()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

  if (!orderRef) return NextResponse.redirect(`${baseUrl}/checkout/failed?error=missing_ref`)
  if (status === 'cancelled' || status === 'failed') {
    const [order] = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.orderNumber, orderRef), ne(orders.paymentStatus, 'completed'))).limit(1)
    if (order) {
      await db.update(orders).set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() }).where(and(eq(orders.id, order.id), ne(orders.paymentStatus, 'completed')))
      await safelyReleasePointsForOrder(order.id)
    }
    return NextResponse.redirect(`${baseUrl}/checkout/failed?orderRef=${encodeURIComponent(orderRef)}&reason=cancelled`)
  }
  if (!chargeId) return NextResponse.redirect(`${baseUrl}/checkout/failed?orderRef=${encodeURIComponent(orderRef)}&error=no_charge_id`)

  try {
    const result = await settleOrderPayment({ orderRef, chargeId })
    if (result.success) return NextResponse.redirect(`${baseUrl}/checkout/success?orderRef=${encodeURIComponent(orderRef)}&charge_id=${encodeURIComponent(chargeId)}`)
    if (result.status === 'pending') return NextResponse.redirect(`${baseUrl}/checkout/pending?orderRef=${encodeURIComponent(orderRef)}`)
    return NextResponse.redirect(`${baseUrl}/checkout/failed?orderRef=${encodeURIComponent(orderRef)}&error=payment_unverified`)
  } catch (error) {
    console.error('Error verifying Flutterwave v4 checkout callback:', error)
    return NextResponse.redirect(`${baseUrl}/checkout/failed?orderRef=${encodeURIComponent(orderRef)}&error=server_error`)
  }
}
