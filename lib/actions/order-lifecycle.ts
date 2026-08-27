'use server'

import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/client'
import { orders, orderShipments, orderTrackingEvents, paymentRecords, refundRequests, users } from '@/lib/db/schema'
import { requireAdminPermission } from '@/lib/auth/admin-guard'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { createFlutterwaveRefund, getFlutterwaveConfig, flutterwaveErrorMessage } from '@/lib/flutterwave-config'
import { applyRefundProviderState } from '@/lib/refund-processing'
import { notifyUser } from '@/lib/notifications/service'

function validUuid(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value)
}

function canCancelShipment(status: string | null | undefined) {
  return status === 'awaiting_payment' || status === 'processing' || status === 'packed'
}

function deliverySummary(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Delivery details are available in your order.'
  const address = value as Record<string, unknown>
  if (address.deliveryMethod === 'pickup_station' && address.pickupStation && typeof address.pickupStation === 'object') {
    const station = address.pickupStation as Record<string, unknown>
    return `Pickup at ${String(station.name || 'your selected station')}, ${String(station.address || '')}`.trim()
  }
  return `Door delivery to ${String(address.city || address.address || 'your saved address')}`
}

async function findOwnedOrder(orderId: string, clerkId: string) {
  const [order] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, clerkId))).limit(1)
  return order || null
}

export async function requestOrderCancellation(orderId: string, reason: string) {
  const authorization = await getCurrentUserWithRole()
  if (!authorization.authorized || !authorization.user) return { success: false, error: 'Please sign in to manage this order.' }
  if (!validUuid(orderId)) return { success: false, error: 'Invalid order.' }

  const actorUser = authorization.user
  const order = await findOwnedOrder(orderId, actorUser.clerkId)
  if (!order) return { success: false, error: 'Order not found.' }
  const [shipment] = await db.select({ id: orderShipments.id, status: orderShipments.status }).from(orderShipments).where(eq(orderShipments.orderId, order.id)).limit(1)
  if (!canCancelShipment(shipment?.status)) return { success: false, error: 'This order can no longer be cancelled because fulfilment has started.' }
  const [payment] = order.paymentStatus === 'completed'
    ? await db.select({ id: paymentRecords.id }).from(paymentRecords).where(and(eq(paymentRecords.orderId, order.id), eq(paymentRecords.provider, 'flutterwave'), eq(paymentRecords.status, 'completed'))).orderBy(desc(paymentRecords.createdAt)).limit(1)
    : []

  const note = (reason || 'Cancelled by customer').trim().slice(0, 500) || 'Cancelled by customer'
  const now = new Date()
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status: 'cancelled', cancellationReason: note, cancelledAt: now, refundStatus: order.paymentStatus === 'completed' ? 'requested' : 'not_requested', updatedAt: now }).where(eq(orders.id, order.id))
    if (shipment) {
      await tx.update(orderShipments).set({ status: 'cancelled', lastNote: note, updatedAt: now }).where(eq(orderShipments.id, shipment.id))
      await tx.insert(orderTrackingEvents).values({ orderId: order.id, shipmentId: shipment.id, status: 'cancelled', note, actorId: actorUser.id, customerVisible: true })
    }
    if (order.paymentStatus === 'completed') {
      await tx.insert(refundRequests).values({ orderId: order.id, paymentRecordId: payment?.id || null, amount: order.total, currency: 'UGX', reason: note, requestedBy: actorUser.id, status: 'requested', updatedAt: now })
    }
  })

  if (order.paymentStatus === 'completed') {
    await notifyUser({ userId: actorUser.id, type: 'refund_requested', priority: 'important', title: `Cancellation received for ${order.orderNumber}`, message: `Your cancellation request was received. A refund review will follow for ${deliverySummary(order.deliveryAddress)}.`, actionUrl: `/client/orders?order=${encodeURIComponent(order.id)}`, metadata: { orderId: order.id, orderNumber: order.orderNumber, deliveryAddress: order.deliveryAddress, items: order.items, refundStatus: 'requested' }, channels: ['in_app', 'push', 'email'] })
  } else {
    await notifyUser({ userId: actorUser.id, type: 'order_cancelled', priority: 'important', title: `Order ${order.orderNumber} cancelled`, message: `Your order was cancelled before payment. ${deliverySummary(order.deliveryAddress)}`, actionUrl: '/client/orders', metadata: { orderId: order.id, orderNumber: order.orderNumber, deliveryAddress: order.deliveryAddress, items: order.items }, channels: ['in_app', 'push', 'email'] })
  }

  revalidatePath('/client/orders')
  revalidatePath('/track-order')
  revalidatePath('/admin/orders')
  revalidatePath('/admin/logistics')
  return { success: true, refundRequested: order.paymentStatus === 'completed' }
}

export async function requestOrderRefund(orderId: string, reason: string) {
  const authorization = await getCurrentUserWithRole()
  if (!authorization.authorized || !authorization.user) return { success: false, error: 'Please sign in to request a refund.' }
  if (!validUuid(orderId)) return { success: false, error: 'Invalid order.' }
  const actorUser = authorization.user
  const order = await findOwnedOrder(orderId, actorUser.clerkId)
  if (!order) return { success: false, error: 'Order not found.' }
  if (order.paymentStatus !== 'completed') return { success: false, error: 'A refund can only be requested after payment is completed.' }
  if (order.refundStatus === 'requested' || order.refundStatus === 'processing' || order.refundStatus === 'completed') return { success: false, error: 'A refund request already exists for this order.' }
  const [payment] = await db.select({ id: paymentRecords.id }).from(paymentRecords).where(and(eq(paymentRecords.orderId, order.id), eq(paymentRecords.provider, 'flutterwave'), eq(paymentRecords.status, 'completed'))).orderBy(desc(paymentRecords.createdAt)).limit(1)

  const note = (reason || 'Refund requested by customer').trim().slice(0, 500) || 'Refund requested by customer'
  await db.transaction(async (tx) => {
    await tx.insert(refundRequests).values({ orderId: order.id, paymentRecordId: payment?.id || null, amount: order.total, currency: 'UGX', reason: note, requestedBy: actorUser.id, status: 'requested', updatedAt: new Date() })
    await tx.update(orders).set({ refundStatus: 'requested', updatedAt: new Date() }).where(eq(orders.id, order.id))
  })
  await notifyUser({ userId: actorUser.id, type: 'refund_requested', priority: 'important', title: `Refund request received for ${order.orderNumber}`, message: `We received your refund request for ${deliverySummary(order.deliveryAddress)}. The team will review it and update you.`, actionUrl: `/client/orders?order=${encodeURIComponent(order.id)}`, metadata: { orderId: order.id, orderNumber: order.orderNumber, deliveryAddress: order.deliveryAddress, items: order.items }, channels: ['in_app', 'push', 'email'] })
  revalidatePath('/client/orders')
  revalidatePath('/track-order')
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function listRefundRequests() {
  await requireAdminPermission('manage_finance', '/admin/billing')
  return db.select({ request: refundRequests, order: orders, requester: { email: users.email, firstName: users.firstName, lastName: users.lastName } }).from(refundRequests).innerJoin(orders, eq(refundRequests.orderId, orders.id)).leftJoin(users, eq(refundRequests.requestedBy, users.id)).orderBy(desc(refundRequests.createdAt)).limit(200)
}

export async function reviewRefundRequest(requestId: string, decision: 'approve' | 'reject', reviewNote?: string) {
  const reviewer = await requireAdminPermission('manage_finance', '/admin/billing')
  if (!validUuid(requestId)) return { success: false, error: 'Invalid refund request.' }
  const [requestRow] = await db.select({ request: refundRequests, order: orders }).from(refundRequests).innerJoin(orders, eq(refundRequests.orderId, orders.id)).where(and(eq(refundRequests.id, requestId), eq(refundRequests.status, 'requested'))).limit(1)
  if (!requestRow) return { success: false, error: 'Refund request is no longer awaiting review.' }
  const [payment] = requestRow.request.paymentRecordId
    ? await db.select().from(paymentRecords).where(eq(paymentRecords.id, requestRow.request.paymentRecordId)).limit(1)
    : await db.select().from(paymentRecords).where(and(eq(paymentRecords.orderId, requestRow.order.id), eq(paymentRecords.provider, 'flutterwave'))).orderBy(desc(paymentRecords.createdAt)).limit(1)
  const row = { ...requestRow, payment: payment || null }
  const note = (reviewNote || '').trim().slice(0, 1000) || null
  if (decision === 'reject') {
    await db.transaction(async (tx) => {
      await tx.update(refundRequests).set({ status: 'rejected', reviewedBy: reviewer.id, reviewNote: note || 'Refund request rejected.', processedAt: new Date(), updatedAt: new Date() }).where(eq(refundRequests.id, requestId))
      await tx.update(orders).set({ refundStatus: 'rejected', updatedAt: new Date() }).where(eq(orders.id, row.order.id))
    })
    const [customer] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, row.order.userId)).limit(1)
    if (customer) await notifyUser({ userId: customer.id, type: 'refund_update', priority: 'important', title: `Refund update for ${row.order.orderNumber}`, message: `Your refund request was not approved.${note ? ` ${note}` : ''}`, actionUrl: '/client/orders', metadata: { orderId: row.order.id, orderNumber: row.order.orderNumber, deliveryAddress: row.order.deliveryAddress, items: row.order.items, refundStatus: 'rejected' }, channels: ['in_app', 'push', 'email'] })
    revalidatePath('/admin/billing')
    revalidatePath('/admin/orders')
    return { success: true, status: 'rejected' as const }
  }

  if (!payment || payment.provider !== 'flutterwave') return { success: false, error: 'This order has no supported online payment record. Review it manually.' }
  const config = getFlutterwaveConfig()
  if (!config.ok) return { success: false, error: 'Flutterwave is not configured for refunds. The request remains awaiting review.' }

  await db.update(refundRequests).set({ status: 'processing', paymentRecordId: payment.id, reviewedBy: reviewer.id, reviewNote: note, updatedAt: new Date() }).where(eq(refundRequests.id, requestId))
  let providerResponse
  try {
    providerResponse = await createFlutterwaveRefund({ chargeId: payment.transactionReference, amount: Number(row.request.amount), reason: 'requested_by_customer', idempotencyKey: `refund-${requestId}`, meta: { orderId: row.order.id, orderNumber: row.order.orderNumber } })
  } catch (error) {
    console.error('[refund] provider request failed:', error)
    return { success: true, status: 'processing' as const, error: 'The provider request could not be confirmed yet. Use Refresh status when the provider refund ID is available.' }
  }

  const providerRefund = providerResponse.payload?.data
  const providerStatus = String(providerRefund?.status || '').toLowerCase() || null
  const reconciled = await applyRefundProviderState({
    requestId,
    providerRefundId: providerRefund?.id ? String(providerRefund.id) : null,
    providerStatus,
    providerRequestOk: Boolean(providerResponse.response?.ok),
    providerRecord: providerRefund || null,
    notifyCustomer: true,
  })
  const error = reconciled.status === 'failed' ? flutterwaveErrorMessage(providerResponse.payload || {}, providerResponse.response?.status || 502) : reconciled.status === 'processing' ? `Refund submitted. Provider status: ${providerStatus || 'pending'}.` : undefined
  return { success: true, status: reconciled.status, error }
}

export async function reconcileRefundRequest(requestId: string) {
  await requireAdminPermission('manage_finance', '/admin/billing')
  if (!validUuid(requestId)) return { success: false, error: 'Invalid refund request.' }
  const [row] = await db.select({ request: refundRequests }).from(refundRequests).where(and(eq(refundRequests.id, requestId), eq(refundRequests.status, 'processing'))).limit(1)
  if (!row?.request.providerRefundId) return { success: false, error: 'This refund has no provider refund ID to check yet.' }

  const { retrieveFlutterwaveRefund } = await import('@/lib/flutterwave-config')
  let providerResponse
  try {
    providerResponse = await retrieveFlutterwaveRefund(row.request.providerRefundId)
  } catch (error) {
    console.error('[refund] provider status request failed:', error)
    return { success: false, error: 'The payment provider could not be reached. Try again later.' }
  }
  const providerRefund = providerResponse.payload?.data
  const result = await applyRefundProviderState({
    requestId,
    providerRefundId: providerRefund?.id || row.request.providerRefundId,
    providerStatus: providerRefund?.status || null,
    providerRequestOk: Boolean(providerResponse.response?.ok),
    providerRecord: providerRefund || null,
    notifyCustomer: true,
  })
  if (!result.found) return { success: false, error: 'This refund was updated by another request or is no longer processing.' }
  return { success: true, status: result.status }
}
