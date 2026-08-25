import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { programSubscriptions } from '@/lib/db/schema'
import { retrieveFlutterwaveCharge } from '@/lib/flutterwave-config'
import { settleSubscriptionPayment, failSubscriptionPayment } from '@/lib/subscription-payments'

function redirectToProgram(request: NextRequest, params: Record<string, string>) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin).replace(/\/$/, '')
  const target = params.program === 'trade' ? '/trade/pricing' : '/membership/benefits'
  const query = new URLSearchParams(params)
  return NextResponse.redirect(`${baseUrl}${target}?${query.toString()}`)
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const reference = searchParams.get('reference')?.trim() || searchParams.get('tx_ref')?.trim() || ''
  const chargeId = searchParams.get('id')?.trim() || searchParams.get('charge_id')?.trim() || searchParams.get('transaction_id')?.trim() || ''
  const status = searchParams.get('status')?.trim().toLowerCase() || ''
  let resolvedReference = reference
  let effectiveChargeId = chargeId
  let program = searchParams.get('program')?.trim().toLowerCase() === 'trade' ? 'trade' : 'membership'

  if (!resolvedReference && effectiveChargeId) {
    try {
      const result = await retrieveFlutterwaveCharge(effectiveChargeId)
      const charge = result.payload?.data
      resolvedReference = String(charge?.reference || charge?.tx_ref || '').trim()
      const chargeProgram = String(charge?.reference || charge?.tx_ref || '').toUpperCase().includes('REV-SUB-TRADE-') ? 'trade' : null
      if (chargeProgram) program = chargeProgram
    } catch (error) {
      console.error('[subscription-payment] callback charge lookup failed:', error)
      return redirectToProgram(request, { program, payment: 'failed', message: 'The subscription payment could not be matched. Please start again.' })
    }
  }

  if (!resolvedReference) return redirectToProgram(request, { program, payment: 'failed', message: 'The payment reference was missing. Please start again.' })
  if (status === 'cancelled' || status === 'failed') {
    await failSubscriptionPayment(resolvedReference)
    return redirectToProgram(request, { program, payment: 'failed', tx_ref: resolvedReference, message: 'The subscription payment was cancelled or failed.' })
  }

  if (!effectiveChargeId) {
    const subscription = await db.query.programSubscriptions.findFirst({
      where: eq(programSubscriptions.transactionReference, resolvedReference),
      columns: { providerChargeId: true, program: true },
    })
    effectiveChargeId = subscription?.providerChargeId || ''
    if (subscription?.program === 'trade' || subscription?.program === 'membership') program = subscription.program
  }
  if (!effectiveChargeId) return redirectToProgram(request, { program, payment: 'pending', tx_ref: resolvedReference, message: 'The subscription payment is still awaiting authorization.' })

  try {
    const result = await settleSubscriptionPayment({ transactionReference: resolvedReference, chargeId: effectiveChargeId })
    if (result.success) return redirectToProgram(request, { program, payment: 'success', tx_ref: resolvedReference, subscriptionId: result.subscriptionId })
    if (result.status === 'pending') return redirectToProgram(request, { program, payment: 'pending', tx_ref: resolvedReference, message: result.error || 'The subscription payment is still awaiting authorization.' })
    return redirectToProgram(request, { program, payment: 'failed', tx_ref: resolvedReference, message: result.error || 'The subscription payment could not be verified.' })
  } catch (error) {
    console.error('[subscription-payment] callback settlement failed:', error)
    return redirectToProgram(request, { program, payment: 'failed', message: 'The subscription payment could not be verified yet. Please try again.' })
  }
}
