// app/api/checkout/create-order/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { eq, inArray } from 'drizzle-orm'
import { orders, products } from '@/lib/db/schema'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { reservePointsForOrder } from '@/lib/loyalty/service'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Please log in.' }, { status: 401 })
    }

    const body = await req.json()
    const { amount, currency, shippingAddress, items, loyaltyPoints } = body
    const expectedCurrency = process.env.FLUTTERWAVE_CURRENCY || 'UGX'

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || !Array.isArray(items) || items.length === 0 || items.length > 100) {
      return NextResponse.json({ error: 'A valid order amount and at least one item are required.' }, { status: 400 })
    }
    if (String(currency || expectedCurrency).toUpperCase() !== expectedCurrency.toUpperCase()) {
      return NextResponse.json({ error: `Checkout currently supports ${expectedCurrency} only.` }, { status: 400 })
    }

    const parsedItems = items.map((item: unknown) => {
      if (!item || typeof item !== 'object') return null
      const value = item as Record<string, unknown>
      const productId = typeof value.productId === 'string' ? value.productId : ''
      const quantity = Number(value.quantity)
      const unitPrice = Number(value.unitPrice)
      if (!/^[0-9a-f-]{36}$/i.test(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 100 || !Number.isFinite(unitPrice) || unitPrice < 0) return null
      return { value, productId, quantity, unitPrice }
    })
    if (parsedItems.some((item) => !item)) {
      return NextResponse.json({ error: 'One or more order items are invalid.' }, { status: 400 })
    }

    const validItems = parsedItems as Array<{ value: Record<string, unknown>; productId: string; quantity: number; unitPrice: number }>
    const productIds = [...new Set(validItems.map((item) => item.productId))]
    const catalogProducts = await db
      .select({ id: products.id, name: products.name, price: products.price, currency: products.currency, status: products.status, availability: products.availability })
      .from(products)
      .where(inArray(products.id, productIds))
    const catalogById = new Map(catalogProducts.map((product) => [product.id, product]))
    const normalizedItems = validItems.map(({ value, productId, quantity, unitPrice }) => {
      const product = catalogById.get(productId)
      if (!product || product.status !== 'published' || product.availability === 'out_of_stock' || product.currency.toUpperCase() !== expectedCurrency.toUpperCase() || unitPrice + 0.01 < Number(product.price)) return null
      return {
        productId,
        name: product.name,
        quantity,
        unitPrice,
        currency: expectedCurrency,
        color: value.color,
        material: value.material,
        variant: value.variant,
        dimensions: value.dimensions,
        image: value.image,
      }
    })
    if (normalizedItems.some((item) => !item)) {
      return NextResponse.json({ error: 'One or more products are no longer available at the submitted price.' }, { status: 409 })
    }

    const orderItems = normalizedItems as Array<Record<string, unknown>>
    const itemTotal = validItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
    const numericAmount = Number(Number(amount).toFixed(2))
    if (Math.abs(itemTotal - numericAmount) > 0.01) {
      return NextResponse.json({ error: 'The order total changed. Please review your cart and try again.' }, { status: 409 })
    }

    const txRef = `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const subtotal = (numericAmount * 0.9).toFixed(2)
    const tax = (numericAmount * 0.1).toFixed(2)

    const [createdOrder] = await db.insert(orders).values({
      orderNumber: txRef,
      userId: userId,
      items: orderItems,
      subtotal: subtotal,
      tax: tax,
      shipping: '0.00',
      discount: '0.00',
      total: String(numericAmount),
      status: 'pending',
      paymentStatus: 'pending',
      deliveryAddress: shippingAddress,
      notes: shippingAddress?.notes || null,
    }).returning({ id: orders.id })

    if (!createdOrder) return NextResponse.json({ error: 'The order could not be initialized.' }, { status: 500 })

    const requestedPoints = Math.max(0, Math.floor(Number(loyaltyPoints) || 0))
    let amountAfterPoints = numericAmount
    let discountUgx = 0
    if (requestedPoints > 0) {
      try {
        const localUser = await getOrCreateCurrentUser(userId)
        if (!localUser) throw new Error('Your account is not ready for points yet.')
        const redemption = await reservePointsForOrder(localUser.id, createdOrder.id, requestedPoints)
        if (!redemption.success || typeof redemption.discountUgx !== 'number') throw new Error(redemption.error || 'Points could not be applied.')
        amountAfterPoints = Math.max(0, numericAmount - redemption.discountUgx)
        discountUgx = redemption.discountUgx
      } catch (error) {
        await db.update(orders).set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() }).where(eq(orders.id, createdOrder.id))
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Points could not be applied.' }, { status: 400 })
      }
    }

    return NextResponse.json({ txRef, orderId: createdOrder.id, amount: amountAfterPoints, discountUgx })
  } catch (error: any) {
    console.error('Create Order Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save order to database.' },
      { status: 500 }
    )
  }
}

