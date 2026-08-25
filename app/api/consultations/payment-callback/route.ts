import { NextResponse } from 'next/server'
import { settleConsultationPayment } from '@/lib/consultation-payments'

function redirectToBooking(request: Request, params: Record<string, string>) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const base = configured && /^https?:\/\//i.test(configured) ? configured.replace(/\/$/, '') : new URL(request.url).origin
  const target = new URL('/book-consultation', base)
  for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value)
  return NextResponse.redirect(target)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const txRef = url.searchParams.get('tx_ref')?.trim() || ''
  const transactionId = url.searchParams.get('transaction_id')?.trim() || ''
  const status = url.searchParams.get('status')?.trim().toLowerCase() || ''
  if (!txRef) return redirectToBooking(request, { payment: 'failed', message: 'The payment reference was missing.' })
  if (status === 'cancelled' || status === 'failed') return redirectToBooking(request, { payment: 'failed', tx_ref: txRef, message: 'The payment was cancelled or failed. Your time has not been confirmed.' })

  const result = await settleConsultationPayment({ txRef, transactionId })
  if (result.success) return redirectToBooking(request, { payment: 'success', consultationId: result.consultationId })
  if (result.status === 'paid_review') return redirectToBooking(request, { payment: 'review', tx_ref: txRef })
  return redirectToBooking(request, { payment: 'pending', tx_ref: txRef, message: result.error || 'Payment is still being verified. Please check your portal shortly.' })
}
