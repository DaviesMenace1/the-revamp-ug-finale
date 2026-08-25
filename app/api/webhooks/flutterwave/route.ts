import { NextRequest, NextResponse } from 'next/server'
import { settleConsultationPayment } from '@/lib/consultation-payments'
import { isValidFlutterwaveWebhookSignature, retrieveFlutterwaveCharge } from '@/lib/flutterwave-config'
import { settleOrderPayment } from '@/lib/order-payments'
import { settleSubscriptionPayment } from '@/lib/subscription-payments'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const v4Signature = request.headers.get('flutterwave-signature')
    const legacySignature = request.headers.get('verif-hash')
    const legacyHash = process.env.FLUTTERWAVE_SECRET_HASH?.trim()
    const signatureValid = v4Signature
      ? isValidFlutterwaveWebhookSignature(rawBody, v4Signature, legacyHash)
      : Boolean(legacySignature && legacyHash && legacySignature === legacyHash)
    if (!signatureValid) return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 })

    const payload = JSON.parse(rawBody) as { type?: string; event?: string; data?: Record<string, unknown> }
    const data = payload.data || {}
    const eventType = payload.type || payload.event
    const paymentStatus = String(data.status || '').toLowerCase()
    const chargeId = String(data.id || '').trim()
    let orderRef = String(data.reference || data.tx_ref || '').trim()

    if (eventType !== 'charge.completed' || !['succeeded', 'successful'].includes(paymentStatus) || !chargeId) {
      return NextResponse.json({ status: 'ignored' })
    }

    if (!orderRef) {
      try {
        const chargeResult = await retrieveFlutterwaveCharge(chargeId)
        const charge = chargeResult.payload?.data
        orderRef = String(charge?.reference || charge?.tx_ref || '').trim()
      } catch (error) {
        console.error('[flutterwave-webhook] charge lookup for missing reference failed:', error)
      }
    }
    if (!orderRef) return NextResponse.json({ status: 'acknowledged', reason: 'missing_reference' })

    if (orderRef.startsWith('REV-CONS-')) {
      const consultationResult = await settleConsultationPayment({ txRef: orderRef, transactionId: chargeId })
      if (consultationResult.success) return NextResponse.json({ status: 'success', scope: 'consultation' })
      return NextResponse.json({ status: consultationResult.status, error: consultationResult.error })
    }

    if (orderRef.startsWith('REV-SUB-')) {
      const subscriptionResult = await settleSubscriptionPayment({ transactionReference: orderRef, chargeId })
      if (subscriptionResult.success) return NextResponse.json({ status: 'success', scope: 'subscription' })
      return NextResponse.json({ status: subscriptionResult.status, error: subscriptionResult.error })
    }

    const orderResult = await settleOrderPayment({ orderRef, chargeId })
    if (orderResult.success) return NextResponse.json({ status: 'success', scope: 'order' })
    if (orderResult.status === 'not_found') return NextResponse.json({ status: 'acknowledged', message: 'Order not found' })
    return NextResponse.json({ status: orderResult.status, error: orderResult.error })
  } catch (error) {
    console.error('Flutterwave v4 webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
