import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'
import { getPesapalTransactionStatus, pesapalStatus } from '@/lib/pesapal/client'
import { cancelPendingOrder, settleOrderPayment } from '@/lib/order-payments'

function redirectToCheckout(request: Request, path: string, params: Record<string, string>) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const base = configured && /^https?:\/\//i.test(configured) ? configured.replace(/\/$/, '') : new URL(request.url).origin
  const target = new URL(path, base)
  for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value)
  return NextResponse.redirect(target)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const trackingId = url.searchParams.get('OrderTrackingId')?.trim() || url.searchParams.get('orderTrackingId')?.trim() || ''
  const callbackReference = url.searchParams.get('OrderMerchantReference')?.trim() || url.searchParams.get('reference')?.trim() || url.searchParams.get('tx_ref')?.trim() || ''
  if (!trackingId) return redirectToCheckout(request, '/checkout/failed', { orderRef: callbackReference, reason: 'missing_pesapal_reference' })

  try {
    const status = await getPesapalTransactionStatus(trackingId)
    const orderRef = String(status.merchant_reference || callbackReference).trim()
    if (!orderRef) return redirectToCheckout(request, '/checkout/failed', { reason: 'missing_order_reference' })
    const normalized = pesapalStatus(status)
    if (normalized === 'failed' || normalized === 'reversed' || normalized === 'invalid') {
      const order = await db.query.orders.findFirst({ where: eq(orders.orderNumber, orderRef), columns: { id: true } })
      if (order) await cancelPendingOrder(order.id)
      return redirectToCheckout(request, '/checkout/failed', { orderRef, reason: normalized })
    }
    const result = await settleOrderPayment({ orderRef, trackingId })
    if (result.success) return redirectToCheckout(request, '/checkout/success', { orderRef, tracking_id: trackingId })
    if (result.status === 'pending') return redirectToCheckout(request, '/checkout/pending', { orderRef, message: result.error || 'The payment is still being verified.' })
    return redirectToCheckout(request, '/checkout/failed', { orderRef, error: result.error || 'payment_unverified' })
  } catch (error) {
    console.error('[checkout] Pesapal callback failed:', error)
    return redirectToCheckout(request, '/checkout/pending', { orderRef: callbackReference, message: 'Payment is still being verified. Please check your account shortly.' })
  }
}
