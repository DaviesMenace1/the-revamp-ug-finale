import 'server-only'

import { and, eq, ne } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { carts, orders, orderShipments, orderTrackingEvents, paymentRecords, users } from '@/lib/db/schema'
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

function parseMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function sameMoney(actual: unknown, expected: unknown) {
  return Number(actual) + 0.001 >= Number(expected)
}

export async function settleOrderPayment(input: { orderRef: string; chargeId?: string | null }) {
  const order = await db.query.orders.findFirst({ where: eq(orders.orderNumber, input.orderRef) })
  if (!order) return { success: false as const, status: 'not_found' as const, error: 'Order was not found.' }

  let chargeId = String(input.chargeId || '').trim()
  const storedPayment = await db.query.paymentRecords.findFirst({
    where: and(eq(paymentRecords.orderId, order.id), eq(paymentRecords.provider, 'flutterwave')),
    columns: { id: true, transactionReference: true, metadata: true },
  })
  if (!chargeId) chargeId = storedPayment?.transactionReference || ''
  if (!chargeId) return { success: false as const, status: 'pending' as const, error: 'The payment is still awaiting authorization.' }

  const result = await retrieveFlutterwaveCharge(chargeId)
  const payload = result.payload || {}
  const charge = payload.data
  const expectedCurrency = (process.env.FLUTTERWAVE_CURRENCY || 'UGX').toUpperCase()
  const successful = Boolean(result.response?.ok && String(payload.status || '').toLowerCase() === 'success' && String(charge?.status || '').toLowerCase() === 'succeeded')
  if (!successful || !charge) {
    if (result.response?.status === 401 || result.response?.status === 403) return { success: false as const, status: 'verification_failed' as const, error: flutterwaveErrorMessage(payload, result.response.status) }
    return { success: false as const, status: 'pending' as const, error: payload.error?.message || payload.message || 'Payment is still awaiting authorization.' }
  }
  if (String(charge.reference || charge.tx_ref || '') !== order.orderNumber) return { success: false as const, status: 'verification_failed' as const, error: 'The payment reference does not match this order.' }
  if (String(charge.currency || '').toUpperCase() !== expectedCurrency) return { success: false as const, status: 'verification_failed' as const, error: 'The payment currency does not match this order.' }
  if (!sameMoney(charge.amount, order.total)) return { success: false as const, status: 'verification_failed' as const, error: 'The verified payment amount is less than the order total.' }

  const now = new Date()
  const [settledOrder] = await db.update(orders).set({ status: 'confirmed', paymentStatus: 'completed', updatedAt: now }).where(and(eq(orders.id, order.id), ne(orders.paymentStatus, 'completed'))).returning({ id: orders.id })
  const newlySettled = Boolean(settledOrder)

  if (newlySettled) {
    const [shipment] = await db.select({ id: orderShipments.id, status: orderShipments.status }).from(orderShipments).where(eq(orderShipments.orderId, order.id)).limit(1)
    if (shipment?.status === 'awaiting_payment') {
      await db.update(orderShipments).set({ status: 'processing', lastNote: 'Payment confirmed. Fulfilment has started.', updatedAt: now }).where(eq(orderShipments.id, shipment.id))
      await db.insert(orderTrackingEvents).values({ orderId: order.id, shipmentId: shipment.id, status: 'processing', note: 'Payment confirmed. Fulfilment has started.', customerVisible: true })
    }
  }

  const customer = await db.query.users.findFirst({ where: eq(users.clerkId, order.userId) })
  const method = charge.payment_method_details?.type || charge.payment_method?.type || null
  const transactionReference = String(charge.id || chargeId)
  const existingPayment = await db.query.paymentRecords.findFirst({ where: and(eq(paymentRecords.provider, 'flutterwave'), eq(paymentRecords.transactionReference, transactionReference)), columns: { id: true, metadata: true } })
  const originalPaymentMetadata = parseMetadata(existingPayment?.metadata || storedPayment?.metadata)
  let paymentId = existingPayment?.id || storedPayment?.id || null
  const completedMetadata = { ...originalPaymentMetadata, txRef: order.orderNumber, chargeId: transactionReference, paymentType: method }

  if (existingPayment) {
    await db.update(paymentRecords).set({ userId: customer?.id || undefined, orderId: order.id, amount: String(charge.amount), currency: String(charge.currency || expectedCurrency), method, status: 'completed', metadata: completedMetadata, paidAt: now, updatedAt: now }).where(eq(paymentRecords.id, existingPayment.id))
  } else if (storedPayment) {
    await db.update(paymentRecords).set({ userId: customer?.id || undefined, orderId: order.id, amount: String(charge.amount), currency: String(charge.currency || expectedCurrency), method, status: 'completed', metadata: completedMetadata, paidAt: now, updatedAt: now }).where(eq(paymentRecords.id, storedPayment.id))
  } else if (customer) {
    const [payment] = await db.insert(paymentRecords).values({ userId: customer.id, orderId: order.id, provider: 'flutterwave', transactionReference, amount: String(charge.amount), currency: String(charge.currency || expectedCurrency), method, status: 'completed', metadata: completedMetadata, paidAt: now }).onConflictDoNothing({ target: [paymentRecords.provider, paymentRecords.transactionReference] }).returning({ id: paymentRecords.id })
    paymentId = payment?.id || null
  }

  if (customer) {
    if (newlySettled) {
      await settleSuccessfulOrderRewards(customer.id, order.id, order.subtotal)
      if (paymentId) {
                  void generateVerifiedPaymentReceipt({ paymentId, userId: customer.id, clientName: `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || customer.email, clientEmail: customer.email, orderNumber: order.orderNumber, amount: String(charge.amount), currency: String(charge.currency || expectedCurrency), paymentMethod: method, paymentMode: order.paymentMode, transactionReference, items: order.items, shipping: order.shipping, discount: order.discount, deliveryAddress: order.deliveryAddress, refundStatus: order.refundStatus })

          .then((receipt) => {
            if (!receipt) return
            return notifyUser({
              userId: customer.id,
              type: 'order_receipt_ready',
              priority: 'important',
              title: 'Your order receipt is ready',
              message: `Your payment receipt for order ${order.orderNumber} includes your product and delivery details. Open your billing workspace to view or download it.`,
              actionUrl: '/client/billing',
              metadata: { orderId: order.id, orderNumber: order.orderNumber, receiptId: receipt.id, documentNumber: receipt.documentNumber },
              channels: ['in_app', 'push', 'email'],
            })
          })
          .catch((receiptError) => console.error('[order-payment] receipt notification failed:', receiptError))
      }
      const delivery = parseAddress(order.deliveryAddress)
      const deliveryMessage = delivery.deliveryMethod === 'pickup_station' && delivery.pickupStation && typeof delivery.pickupStation === 'object' ? `Pickup at ${String((delivery.pickupStation as Record<string, unknown>).name || 'your selected station')}.` : `Door delivery to ${String(delivery.city || delivery.address || 'your saved address')}.`
      void notifyUser({ userId: customer.id, type: 'payment_completed', priority: 'important', title: 'Payment confirmed', message: `Payment for order ${order.orderNumber} was confirmed. ${deliveryMessage}`, actionUrl: `/client/orders?order=${encodeURIComponent(order.id)}`, metadata: { orderId: order.id, orderNumber: order.orderNumber, paymentMode: order.paymentMode, paymentMethod: method, deliveryAddress: order.deliveryAddress, items: order.items }, channels: ['in_app', 'push', 'email'] })
    }

    await db.update(carts).set({ items: [], subtotal: '0', updatedAt: now }).where(eq(carts.userId, customer.id))

    const emailAlreadySent = originalPaymentMetadata.verifiedOrderEmailSent === true
    if (!emailAlreadySent && customer.email) {
      const address = parseAddress(order.deliveryAddress)
      const emailResult = await sendOrderVerificationEmail({ toEmail: customer.email, orderNumber: order.orderNumber, amount: String(order.total), currency: expectedCurrency, customerName: typeof address.name === 'string' ? address.name : 'Valued Customer', paymentMode: order.paymentMode, paymentMethod: method, deliveryAddress: order.deliveryAddress, items: order.items })
      if (emailResult.success) {
        if (paymentId) await db.update(paymentRecords).set({ metadata: { ...completedMetadata, verifiedOrderEmailSent: true }, updatedAt: now }).where(eq(paymentRecords.id, paymentId))
      } else {
        console.error('[order-payment] verified order email was not sent:', emailResult.error)
      }
    }
  }

  return { success: true as const, status: 'paid' as const, orderId: order.id }
}

export async function cancelPendingOrder(orderId: string) {
  const now = new Date()
  await db.update(orders).set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: now }).where(and(eq(orders.id, orderId), ne(orders.paymentStatus, 'completed')))
  const [shipment] = await db.select({ id: orderShipments.id }).from(orderShipments).where(eq(orderShipments.orderId, orderId)).limit(1)
  if (shipment) {
    await db.update(orderShipments).set({ status: 'cancelled', lastNote: 'Payment was not completed.', updatedAt: now }).where(eq(orderShipments.id, shipment.id))
    await db.insert(orderTrackingEvents).values({ orderId, shipmentId: shipment.id, status: 'cancelled', note: 'Payment was not completed.', customerVisible: false })
  }
  await safelyReleasePointsForOrder(orderId)
}
