import 'server-only'

import { and, eq, ne } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { orders, paymentRecords, users } from '@/lib/db/schema'
import { generateVerifiedPaymentReceipt } from '@/lib/documents/payment-receipt'
import { notifyUser } from '@/lib/notifications/service'
import { safelyReleasePointsForOrder, settleSuccessfulOrderRewards } from '@/lib/loyalty/service'
import { flutterwaveErrorMessage, retrieveFlutterwaveCharge } from '@/lib/flutterwave-config'
import { sendOrderVerificationEmail } from '@/lib/email/send-receipt'

function parseAddress(value: unknown): { name?: string; [key: string]: unknown } {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' ? parsed as { name?: string; [key: string]: unknown } : {}
    } catch {
      return {}
    }
  }
  return value && typeof value === 'object' ? value as { name?: string; [key: string]: unknown } : {}
}

function sameMoney(actual: unknown, expected: unknown) {
  return Number(actual) + 0.001 >= Number(expected)
}

export async function settleOrderPayment(input: { orderRef: string; chargeId?: string | null }) {
  const order = await db.query.orders.findFirst({ where: eq(orders.orderNumber, input.orderRef) })
  if (!order) return { success: false as const, status: 'not_found' as const, error: 'Order was not found.' }
  if (order.paymentStatus === 'completed') return { success: true as const, status: 'paid' as const, orderId: order.id }

  const chargeId = String(input.chargeId || '').trim()
  if (!chargeId) return { success: false as const, status: 'pending' as const, error: 'The payment is still awaiting authorization.' }
  const result = await retrieveFlutterwaveCharge(chargeId)
  const payload = result.payload || {}
  const charge = payload.data
  const expectedCurrency = (process.env.FLUTTERWAVE_CURRENCY || 'UGX').toUpperCase()
  const successful = Boolean(result.response?.ok && payload.status === 'success' && charge?.status === 'succeeded')
  if (!successful || !charge) {
    if (result.response?.status === 401 || result.response?.status === 403) return { success: false as const, status: 'verification_failed' as const, error: flutterwaveErrorMessage(payload, result.response.status) }
    return { success: false as const, status: 'pending' as const, error: payload.error?.message || payload.message || 'Payment is still awaiting authorization.' }
  }
  if (String(charge.reference || charge.tx_ref || '') !== order.orderNumber) return { success: false as const, status: 'verification_failed' as const, error: 'The payment reference does not match this order.' }
  if (String(charge.currency || '').toUpperCase() !== expectedCurrency) return { success: false as const, status: 'verification_failed' as const, error: 'The payment currency does not match this order.' }
  if (!sameMoney(charge.amount, order.total)) return { success: false as const, status: 'verification_failed' as const, error: 'The verified payment amount is less than the order total.' }

  const now = new Date()
  const [settledOrder] = await db.update(orders).set({ status: 'confirmed', paymentStatus: 'completed', updatedAt: now }).where(and(eq(orders.id, order.id), ne(orders.paymentStatus, 'completed'))).returning({ id: orders.id })
  if (!settledOrder) return { success: true as const, status: 'paid' as const, orderId: order.id }

  const customer = await db.query.users.findFirst({ where: eq(users.clerkId, order.userId) })
  const method = charge.payment_method_details?.type || charge.payment_method?.type || null
  const transactionReference = String(charge.id || chargeId)
  const existingPayment = await db.query.paymentRecords.findFirst({ where: and(eq(paymentRecords.provider, 'flutterwave'), eq(paymentRecords.transactionReference, transactionReference)), columns: { id: true } })
  let paymentId = existingPayment?.id || null
  if (existingPayment) {
    await db.update(paymentRecords).set({ userId: customer?.id || undefined, orderId: order.id, amount: String(charge.amount), currency: String(charge.currency || expectedCurrency), method, status: 'completed', metadata: { txRef: order.orderNumber, chargeId: transactionReference, paymentType: method }, paidAt: now, updatedAt: now }).where(eq(paymentRecords.id, existingPayment.id))
  } else if (customer) {
    const [payment] = await db.insert(paymentRecords).values({ userId: customer.id, orderId: order.id, provider: 'flutterwave', transactionReference, amount: String(charge.amount), currency: String(charge.currency || expectedCurrency), method, status: 'completed', metadata: { txRef: order.orderNumber, chargeId: transactionReference, paymentType: method }, paidAt: now }).onConflictDoNothing({ target: [paymentRecords.provider, paymentRecords.transactionReference] }).returning({ id: paymentRecords.id })
    paymentId = payment?.id || null
  }

  if (customer) {
    await settleSuccessfulOrderRewards(customer.id, order.id, order.subtotal)
    if (paymentId) {
      void generateVerifiedPaymentReceipt({ paymentId, userId: customer.id, clientName: `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || customer.email, clientEmail: customer.email, orderNumber: order.orderNumber, amount: String(charge.amount), currency: String(charge.currency || expectedCurrency), paymentMethod: method, transactionReference })
    }
    void notifyUser({ userId: customer.id, type: 'payment_completed', priority: 'important', title: 'Payment confirmed', message: `Payment for order ${order.orderNumber} was confirmed.`, actionUrl: '/client/orders', channels: ['in_app', 'push'] })
    const address = parseAddress(order.deliveryAddress)
    if (customer.email) await sendOrderVerificationEmail({ toEmail: customer.email, orderNumber: order.orderNumber, amount: String(order.total), currency: expectedCurrency, customerName: typeof address.name === 'string' ? address.name : 'Valued Customer' })
  }

  return { success: true as const, status: 'paid' as const, orderId: order.id }
}

export async function cancelPendingOrder(orderId: string) {
  await db.update(orders).set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() }).where(and(eq(orders.id, orderId), ne(orders.paymentStatus, 'completed')))
  await safelyReleasePointsForOrder(orderId)
}
