import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { orderShipments, orderTrackingEvents, orders, users } from '@/lib/db/schema'
import { and, asc, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

function parseObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
    } catch {
      return {}
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function parseItems(value: unknown) {
  let parsed: unknown = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      parsed = []
    }
  }
  return Array.isArray(parsed) ? parsed.map((item) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    return {
      name: String(record.name || record.title || 'Product'),
      quantity: Math.max(1, Number(record.quantity || 1)),
      unitPrice: Number(record.unitPrice ?? record.price ?? 0),
      currency: String(record.currency || 'UGX').toUpperCase(),
      image: typeof record.image === 'string' && record.image.trim() ? record.image : '/brand/revamp-logo.png',
      color: record.color,
      fabric: record.fabric,
      material: record.material,
      variant: record.variant,
      accessories: record.accessories,
      dimensions: record.dimensions,
      configuration: record.configuration,
    }
  }) : []
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderRef = searchParams.get('ref')?.trim()
  const email = searchParams.get('email')?.trim().toLowerCase()
  const { userId } = await auth()

  if (!orderRef || (!userId && !email)) {
    return NextResponse.json({ error: 'Order reference and purchase email are required.' }, { status: 400 })
  }

  try {
    const [record] = await db
      .select({ order: orders, userEmail: users.email })
      .from(orders)
      .leftJoin(users, eq(users.clerkId, orders.userId))
      .where(userId ? and(eq(orders.orderNumber, orderRef), eq(orders.userId, userId)) : eq(orders.orderNumber, orderRef))
      .limit(1)
    const order = record?.order
    const orderEmail = record?.userEmail?.trim().toLowerCase()
    if (!order || (!userId && (!orderEmail || orderEmail !== email))) {
      return NextResponse.json({ error: 'Order not found. Check the reference and purchase email.' }, { status: 404 })
    }

    const [shipment] = await db.select({ id: orderShipments.id, trackingCode: orderShipments.trackingCode, status: orderShipments.status, assignedAt: orderShipments.assignedAt, estimatedDeliveryAt: orderShipments.estimatedDeliveryAt, dispatchedAt: orderShipments.dispatchedAt, deliveredAt: orderShipments.deliveredAt, lastNote: orderShipments.lastNote, updatedAt: orderShipments.updatedAt }).from(orderShipments).where(eq(orderShipments.orderId, order.id)).limit(1)
    const trackingEvents = shipment ? await db.select({ id: orderTrackingEvents.id, status: orderTrackingEvents.status, note: orderTrackingEvents.note, createdAt: orderTrackingEvents.createdAt }).from(orderTrackingEvents).where(and(eq(orderTrackingEvents.orderId, order.id), eq(orderTrackingEvents.customerVisible, true))).orderBy(asc(orderTrackingEvents.createdAt)).limit(100) : []

    return NextResponse.json({
      order: {
        orderNumber: order.orderNumber,
        userEmail: record.userEmail || null,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMode: order.paymentMode,
        paymentMethod: order.paymentMethod,
        refundStatus: order.refundStatus,
        cancellationReason: order.cancellationReason,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: parseItems(order.items),
        deliveryAddress: parseObject(order.deliveryAddress),
        currency: 'UGX',
        subtotal: order.subtotal,
        totalAmount: order.total,
        shipment: shipment ? { ...shipment, events: trackingEvents } : null,
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Failed to fetch order details:', error)
    return NextResponse.json({ error: 'Order tracking is temporarily unavailable.' }, { status: 500 })
  }
}
