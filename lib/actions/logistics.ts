'use server'

import { asc, desc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/client'
import { orders, orderShipments, orderTrackingEvents, users } from '@/lib/db/schema'
import { requireAdminPermission } from '@/lib/auth/admin-guard'
import { notifyUser } from '@/lib/notifications/service'
import { canTransitionShipment, orderStatusForShipment, SHIPMENT_STATUS_LABELS, SHIPMENT_STATUSES, type ShipmentStatus } from '@/lib/logistics/status'

const ASSIGNABLE_ROLES = ['admin', 'operations_manager', 'logistics_coordinator'] as const

function validUuid(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value)
}

function deliverySummary(address: unknown) {
  if (!address || typeof address !== 'object' || Array.isArray(address)) return 'Delivery details are available in your order.'
  const value = address as Record<string, unknown>
  if (value.deliveryMethod === 'pickup_station' && value.pickupStation && typeof value.pickupStation === 'object') {
    const station = value.pickupStation as Record<string, unknown>
    return `Pickup at ${String(station.name || 'your selected station')}, ${String(station.address || '')}`.trim()
  }
  return `Door delivery to ${String(value.city || value.address || 'your saved address')}`
}

export async function getLogisticsBoard() {
  await requireAdminPermission('manage_logistics', '/admin/logistics')
  const rows = await db
    .select({
      shipment: orderShipments,
      order: orders,
      assignee: { id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, role: users.role },
    })
    .from(orderShipments)
    .innerJoin(orders, eq(orderShipments.orderId, orders.id))
    .leftJoin(users, eq(orderShipments.assignedTo, users.id))
    .orderBy(desc(orderShipments.updatedAt))
    .limit(200)

  const staff = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, role: users.role })
    .from(users)
    .where(inArray(users.role, [...ASSIGNABLE_ROLES]))
    .orderBy(asc(users.firstName), asc(users.lastName))
    .limit(100)

  return { rows, staff }
}

export async function assignShipment(shipmentId: string, assignedTo: string | null) {
  const actor = await requireAdminPermission('manage_logistics', '/admin/logistics')
  if (!validUuid(shipmentId) || (assignedTo !== null && !validUuid(assignedTo))) return { success: false, error: 'Invalid shipment assignment.' }

  const [shipment] = await db.select({ id: orderShipments.id, orderId: orderShipments.orderId, status: orderShipments.status }).from(orderShipments).where(eq(orderShipments.id, shipmentId)).limit(1)
  if (!shipment) return { success: false, error: 'Shipment not found.' }

  let assigneeName = 'Unassigned'
  if (assignedTo) {
    const [staff] = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, role: users.role }).from(users).where(eq(users.id, assignedTo)).limit(1)
    if (!staff || !ASSIGNABLE_ROLES.includes(staff.role as (typeof ASSIGNABLE_ROLES)[number])) return { success: false, error: 'Choose an active logistics team member.' }
    assigneeName = [staff.firstName, staff.lastName].filter(Boolean).join(' ') || staff.email
  }

  await db.transaction(async (tx) => {
    await tx.update(orderShipments).set({ assignedTo, assignedAt: assignedTo ? new Date() : null, updatedAt: new Date(), lastNote: assignedTo ? `Assigned to ${assigneeName}.` : 'Shipment assignment cleared.' }).where(eq(orderShipments.id, shipmentId))
    await tx.insert(orderTrackingEvents).values({ orderId: shipment.orderId, shipmentId, status: shipment.status, note: assignedTo ? `Assigned to ${assigneeName}.` : 'Shipment assignment cleared.', actorId: actor.id, customerVisible: false })
  })

  revalidatePath('/admin/logistics')
  return { success: true }
}

export async function updateShipmentStatus(input: { shipmentId: string; status: string; note?: string; estimatedDeliveryAt?: string | null }) {
  const actor = await requireAdminPermission('manage_logistics', '/admin/logistics')
  if (!validUuid(input.shipmentId) || !SHIPMENT_STATUSES.includes(input.status as ShipmentStatus)) return { success: false, error: 'Choose a valid shipment status.' }
  const status = input.status as ShipmentStatus
  const [row] = await db
    .select({ shipment: orderShipments, order: orders })
    .from(orderShipments)
    .innerJoin(orders, eq(orderShipments.orderId, orders.id))
    .where(eq(orderShipments.id, input.shipmentId))
    .limit(1)
  if (!row) return { success: false, error: 'Shipment not found.' }
  if (!canTransitionShipment(row.shipment.status, status)) return { success: false, error: `This shipment cannot move from ${SHIPMENT_STATUS_LABELS[row.shipment.status]} to ${SHIPMENT_STATUS_LABELS[status]}.` }

  const note = typeof input.note === 'string' ? input.note.trim().slice(0, 1000) : ''
  const estimate = input.estimatedDeliveryAt ? new Date(input.estimatedDeliveryAt) : null
  if (input.estimatedDeliveryAt && Number.isNaN(estimate?.getTime())) return { success: false, error: 'Enter a valid delivery estimate.' }
  const now = new Date()

  await db.transaction(async (tx) => {
    await tx.update(orderShipments).set({ status, lastNote: note || null, estimatedDeliveryAt: estimate, dispatchedAt: status === 'out_for_delivery' ? now : row.shipment.dispatchedAt, deliveredAt: status === 'delivered' || status === 'collected' ? now : row.shipment.deliveredAt, updatedAt: now }).where(eq(orderShipments.id, input.shipmentId))
    await tx.insert(orderTrackingEvents).values({ orderId: row.order.id, shipmentId: row.shipment.id, status, note: note || null, actorId: actor.id, customerVisible: true })
    await tx.update(orders).set({ status: orderStatusForShipment(status), updatedAt: now }).where(eq(orders.id, row.order.id))
  })

  const [customer] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, row.order.userId)).limit(1)
  if (customer) {
    void notifyUser({
      userId: customer.id,
      type: 'shipment_update',
      priority: status === 'exception' ? 'important' : 'informational',
      title: `Order ${row.order.orderNumber}: ${SHIPMENT_STATUS_LABELS[status]}`,
      message: `${SHIPMENT_STATUS_LABELS[status]}. ${deliverySummary(row.order.deliveryAddress)}${note ? ` ${note}` : ''}`,
      actionUrl: `/client/orders?order=${encodeURIComponent(row.order.id)}`,
      metadata: { orderId: row.order.id, orderNumber: row.order.orderNumber, shipmentId: row.shipment.id, trackingCode: row.shipment.trackingCode, status, paymentMode: row.order.paymentMode, deliveryAddress: row.order.deliveryAddress, items: row.order.items },
      channels: ['in_app', 'push', 'email'],
    }).catch((error) => console.error('[logistics] customer notification failed:', error))
  }

  revalidatePath('/admin/logistics')
  revalidatePath('/admin/orders')
  revalidatePath('/client/orders')
  revalidatePath('/track-order')
  return { success: true }
}
