import { NextRequest, NextResponse } from 'next/server'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { orders, paymentRecords } from '@/lib/db/schema'
import { safelyReleasePointsForOrder } from '@/lib/loyalty/service'
import { settleOrderPayment } from '@/lib/order-payments'
import { retrieveFlutterwaveCharge } from '@/lib/flutterwave-config'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderRef = searchParams.get('reference') || searchParams.get('tx_ref') || ''
  const chargeId = searchParams.get('id') || searchParams.get('charge_id') || searchParams.get('transaction_id') || ''
  const status = (searchParams.get('status') || '').toLowerCase()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
  let resolvedOrderRef = orderRef
  if (!resolvedOrderRef && chargeId) {
    try {
      const chargeResult = await retrieveFlutterwaveCharge(chargeId)
      const charge = chargeResult.payload?.data
      resolvedOrderRef = String(charge?.reference || charge?.tx_ref || '').trim()
    } catch (error) {
      console.error('Error retrieving Flutterwave charge for checkout callback:', error)
      return NextResponse.redirect(`${baseUrl}/checkout/failed?error=payment_match_failed`)
    }
  }

  if (!resolvedOrderRef) return NextResponse.redirect(`${baseUrl}/checkout/failed?error=missing_ref`)
  if (status === 'cancelled' || status === 'failed') {
    const [order] = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.orderNumber, resolvedOrderRef), ne(orders.paymentStatus, 'completed'))).limit(1)
    if (order) {
      await db.update(orders).set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() }).where(and(eq(orders.id, order.id), ne(orders.paymentStatus, 'completed')))
      await safelyReleasePointsForOrder(order.id)
    }
    return NextResponse.redirect(`${baseUrl}/checkout/failed?orderRef=${encodeURIComponent(resolvedOrderRef)}&reason=cancelled`)
  }
  let effectiveChargeId = chargeId
  if (!effectiveChargeId) {
    const pendingOrder = await db.query.orders.findFirst({ where: eq(orders.orderNumber, resolvedOrderRef), columns: { id: true } })
    if (pendingOrder) {
      const pendingPayment = await db.query.paymentRecords.findFirst({ where: and(eq(paymentRecords.orderId, pendingOrder.id), eq(paymentRecords.status, 'pending')), columns: { transactionReference: true } })
      effectiveChargeId = pendingPayment?.transactionReference || ''
    }
  }
  if (!effectiveChargeId) return NextResponse.redirect(`${baseUrl}/checkout/pending?orderRef=${encodeURIComponent(resolvedOrderRef)}&message=The%20payment%20is%20still%20being%20authorized.`)

  try {
    const result = await settleOrderPayment({ orderRef: resolvedOrderRef, chargeId: effectiveChargeId })
    if (result.success) return NextResponse.redirect(`${baseUrl}/checkout/success?orderRef=${encodeURIComponent(resolvedOrderRef)}&charge_id=${encodeURIComponent(effectiveChargeId)}`)
    if (result.status === 'pending') return NextResponse.redirect(`${baseUrl}/checkout/pending?orderRef=${encodeURIComponent(resolvedOrderRef)}`)
    return NextResponse.redirect(`${baseUrl}/checkout/failed?orderRef=${encodeURIComponent(resolvedOrderRef)}&error=payment_unverified`)
  } catch (error) {
    console.error('Error verifying Flutterwave v4 checkout callback:', error)
    return NextResponse.redirect(`${baseUrl}/checkout/failed?orderRef=${encodeURIComponent(resolvedOrderRef)}&error=server_error`)
  }
}
