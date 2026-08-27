import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { and, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db/client'
import { orders, paymentRecords } from '@/lib/db/schema'
import { encryptFlutterwavePin, getFlutterwaveAuthorizationType, updateFlutterwaveCharge, flutterwaveErrorMessage } from '@/lib/flutterwave-config'
import { settleOrderPayment } from '@/lib/order-payments'

 type AuthorizationBody = { orderRef?: unknown; chargeId?: unknown; authorizationType?: unknown; code?: unknown }

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Please sign in before authorizing this payment.' }, { status: 401 })
    const body = await request.json() as AuthorizationBody
    const orderRef = text(body.orderRef, 120)
    const chargeId = text(body.chargeId, 120)
    const authorizationType = text(body.authorizationType, 20).toLowerCase()
    const code = text(body.code, 12)
    if (!orderRef || !/^chg_[A-Za-z0-9]+$/.test(chargeId) || !['pin', 'otp'].includes(authorizationType)) return NextResponse.json({ error: 'This payment authorization request is invalid.' }, { status: 400 })
    if (!/^\d{4,6}$/.test(code)) return NextResponse.json({ error: 'Enter the numeric authorization code supplied for this Sandbox test.' }, { status: 400 })

    const order = await db.query.orders.findFirst({ where: and(eq(orders.orderNumber, orderRef), eq(orders.userId, userId)) })
    if (!order) return NextResponse.json({ error: 'The order could not be found.' }, { status: 404 })
    const payment = await db.query.paymentRecords.findFirst({ where: and(eq(paymentRecords.orderId, order.id), eq(paymentRecords.transactionReference, chargeId), eq(paymentRecords.status, 'pending')) })
    if (!payment) {
      if (order.paymentStatus === 'completed') return NextResponse.json({ success: true, status: 'paid', orderId: order.id })
      return NextResponse.json({ error: 'The payment authorization session has expired. Please start again.' }, { status: 409 })
    }

    const authorization = authorizationType === 'pin'
      ? { type: 'pin', pin: await encryptFlutterwavePin(code) }
      : { type: 'otp', otp: { code } }
    const result = await updateFlutterwaveCharge(chargeId, authorization, randomUUID())
    const payload = result.payload || {}
    const charge = payload.data
    if (!result.response?.ok || !['success', 'pending'].includes(String(payload.status || '').toLowerCase()) || !charge?.id) return NextResponse.json({ error: flutterwaveErrorMessage(payload, result.response?.status || 502) }, { status: result.response?.status === 401 ? 503 : 502 })

    if (String(charge.status || '').toLowerCase() === 'succeeded') {
      const settled = await settleOrderPayment({ orderRef, chargeId: String(charge.id) })
      if (settled.success) return NextResponse.json({ success: true, status: settled.status, orderId: settled.orderId })
      return NextResponse.json({ error: settled.error, status: settled.status }, { status: settled.status === 'pending' ? 202 : 400 })
    }

    const nextType = getFlutterwaveAuthorizationType(charge)
    return NextResponse.json({ success: true, status: 'pending', authorizationType: nextType, paymentUrl: charge.next_action?.redirect_url?.url || null, paymentInstruction: charge.next_action?.payment_instruction?.note || 'The payment is still awaiting authorization.' })
  } catch (error) {
    console.error('[checkout] v4 authorization failed:', error)
    return NextResponse.json({ error: 'We could not authorize this payment. Please try again.' }, { status: 500 })
  }
}
