import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { and, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db/client'
import { consultationPaymentIntents } from '@/lib/db/schema'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { encryptFlutterwavePin, getFlutterwaveAuthorizationType, updateFlutterwaveCharge, flutterwaveErrorMessage } from '@/lib/flutterwave-config'
import { settleConsultationPayment } from '@/lib/consultation-payments'

type AuthorizationBody = { paymentIntentId?: unknown; authorizationType?: unknown; code?: unknown }

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Please sign in before authorizing this payment.' }, { status: 401 })
    const user = await getOrCreateCurrentUser(clerkId)
    if (!user) return NextResponse.json({ error: 'Your account is not ready yet. Please try again.' }, { status: 503 })
    const body = await request.json() as AuthorizationBody
    const paymentIntentId = text(body.paymentIntentId, 80)
    const authorizationType = text(body.authorizationType, 20).toLowerCase()
    const code = text(body.code, 12)
    if (!/^[0-9a-f-]{36}$/i.test(paymentIntentId) || !['pin', 'otp'].includes(authorizationType)) return NextResponse.json({ error: 'This payment authorization request is invalid.' }, { status: 400 })
    if (!/^\d{4,6}$/.test(code)) return NextResponse.json({ error: 'Enter the numeric authorization code supplied for this Sandbox test.' }, { status: 400 })

    const intent = await db.query.consultationPaymentIntents.findFirst({ where: and(eq(consultationPaymentIntents.id, paymentIntentId), eq(consultationPaymentIntents.userId, user.id)) })
    if (!intent) return NextResponse.json({ error: 'The consultation payment could not be found.' }, { status: 404 })
    if (intent.status === 'paid' || intent.status === 'paid_review') return NextResponse.json({ success: true, status: 'paid', consultationId: intent.consultationId })
    const metadata = (intent.metadata || {}) as Record<string, unknown>
    const chargeId = typeof metadata.flutterwaveChargeId === 'string' ? metadata.flutterwaveChargeId : ''
    if (!/^chg_[A-Za-z0-9]+$/.test(chargeId)) return NextResponse.json({ error: 'The payment authorization session has expired. Please start again.' }, { status: 409 })
    const expectedType = typeof metadata.authorizationType === 'string' ? metadata.authorizationType : ''
    if (expectedType && expectedType !== authorizationType) return NextResponse.json({ error: 'Use the authorization method requested by Flutterwave.' }, { status: 400 })

    const authorization = authorizationType === 'pin'
      ? { type: 'pin', pin: await encryptFlutterwavePin(code) }
      : { type: 'otp', otp: { code } }
    const result = await updateFlutterwaveCharge(chargeId, authorization, randomUUID())
    const payload = result.payload || {}
    const charge = payload.data
    if (!result.response?.ok || !['success', 'pending'].includes(String(payload.status || '').toLowerCase()) || !charge?.id) return NextResponse.json({ error: flutterwaveErrorMessage(payload, result.response?.status || 502) }, { status: result.response?.status === 401 ? 503 : 502 })

    if (charge.status === 'succeeded') {
      const settled = await settleConsultationPayment({ txRef: intent.txRef, transactionId: String(charge.id) })
      if (settled.success) return NextResponse.json({ success: true, status: settled.status, consultationId: settled.consultationId })
      return NextResponse.json({ error: settled.error, status: settled.status }, { status: settled.status === 'pending' ? 202 : 400 })
    }

    const nextType = getFlutterwaveAuthorizationType(charge)
    return NextResponse.json({ success: true, status: 'pending', authorizationType: nextType, paymentUrl: charge.next_action?.redirect_url?.url || null, paymentInstruction: charge.next_action?.payment_instruction?.note || 'The payment is still awaiting authorization.' })
  } catch (error) {
    console.error('[consultation-payment] v4 authorization failed:', error)
    return NextResponse.json({ error: 'We could not authorize this payment. Please try again.' }, { status: 500 })
  }
}
