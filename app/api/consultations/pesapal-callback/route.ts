import { NextResponse } from 'next/server'
import { getPesapalTransactionStatus, pesapalStatus } from '@/lib/pesapal/client'
import { failConsultationPayment, settleConsultationPayment } from '@/lib/consultation-payments'

function redirectToBooking(request: Request, params: Record<string, string>) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const base = configured && /^https?:\/\//i.test(configured) ? configured.replace(/\/$/, '') : new URL(request.url).origin
  const target = new URL('/book-consultation', base)
  for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value)
  return NextResponse.redirect(target)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const trackingId = url.searchParams.get('OrderTrackingId')?.trim() || url.searchParams.get('orderTrackingId')?.trim() || ''
  const callbackReference = url.searchParams.get('OrderMerchantReference')?.trim() || url.searchParams.get('reference')?.trim() || url.searchParams.get('tx_ref')?.trim() || ''
  if (!trackingId) return redirectToBooking(request, { payment: 'failed', message: 'The Pesapal payment reference was missing. Please start the payment again.' })

  try {
    const status = await getPesapalTransactionStatus(trackingId)
    const txRef = String(status.merchant_reference || callbackReference).trim()
    if (!txRef) return redirectToBooking(request, { payment: 'failed', message: 'The consultation payment could not be matched. Please start again.' })
    const normalized = pesapalStatus(status)
    if (normalized === 'failed' || normalized === 'reversed' || normalized === 'invalid') {
      await failConsultationPayment(txRef)
      return redirectToBooking(request, { payment: 'failed', tx_ref: txRef, message: 'The payment was not completed. Your consultation time has been released.' })
    }
    const result = await settleConsultationPayment({ txRef, transactionId: trackingId })
    if (result.success) return redirectToBooking(request, { payment: 'success', tx_ref: txRef, consultationId: result.consultationId })
    if (result.status === 'paid_review') return redirectToBooking(request, { payment: 'review', tx_ref: txRef })
    return redirectToBooking(request, { payment: 'pending', tx_ref: txRef, message: result.error || 'Payment is still being verified. Please check your portal shortly.' })
  } catch (error) {
    console.error('[consultation-payment] Pesapal callback failed:', error)
    return redirectToBooking(request, { payment: 'pending', tx_ref: callbackReference, message: 'Payment is still being verified. Please check your portal shortly.' })
  }
}
