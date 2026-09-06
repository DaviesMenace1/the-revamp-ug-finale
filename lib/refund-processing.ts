import 'server-only'

import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/client'
import { orders, paymentRecords, refundRequests, users } from '@/lib/db/schema'
import { notifyUser } from '@/lib/notifications/service'

export type ProviderRefundState = {
  id?: string | null
  charge_id?: string | null
  status?: string | null
}

export type LocalRefundStatus = 'processing' | 'completed' | 'failed'

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

export function mapProviderRefundStatus(status: unknown, providerRequestOk = true, hasProviderRecord = true): LocalRefundStatus {
  if (!providerRequestOk || !hasProviderRecord) return 'failed'
  const normalized = normalize(status)
  if (['succeeded', 'completed'].includes(normalized)) return 'completed'
  if (['failed', 'cancelled'].includes(normalized)) return 'failed'
  return 'processing'
}

export async function applyRefundProviderState(input: {
  requestId?: string
  providerRefundId?: string | null
  orderId?: string | null
  providerStatus?: string | null
  providerRequestOk?: boolean
  providerRecord?: ProviderRefundState | null
  notifyCustomer?: boolean
}) {
  const providerRecord = input.providerRecord || null
  const providerRefundId = String(input.providerRefundId || providerRecord?.id || '').trim() || null
  const status = input.providerStatus || providerRecord?.status || null
  const finalStatus = mapProviderRefundStatus(status, input.providerRequestOk !== false, Boolean(providerRecord || input.providerRequestOk !== false))

  const conditions = input.requestId
    ? eq(refundRequests.id, input.requestId)
    : providerRefundId
      ? eq(refundRequests.providerRefundId, providerRefundId)
      : input.orderId
        ? eq(refundRequests.orderId, input.orderId)
        : null
  if (!conditions) return { found: false as const, status: finalStatus }

  const [row] = await db.select({ request: refundRequests, order: orders, payment: paymentRecords }).from(refundRequests).innerJoin(orders, eq(refundRequests.orderId, orders.id)).leftJoin(paymentRecords, eq(refundRequests.paymentRecordId, paymentRecords.id)).where(and(conditions, eq(refundRequests.status, 'processing'))).orderBy(desc(refundRequests.createdAt)).limit(1)
  if (!row) return { found: false as const, status: finalStatus }
  let payment = row.payment
  if (!payment) {
    const [fallbackPayment] = await db.select().from(paymentRecords).where(and(eq(paymentRecords.orderId, row.order.id), eq(paymentRecords.provider, 'pesapal'))).orderBy(desc(paymentRecords.createdAt)).limit(1)
    payment = fallbackPayment || null
  }

  const now = new Date()
  const storedProviderId = providerRefundId || row.request.providerRefundId || null
  const storedProviderStatus = normalize(status) || row.request.providerStatus || null
  await db.transaction(async (tx) => {
    await tx.update(refundRequests).set({
      status: finalStatus,
      providerRefundId: storedProviderId,
      providerStatus: storedProviderStatus,
      processedAt: finalStatus === 'processing' ? null : now,
      updatedAt: now,
    }).where(eq(refundRequests.id, row.request.id))

    const orderUpdate = { refundStatus: finalStatus, ...(finalStatus === 'completed' ? { paymentStatus: 'refunded' as const } : {}), updatedAt: now }
    await tx.update(orders).set(orderUpdate).where(eq(orders.id, row.order.id))

    if (finalStatus === 'completed' && payment) {
      await tx.update(paymentRecords).set({
        status: 'refunded',
        updatedAt: now,
        metadata: {
          ...(payment.metadata && typeof payment.metadata === 'object' ? payment.metadata as Record<string, unknown> : {}),
          refundStatus: storedProviderStatus,
          providerRefundId: storedProviderId,
        },
      }).where(eq(paymentRecords.id, payment.id))
    }
  })

  if (input.notifyCustomer !== false) {
    const [customer] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, row.order.userId)).limit(1)
    if (customer) {
      const message = finalStatus === 'completed'
        ? `Your refund for order ${row.order.orderNumber} has been completed by the payment provider.`
        : finalStatus === 'failed'
          ? `The payment provider could not complete your refund for order ${row.order.orderNumber}. Our finance team will follow up.`
          : `Your refund for order ${row.order.orderNumber} is still being processed by the payment provider.`
      await notifyUser({
        userId: customer.id,
        type: 'refund_update',
        priority: 'important',
        title: finalStatus === 'completed' ? `Refund completed for ${row.order.orderNumber}` : finalStatus === 'failed' ? `Refund needs attention for ${row.order.orderNumber}` : `Refund processing for ${row.order.orderNumber}`,
        message,
        actionUrl: `/client/orders?order=${encodeURIComponent(row.order.id)}`,
        metadata: { orderId: row.order.id, orderNumber: row.order.orderNumber, items: row.order.items, deliveryAddress: row.order.deliveryAddress, refundStatus: finalStatus, providerStatus: storedProviderStatus, providerRefundId: storedProviderId },
        channels: ['in_app', 'push', 'email'],
      })
    }
  }

  revalidatePath('/admin/billing')
  revalidatePath('/admin/orders')
  revalidatePath('/client/orders')
  revalidatePath('/track-order')
  return { found: true as const, status: finalStatus, requestId: row.request.id }
}
