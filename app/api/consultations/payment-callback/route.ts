import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { consultationPaymentIntents } from '@/lib/db/schema'
import { settleConsultationPayment } from '@/lib/consultation-payments'
import { retrieveFlutterwaveCharge } from '@/lib/flutterwave-config'

function redirectToBooking(request: Request, params: Record<string, string>) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const base = configured && /^https?:\/\//i.test(configured) ? configured.replace(/\/$/, '') : new URL(request.url).origin
  const target = new URL('/book-consultation', base)
  for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value)
  return NextResponse.redirect(target)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const txRef = url.searchParams.get('reference')?.trim() || url.searchParams.get('tx_ref')?.trim() || ''
  const transactionId = url.searchParams.get('id')?.trim() || url.searchParams.get('charge_id')?.trim() || url.searchParams.get('transaction_id')?.trim() || ''
  const status = url.searchParams.get('status')?.trim().toLowerCase() || ''
  let resolvedTxRef = txRef
  let effectiveTransactionId = transactionId
  if (!resolvedTxRef && effectiveTransactionId) {
    try {
      const chargeResult = await retrieveFlutterwaveCharge(effectiveTransactionId)
      const charge = chargeResult.payload?.data
      resolvedTxRef = String(charge?.reference || charge?.tx_ref || '').trim()
    } catch (error) {
      console.error('[consultation-payment] callback charge lookup failed:', error)
      return redirectToBooking(request, { payment: 'failed', message: 'The payment could not be matched yet. Please start the payment again.' })
    }
  }
  if (!resolvedTxRef) return redirectToBooking(request, { payment: 'failed', message: transactionId ? 'Flutterwave returned no payment reference for this charge. Please start the payment again.' : 'The payment reference was missing. Please start the payment again.' })
  if (status === 'cancelled' || status === 'failed') return redirectToBooking(request, { payment: 'failed', tx_ref: resolvedTxRef, message: 'The payment was cancelled or failed. Your time has not been confirmed.' })

  if (!effectiveTransactionId) {
    const intent = await db.query.consultationPaymentIntents.findFirst({ where: eq(consultationPaymentIntents.txRef, resolvedTxRef), columns: { flutterwaveTransactionId: true, metadata: true } })
    const metadata = intent?.metadata && typeof intent.metadata === 'object' ? intent.metadata as Record<string, unknown> : {}
    const storedChargeId = typeof metadata.flutterwaveChargeId === 'string' ? metadata.flutterwaveChargeId : ''
    effectiveTransactionId = intent?.flutterwaveTransactionId || storedChargeId
  }

  const result = await settleConsultationPayment({ txRef: resolvedTxRef, transactionId: effectiveTransactionId })
  if (result.success) return redirectToBooking(request, { payment: 'success', tx_ref: resolvedTxRef, consultationId: result.consultationId })
  if (result.status === 'paid_review') return redirectToBooking(request, { payment: 'review', tx_ref: resolvedTxRef })
  return redirectToBooking(request, { payment: 'pending', tx_ref: resolvedTxRef, message: result.error || 'Payment is still being verified. Please check your portal shortly.' })
}
