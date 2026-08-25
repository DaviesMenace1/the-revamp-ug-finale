import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { orders, paymentRecords, users } from '@/lib/db/schema'
import { and, eq, ne } from 'drizzle-orm'
import { sendOrderReceiptEmail } from '@/lib/email/send-receipt'
import { notifyUser } from '@/lib/notifications/service'
import { generateVerifiedPaymentReceipt } from '@/lib/documents/payment-receipt'
import { safelyReleasePointsForOrder, settleSuccessfulOrderRewards } from '@/lib/loyalty/service'
import { settleConsultationPayment } from '@/lib/consultation-payments'

type DeliveryAddress = { name?: string; [key: string]: unknown }

function parseAddress(value: unknown): DeliveryAddress {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' ? parsed as DeliveryAddress : {}
    } catch {
      return {}
    }
  }
  return value && typeof value === 'object' ? value as DeliveryAddress : {}
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('verif-hash')
    if (!signature || signature !== process.env.FLUTTERWAVE_SECRET_HASH) {
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 })
    }

    const payload = await req.json()
    const data = payload?.data
    if (payload?.event !== 'charge.completed' || data?.status !== 'successful' || !data?.tx_ref) {
      return NextResponse.json({ status: 'ignored' })
    }

    if (String(data.tx_ref).startsWith('REV-CONS-')) {
      const consultationResult = await settleConsultationPayment({
        txRef: String(data.tx_ref),
        transactionId: data.id ? String(data.id) : null,
      })
      if (consultationResult.success) return NextResponse.json({ status: 'success', scope: 'consultation' })
      return NextResponse.json({ status: consultationResult.status, error: consultationResult.error }, { status: consultationResult.status === 'verification_failed' ? 400 : 500 })
    }

    const expectedCurrency = process.env.FLUTTERWAVE_CURRENCY || 'UGX'
    const existingOrder = await db.query.orders.findFirst({ where: eq(orders.orderNumber, data.tx_ref) })
    if (!existingOrder) return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    if (existingOrder.paymentStatus === 'completed') return NextResponse.json({ message: 'Order already processed' })

    const amountMatches = Number(data.amount) >= Number(existingOrder.total)
    const currencyMatches = data.currency === expectedCurrency
    if (!amountMatches || !currencyMatches) {
      await db
        .update(orders)
        .set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() })
        .where(and(eq(orders.orderNumber, data.tx_ref), ne(orders.paymentStatus, 'completed')))
      await safelyReleasePointsForOrder(existingOrder.id)
      return NextResponse.json({ error: 'Payment amount or currency mismatch' }, { status: 400 })
    }

    const [settledOrder] = await db
      .update(orders)
      .set({ status: 'confirmed', paymentStatus: 'completed', updatedAt: new Date() })
      .where(and(eq(orders.orderNumber, data.tx_ref), ne(orders.paymentStatus, 'completed')))
      .returning({ id: orders.id })
    if (!settledOrder) return NextResponse.json({ message: 'Order already processed' })

    const customer = await db.query.users.findFirst({ where: eq(users.clerkId, existingOrder.userId) })
    if (customer) {
      const [payment] = await db.insert(paymentRecords).values({
        userId: customer.id,
        orderId: existingOrder.id,
        provider: 'flutterwave',
        transactionReference: String(data.id || data.tx_ref),
        amount: String(data.amount),
        currency: String(data.currency || expectedCurrency),
        method: typeof data.payment_type === 'string' ? data.payment_type : null,
        status: 'completed',
        metadata: { txRef: data.tx_ref, transactionId: data.id, paymentType: data.payment_type },
        paidAt: new Date(),
      }).onConflictDoNothing({ target: [paymentRecords.provider, paymentRecords.transactionReference] }).returning({ id: paymentRecords.id })
      if (payment) {
        void generateVerifiedPaymentReceipt({
          paymentId: payment.id,
          userId: customer.id,
          clientName: `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || customer.email,
          clientEmail: customer.email,
          orderNumber: existingOrder.orderNumber,
          amount: String(data.amount),
          currency: String(data.currency || expectedCurrency),
          paymentMethod: typeof data.payment_type === 'string' ? data.payment_type : null,
          transactionReference: String(data.id || data.tx_ref),
        })
      }
      await settleSuccessfulOrderRewards(customer.id, existingOrder.id, existingOrder.subtotal)
      void notifyUser({ userId: customer.id, type: 'payment_completed', priority: 'important', title: 'Payment confirmed', message: `Payment for order ${existingOrder.orderNumber} was confirmed.`, actionUrl: '/client/orders', channels: ['in_app', 'push'] })
    }
    const address = parseAddress(existingOrder.deliveryAddress)
    if (customer?.email) {
      await sendOrderReceiptEmail({
        toEmail: customer.email,
        orderNumber: existingOrder.orderNumber,
        amount: String(existingOrder.total),
        currency: expectedCurrency,
        customerName: typeof address.name === 'string' ? address.name : 'Valued Customer',
      })
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Flutterwave webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
