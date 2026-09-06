import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'
import { getPesapalTransactionStatus, pesapalStatus } from '@/lib/pesapal/client'
import { cancelPendingOrder, settleOrderPayment } from '@/lib/order-payments'
import { failConsultationPayment, settleConsultationPayment } from '@/lib/consultation-payments'

async function values(request: NextRequest) {
  const url = new URL(request.url)
  const query = url.searchParams
  if (request.method === 'GET') return query
  const form = await request.formData().catch(() => null)
  if (form) {
    for (const [key, value] of form.entries()) if (typeof value === 'string') query.set(key, value)
  }
  if (!query.get('OrderTrackingId')) {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    if (body) for (const [key, value] of Object.entries(body)) if (typeof value === 'string' || typeof value === 'number') query.set(key, String(value))
  }
  return query
}

async function processNotification(request: NextRequest) {
  const params = await values(request)
  const trackingId = params.get('OrderTrackingId')?.trim() || params.get('orderTrackingId')?.trim() || ''
  const callbackReference = params.get('OrderMerchantReference')?.trim() || params.get('orderMerchantReference')?.trim() || ''
  if (!trackingId) return { status: 'ignored', reason: 'missing_tracking_id' }

  const status = await getPesapalTransactionStatus(trackingId)
  const reference = String(status.merchant_reference || callbackReference).trim()
  if (!reference) return { status: 'ignored', reason: 'missing_merchant_reference' }
  const normalized = pesapalStatus(status)

  if (reference.startsWith('REV-CONS-')) {
    if (normalized === 'failed' || normalized === 'reversed' || normalized === 'invalid') {
      await failConsultationPayment(reference)
      return { status: 'processed', scope: 'consultation', paymentStatus: normalized }
    }
    const result = await settleConsultationPayment({ txRef: reference, transactionId: trackingId })
    return { status: result.success ? 'processed' : result.status, scope: 'consultation', paymentStatus: normalized }
  }

  if (reference.startsWith('REV-SUB-')) return { status: 'ignored', scope: 'subscription', reason: 'subscription_payments_disabled' }

  if (normalized === 'failed' || normalized === 'reversed' || normalized === 'invalid') {
    const order = await db.query.orders.findFirst({ where: eq(orders.orderNumber, reference), columns: { id: true } })
    if (order) await cancelPendingOrder(order.id)
    return { status: 'processed', scope: 'order', paymentStatus: normalized }
  }
  const result = await settleOrderPayment({ orderRef: reference, trackingId })
  return { status: result.success ? 'processed' : result.status, scope: 'order', paymentStatus: normalized }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await processNotification(request))
  } catch (error) {
    console.error('[pesapal-ipn] GET failed:', error)
    return NextResponse.json({ status: 'retry', error: 'Notification processing failed.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(await processNotification(request))
  } catch (error) {
    console.error('[pesapal-ipn] POST failed:', error)
    return NextResponse.json({ status: 'retry', error: 'Notification processing failed.' }, { status: 500 })
  }
}
