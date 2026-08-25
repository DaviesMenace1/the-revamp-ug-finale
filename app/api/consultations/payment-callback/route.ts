import { NextResponse } from 'next/server'
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
  if (!resolvedTxRef && transactionId) {
    try {
      const chargeResult = await retrieveFlutterwaveCharge(transactionId)
      const charge = chargeResult.payload?.data
      resolvedTxRef = String(charge?.reference || charge?.tx_ref || '').trim()
    } catch (error) {
      console.error('[consultation-payment] callback charge lookup failed:', error)
      return redirectToBooking(request, { payment: 'failed', message: 'The payment could not be matched yet. Please start the payment again.' })
    }
  }
  if (!resolvedTxRef) return redirectToBooking(request, { payment: 'failed', message: transactionId ? 'Flutterwave returned no payment reference for this charge. Please start the payment again.' : 'The payment reference was missing. Please start the payment again.' })
  if (status === 'cancelled' || status === 'failed') return redirectToBooking(request, { payment: 'failed', tx_ref: resolvedTxRef, message: 'The payment was cancelled or failed. Your time has not been confirmed.' })

  const result = await settleConsultationPayment({ txRef: resolvedTxRef, transactionId })
  if (result.success) return redirectToBooking(request, { payment: 'success', consultationId: result.consultationId })
  if (result.status === 'paid_review') return redirectToBooking(request, { payment: 'review', tx_ref: resolvedTxRef })
  return redirectToBooking(request, { payment: 'pending', tx_ref: resolvedTxRef, message: result.error || 'Payment is still being verified. Please check your portal shortly.' })
}
