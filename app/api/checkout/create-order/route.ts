import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db/client'
import { eq, inArray } from 'drizzle-orm'
import { orders, paymentRecords, products } from '@/lib/db/schema'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { reservePointsForOrder, safelyReleasePointsForOrder } from '@/lib/loyalty/service'
import { buildFlutterwavePaymentMethod, createFlutterwaveCharge, flutterwaveConfigurationMessage, flutterwaveErrorMessage, getFlutterwaveConfig, normalizeUgandaPhone } from '@/lib/flutterwave-config'

type OrderBody = {
  amount?: unknown
  currency?: unknown
  email?: unknown
  customerName?: unknown
  phoneNumber?: unknown
  shippingAddress?: unknown
  items?: unknown
  loyaltyPoints?: unknown
  paymentMethod?: unknown
  mobileMoneyNetwork?: unknown
  cardNumber?: unknown
  cardExpiryMonth?: unknown
  cardExpiryYear?: unknown
  cardCvv?: unknown
}

function text(value: unknown, fallback = '', maxLength = 255) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : fallback
}

function normalizeBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin
  return configured.replace(/\/$/, '')
}

function customerNameParts(value: string) {
  const parts = value.split(/\s+/).filter(Boolean)
  const name: Record<string, string> = { first: parts[0] || 'Customer', last: parts.length > 1 ? parts[parts.length - 1] : 'Customer' }
  if (parts.length > 2) name.middle = parts.slice(1, -1).join(' ')
  return name
}

function addressForFlutterwave(value: unknown) {
  const address = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const city = text(address.city, 'Kampala', 100)
  return { line1: text(address.address, 'Address provided at checkout', 255), city, state: city, country: 'UG', postal_code: '00000' }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized: Please log in.' }, { status: 401 })

    const body = await request.json() as OrderBody
    const amount = Number(body.amount)
    const currency = text(body.currency, process.env.FLUTTERWAVE_CURRENCY || 'UGX', 3).toUpperCase()
    const email = text(body.email, '', 320)
    const customerName = text(body.customerName, 'Customer', 255)
    const phoneNumber = text(body.phoneNumber, '', 30)
    const shippingAddress = body.shippingAddress && typeof body.shippingAddress === 'object' ? body.shippingAddress as Record<string, unknown> : {}
    const items = Array.isArray(body.items) ? body.items : []
    const expectedCurrency = (process.env.FLUTTERWAVE_CURRENCY || 'UGX').toUpperCase()

    if (!Number.isFinite(amount) || amount <= 0 || items.length === 0 || items.length > 100) return NextResponse.json({ error: 'A valid order amount and at least one item are required.' }, { status: 400 })
    if (currency !== expectedCurrency) return NextResponse.json({ error: `Checkout currently supports ${expectedCurrency} only.` }, { status: 400 })
    if (!email.includes('@')) return NextResponse.json({ error: 'Enter a valid email address before continuing.' }, { status: 400 })

    const config = getFlutterwaveConfig()
    if (!config.ok) return NextResponse.json({ error: flutterwaveConfigurationMessage(config) }, { status: 503 })

    const parsedItems = items.map((item: unknown) => {
      if (!item || typeof item !== 'object') return null
      const value = item as Record<string, unknown>
      const productId = typeof value.productId === 'string' ? value.productId : ''
      const quantity = Number(value.quantity)
      const unitPrice = Number(value.unitPrice)
      if (!/^[0-9a-f-]{36}$/i.test(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 100 || !Number.isFinite(unitPrice) || unitPrice < 0) return null
      return { value, productId, quantity, unitPrice }
    })
    if (parsedItems.some((item) => !item)) return NextResponse.json({ error: 'One or more order items are invalid.' }, { status: 400 })

    const validItems = parsedItems as Array<{ value: Record<string, unknown>; productId: string; quantity: number; unitPrice: number }>
    const productIds = [...new Set(validItems.map((item) => item.productId))]
    const catalogProducts = await db.select({ id: products.id, name: products.name, price: products.price, currency: products.currency, status: products.status, availability: products.availability }).from(products).where(inArray(products.id, productIds))
    const catalogById = new Map(catalogProducts.map((product) => [product.id, product]))
    const normalizedItems = validItems.map(({ value, productId, quantity, unitPrice }) => {
      const product = catalogById.get(productId)
      if (!product || product.status !== 'published' || product.availability === 'out_of_stock' || product.currency.toUpperCase() !== expectedCurrency || unitPrice + 0.01 < Number(product.price)) return null
      return { productId, name: product.name, quantity, unitPrice, currency: expectedCurrency, color: value.color, material: value.material, variant: value.variant, dimensions: value.dimensions, image: value.image }
    })
    if (normalizedItems.some((item) => !item)) return NextResponse.json({ error: 'One or more products are no longer available at the submitted price.' }, { status: 409 })

    const orderItems = normalizedItems as Array<Record<string, unknown>>
    const itemTotal = validItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
    const numericAmount = Number(amount.toFixed(2))
    if (Math.abs(itemTotal - numericAmount) > 0.01) return NextResponse.json({ error: 'The order total changed. Please review your cart and try again.' }, { status: 409 })

    let paymentMethod: Awaited<ReturnType<typeof buildFlutterwavePaymentMethod>>
    try {
      paymentMethod = await buildFlutterwavePaymentMethod({ method: body.paymentMethod, phoneNumber, mobileMoneyNetwork: body.mobileMoneyNetwork, cardNumber: body.cardNumber, cardExpiryMonth: body.cardExpiryMonth, cardExpiryYear: body.cardExpiryYear, cardCvv: body.cardCvv })
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Choose a valid payment method.' }, { status: 400 })
    }

    const txRef = `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const subtotal = (numericAmount * 0.9).toFixed(2)
    const tax = (numericAmount * 0.1).toFixed(2)
    const [createdOrder] = await db.insert(orders).values({ orderNumber: txRef, userId, items: orderItems, subtotal, tax, shipping: '0.00', discount: '0.00', total: String(numericAmount), status: 'pending', paymentStatus: 'pending', deliveryAddress: shippingAddress, notes: text(shippingAddress.notes) || null }).returning({ id: orders.id })
    if (!createdOrder) return NextResponse.json({ error: 'The order could not be initialized.' }, { status: 500 })

    const requestedPoints = Math.max(0, Math.floor(Number(body.loyaltyPoints) || 0))
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

    if (discountUgx > 0) {
      await db.update(orders).set({ discount: discountUgx.toFixed(2), total: amountAfterPoints.toFixed(2), updatedAt: new Date() }).where(eq(orders.id, createdOrder.id))
    }

    const phone = normalizeUgandaPhone(phoneNumber)
    const customer: Record<string, unknown> = { email, name: customerNameParts(customerName), address: addressForFlutterwave(shippingAddress) }
    if (phone) customer.phone = { country_code: phone.countryCode, number: phone.number }
    const baseUrl = normalizeBaseUrl(request)
    const flwResponse = await createFlutterwaveCharge({ reference: txRef, amount: amountAfterPoints, currency: expectedCurrency, redirectUrl: `${baseUrl}/api/checkout/callback`, customer, paymentMethod, idempotencyKey: randomUUID(), meta: { orderId: createdOrder.id, txRef } })
    const flwPayload = flwResponse.payload || {}
    const charge = flwPayload.data
    if (!flwResponse.response?.ok || !['success', 'pending'].includes(String(flwPayload.status || '').toLowerCase()) || !charge?.id) {
      await db.update(orders).set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() }).where(eq(orders.id, createdOrder.id))
      await safelyReleasePointsForOrder(createdOrder.id)
      return NextResponse.json({ error: flutterwaveErrorMessage(flwPayload, flwResponse.response?.status || 502) }, { status: flwResponse.response?.status === 401 ? 503 : 502 })
    }

    const localUser = await getOrCreateCurrentUser(userId)
    if (!localUser) {
      await db.update(orders).set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() }).where(eq(orders.id, createdOrder.id))
      await safelyReleasePointsForOrder(createdOrder.id)
      return NextResponse.json({ error: 'Your account is not ready to record this payment yet.' }, { status: 503 })
    }
    await db.insert(paymentRecords).values({ userId: localUser.id, orderId: createdOrder.id, provider: 'flutterwave', transactionReference: String(charge.id), amount: String(amountAfterPoints), currency: expectedCurrency, method: paymentMethod.type, status: 'pending', metadata: { txRef, chargeId: String(charge.id), discountUgx } })

    return NextResponse.json({ txRef, orderId: createdOrder.id, amount: amountAfterPoints, discountUgx, paymentUrl: charge.next_action?.redirect_url?.url || null, paymentInstruction: charge.next_action?.payment_instruction?.note || null })
  } catch (error: unknown) {
    console.error('Create v4 Order Error:', error)
    return NextResponse.json({ error: 'We could not prepare this payment. Please try again.' }, { status: 500 })
  }
}
