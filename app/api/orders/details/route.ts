import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderRef = searchParams.get('ref')

  if (!orderRef) {
    return NextResponse.json({ error: 'Order reference required' }, { status: 400 })
  }

  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, orderRef),
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const items = typeof order.items === 'string' ? JSON.parse(order.items) : Array.isArray(order.items) ? order.items : []
    const deliveryAddress = typeof order.deliveryAddress === 'string' ? JSON.parse(order.deliveryAddress) : order.deliveryAddress || {}
    const normalizedItems = items.map((item: any) => ({
      ...item,
      unitPrice: Number(item?.unitPrice ?? item?.price ?? 0),
      currency: String(item?.currency || 'UGX').toUpperCase(),
      image: typeof item?.image === 'string' && item.image.trim() ? item.image : '/brand/revamp-logo.png',
    }))

    return NextResponse.json({ order: { ...order, items: normalizedItems, deliveryAddress, currency: 'UGX', totalAmount: order.total } })
  } catch (error) {
    console.error('Failed to fetch order details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
