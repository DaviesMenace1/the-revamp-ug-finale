import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db/client'
import { and, eq, inArray } from 'drizzle-orm'
import { orders, orderShipments, orderTrackingEvents, paymentRecords, pickupStations, products, savedAddresses } from '@/lib/db/schema'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { reservePointsForOrder, safelyReleasePointsForOrder } from '@/lib/loyalty/service'
import { buildFlutterwavePaymentMethod, createFlutterwaveCharge, flutterwaveConfigurationMessage, flutterwaveErrorMessage, getFlutterwaveAuthorizationType, getFlutterwaveConfig, normalizeUgandaPhone } from '@/lib/flutterwave-config'
import { notifyUser } from '@/lib/notifications/service'
import { settleOrderPayment } from '@/lib/order-payments'
import { getCollectionPromotionQuote, markCollectionPromotionApplied, releaseCollectionPromotionForOrder, reserveCollectionPromotion } from '@/lib/collection-commerce'

type OrderBody = {
  amount?: unknown
  currency?: unknown
  email?: unknown
  customerName?: unknown
  phoneNumber?: unknown
  shippingAddress?: unknown
  items?: unknown
  loyaltyPoints?: unknown
  paymentMode?: unknown
  paymentMethod?: unknown
  mobileMoneyNetwork?: unknown
  cardNumber?: unknown
  cardExpiryMonth?: unknown
  cardExpiryYear?: unknown
  cardCvv?: unknown
  deliveryMethod?: unknown
  addressId?: unknown
  saveAddress?: unknown
  pickupStationId?: unknown
  promotionCode?: unknown
  promoCode?: unknown
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

function optionSnapshot(value: unknown) {
  if (typeof value === 'string') return text(value, '', 180) || null
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const option = value as Record<string, unknown>
  const snapshot = {
    id: text(option.id, '', 80) || undefined,
    label: text(option.label, '', 180) || undefined,
    name: text(option.name, '', 180) || undefined,
    value: text(option.value, '', 180) || undefined,
    hex: text(option.hex, '', 20) || undefined,
    priceDelta: Number.isFinite(Number(option.priceDelta)) ? Number(option.priceDelta) : undefined,
  }
  return Object.values(snapshot).some(Boolean) ? snapshot : null
}

function dimensionsSnapshot(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const dimensions = value as Record<string, unknown>
  const measurement = (entry: unknown) => {
    if (typeof entry === 'number' && Number.isFinite(entry)) return String(entry)
    return text(entry, '', 30) || undefined
  }
  const snapshot = {
    width: measurement(dimensions.width),
    height: measurement(dimensions.height),
    depth: measurement(dimensions.depth),
    unit: text(dimensions.unit, 'in', 12),
  }
  return Object.values(snapshot).some(Boolean) ? snapshot : null
}

function accessoriesSnapshot(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(optionSnapshot).filter(Boolean)
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
    const submittedShippingAddress = body.shippingAddress && typeof body.shippingAddress === 'object' ? body.shippingAddress as Record<string, unknown> : {}
    const requestedDeliveryMethod = text(body.deliveryMethod ?? submittedShippingAddress.deliveryMethod, '', 30).toLowerCase()
    const deliveryMethod = requestedDeliveryMethod === 'pickup_station' || requestedDeliveryMethod === 'pickup' ? 'pickup_station' : 'door_delivery'
    const paymentMode = body.paymentMode === 'pay_on_delivery' ? 'pay_on_delivery' : 'pay_now'
    const requestedPaymentMethod = body.paymentMethod === 'card' ? 'card' : 'mobile_money'
    const addressId = text(body.addressId ?? submittedShippingAddress.addressId, '', 80)
    const pickupStationId = text(body.pickupStationId ?? submittedShippingAddress.pickupStationId, '', 80)
    const promotionCode = text(body.promotionCode ?? body.promoCode, '', 40)
    const items = Array.isArray(body.items) ? body.items : []
    const expectedCurrency = (process.env.FLUTTERWAVE_CURRENCY || 'UGX').toUpperCase()

    if (!Number.isFinite(amount) || amount <= 0 || items.length === 0 || items.length > 100) return NextResponse.json({ error: 'A valid order amount and at least one item are required.' }, { status: 400 })
    if (currency !== expectedCurrency) return NextResponse.json({ error: `Checkout currently supports ${expectedCurrency} only.` }, { status: 400 })
    if (!email.includes('@')) return NextResponse.json({ error: 'Enter a valid email address before continuing.' }, { status: 400 })

    if (paymentMode === 'pay_now') {
      const config = getFlutterwaveConfig()
      if (!config.ok) return NextResponse.json({ error: flutterwaveConfigurationMessage(config) }, { status: 503 })
    }

    const localUser = await getOrCreateCurrentUser(userId)
    if (!localUser) return NextResponse.json({ error: 'Your account is not ready to place this order yet.' }, { status: 503 })

    let shippingAddress: Record<string, unknown>
    if (deliveryMethod === 'pickup_station') {
      if (!/^[0-9a-f-]{36}$/i.test(pickupStationId)) return NextResponse.json({ error: 'Choose a valid pickup station.' }, { status: 400 })
      const [station] = await db.select({ id: pickupStations.id, name: pickupStations.name, address: pickupStations.address, city: pickupStations.city, region: pickupStations.region, country: pickupStations.country, phone: pickupStations.phone, instructions: pickupStations.instructions, fee: pickupStations.fee, latitude: pickupStations.latitude, longitude: pickupStations.longitude }).from(pickupStations).where(and(eq(pickupStations.id, pickupStationId), eq(pickupStations.active, true))).limit(1)
      if (!station) return NextResponse.json({ error: 'That pickup station is no longer available. Please choose another station.' }, { status: 409 })
      shippingAddress = {
        deliveryMethod: 'pickup_station',
        pickupStationId: station.id,
        pickupStation: station,
        name: customerName,
        phone: phoneNumber,
        address: station.address,
        city: station.city,
        region: station.region,
        country: station.country,
        notes: text(submittedShippingAddress.notes, '', 1000),
      }
    } else {
      let savedAddress: typeof savedAddresses.$inferSelect | null = null
      if (/^[0-9a-f-]{36}$/i.test(addressId)) {
        const [selected] = await db.select().from(savedAddresses).where(and(eq(savedAddresses.id, addressId), eq(savedAddresses.userId, localUser.id))).limit(1)
        savedAddress = selected || null
        if (!savedAddress) return NextResponse.json({ error: 'That saved address is no longer available. Please choose or enter another address.' }, { status: 409 })
      }
      const candidate = savedAddress && body.saveAddress !== true ? savedAddress : {
        id: savedAddress?.id || null,
        label: text(submittedShippingAddress.label, '', 120) || savedAddress?.label || 'Checkout address',
        recipientName: customerName,
        phone: phoneNumber,
        address: text(submittedShippingAddress.address, '', 2000),
        city: text(submittedShippingAddress.city, '', 120),
        region: text(submittedShippingAddress.region, '', 120),
        country: text(submittedShippingAddress.country, '', 100) || 'Uganda',
        notes: text(submittedShippingAddress.notes, '', 1000),
        isDefault: savedAddress?.isDefault || false,
      }
      if (!candidate.address || !candidate.city) return NextResponse.json({ error: 'A delivery address and city are required.' }, { status: 400 })
      let persistedAddressId = savedAddress?.id || null
      if (body.saveAddress === true) {
        await db.update(savedAddresses).set({ isDefault: false, updatedAt: new Date() }).where(eq(savedAddresses.userId, localUser.id))
        if (savedAddress) {
          await db.update(savedAddresses).set({ label: candidate.label, recipientName: candidate.recipientName, phone: candidate.phone, address: candidate.address, city: candidate.city, region: candidate.region || null, country: candidate.country, notes: candidate.notes || null, isDefault: true, updatedAt: new Date() }).where(and(eq(savedAddresses.id, savedAddress.id), eq(savedAddresses.userId, localUser.id)))
        } else {
          const [createdAddress] = await db.insert(savedAddresses).values({ userId: localUser.id, label: candidate.label, recipientName: candidate.recipientName, phone: candidate.phone, address: candidate.address, city: candidate.city, region: candidate.region || null, country: candidate.country, notes: candidate.notes || null, isDefault: true, updatedAt: new Date() }).returning({ id: savedAddresses.id })
          persistedAddressId = createdAddress?.id || null
        }
      }
      shippingAddress = {
        deliveryMethod: 'door_delivery',
        addressId: persistedAddressId,
        label: candidate.label,
        name: candidate.recipientName,
        phone: candidate.phone,
        address: candidate.address,
        city: candidate.city,
        region: candidate.region || null,
        country: candidate.country,
        notes: candidate.notes || '',
      }
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
    if (parsedItems.some((item) => !item)) return NextResponse.json({ error: 'One or more order items are invalid.' }, { status: 400 })

    const validItems = parsedItems as Array<{ value: Record<string, unknown>; productId: string; quantity: number; unitPrice: number }>
    const productIds = [...new Set(validItems.map((item) => item.productId))]
    const catalogProducts = await db.select({ id: products.id, name: products.name, price: products.price, currency: products.currency, status: products.status, availability: products.availability }).from(products).where(inArray(products.id, productIds))
    const catalogById = new Map(catalogProducts.map((product) => [product.id, product]))
    const normalizedItems = validItems.map(({ value, productId, quantity, unitPrice }) => {
      const product = catalogById.get(productId)
      if (!product || product.status !== 'published' || product.availability === 'out_of_stock' || product.currency.toUpperCase() !== expectedCurrency || unitPrice + 0.01 < Number(product.price)) return null
      const color = optionSnapshot(value.color)
      const fabric = optionSnapshot(value.fabric)
      const material = optionSnapshot(value.material)
      const variant = optionSnapshot(value.variant)
      const accessories = accessoriesSnapshot(value.accessories)
      const dimensions = dimensionsSnapshot(value.customDimensions ?? value.dimensions)
      return {
        productId,
        name: product.name,
        quantity,
        unitPrice,
        currency: expectedCurrency,
        color,
        fabric,
        material,
        variant,
        accessories,
        dimensions,
        configuration: { color, fabric, material, variant, accessories, dimensions },
        image: text(value.image, '', 200) || null,
      }
    })
    if (normalizedItems.some((item) => !item)) return NextResponse.json({ error: 'One or more products are no longer available at the submitted price.' }, { status: 409 })

    const orderItems = normalizedItems as Array<Record<string, unknown>>
    const itemTotal = validItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
    const deliveryFee = deliveryMethod === 'pickup_station' ? Math.max(0, Number(shippingAddress.pickupStation && typeof shippingAddress.pickupStation === 'object' ? (shippingAddress.pickupStation as Record<string, unknown>).fee : 0) || 0) : 0
    const numericAmount = Number(amount.toFixed(2))
    if (Math.abs(itemTotal + deliveryFee - numericAmount) > 0.01) return NextResponse.json({ error: 'The order total changed. Please review your cart and try again.' }, { status: 409 })

    const requestedPoints = Math.max(0, Math.floor(Number(body.loyaltyPoints) || 0))
    const promotionResult = promotionCode ? await getCollectionPromotionQuote({ userId: localUser.id, code: promotionCode, items: validItems }) : null
    if (promotionResult && !promotionResult.success) return NextResponse.json({ error: promotionResult.error }, { status: 409 })
    if (promotionResult?.success && requestedPoints > 0 && !promotionResult.quote.promotion.stackable) return NextResponse.json({ error: 'This collection promo code cannot be combined with loyalty points. Remove the points or use another code.' }, { status: 409 })
    let promotionDiscountUgx = promotionResult?.success ? promotionResult.quote.discountAmount : 0
    let amountAfterPromotion = Math.max(0, numericAmount - promotionDiscountUgx)

    let paymentMethod: Awaited<ReturnType<typeof buildFlutterwavePaymentMethod>> | null = null
    if (paymentMode === 'pay_now') {
      try {
        paymentMethod = await buildFlutterwavePaymentMethod({ method: body.paymentMethod, phoneNumber, mobileMoneyNetwork: body.mobileMoneyNetwork, cardNumber: body.cardNumber, cardExpiryMonth: body.cardExpiryMonth, cardExpiryYear: body.cardExpiryYear, cardCvv: body.cardCvv })
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Choose a valid payment method.' }, { status: 400 })
      }
    }

    const txRef = `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const subtotal = (itemTotal * 0.9).toFixed(2)
    const tax = (itemTotal * 0.1).toFixed(2)
    const [createdOrder] = await db.insert(orders).values({ orderNumber: txRef, userId, items: orderItems, subtotal, tax, shipping: deliveryFee.toFixed(2), discount: promotionDiscountUgx.toFixed(2), total: String(amountAfterPromotion), status: paymentMode === 'pay_on_delivery' ? 'confirmed' : 'pending', paymentStatus: 'pending', paymentMode, paymentMethod: paymentMode === 'pay_now' ? requestedPaymentMethod : null, deliveryAddress: shippingAddress, promotionId: promotionResult?.success ? promotionResult.quote.promotion.id : null, promotionCode: promotionResult?.success ? promotionResult.quote.promotion.code : null, promotionName: promotionResult?.success ? promotionResult.quote.promotion.name : null, promotionDiscount: promotionDiscountUgx.toFixed(2), notes: text(shippingAddress.notes) || null }).returning({ id: orders.id })
    if (!createdOrder) return NextResponse.json({ error: 'The order could not be initialized.' }, { status: 500 })

    if (promotionCode) {
      const reservation = await reserveCollectionPromotion({ userId: localUser.id, orderId: createdOrder.id, code: promotionCode, items: validItems })
      if (!reservation.success) {
        await db.update(orders).set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() }).where(eq(orders.id, createdOrder.id))
        return NextResponse.json({ error: reservation.error }, { status: 409 })
      }
      promotionDiscountUgx = reservation.quote.discountAmount
      amountAfterPromotion = Math.max(0, numericAmount - promotionDiscountUgx)
      if (Math.abs(Number(promotionDiscountUgx.toFixed(2)) - Number((promotionResult?.success ? promotionResult.quote.discountAmount : 0).toFixed(2))) > 0.01) {
        await db.update(orders).set({ discount: promotionDiscountUgx.toFixed(2), total: amountAfterPromotion.toFixed(2), promotionDiscount: promotionDiscountUgx.toFixed(2), updatedAt: new Date() }).where(eq(orders.id, createdOrder.id))
      }
    }

    let amountAfterPoints = amountAfterPromotion
    let discountUgx = 0
    if (requestedPoints > 0) {
      try {
        const redemption = await reservePointsForOrder(localUser.id, createdOrder.id, requestedPoints)
        if (!redemption.success || typeof redemption.discountUgx !== 'number') throw new Error(redemption.error || 'Points could not be applied.')
        amountAfterPoints = Math.max(0, amountAfterPromotion - redemption.discountUgx)
        discountUgx = redemption.discountUgx
      } catch (error) {
        await db.update(orders).set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() }).where(eq(orders.id, createdOrder.id))
        await releaseCollectionPromotionForOrder(createdOrder.id)
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Points could not be applied.' }, { status: 400 })
      }
    }

    if (discountUgx > 0) {
      await db.update(orders).set({ discount: (promotionDiscountUgx + discountUgx).toFixed(2), total: amountAfterPoints.toFixed(2), updatedAt: new Date() }).where(eq(orders.id, createdOrder.id))
    }

    const shipmentStatus = paymentMode === 'pay_on_delivery' ? 'processing' : 'awaiting_payment'
    const trackingCode = `RV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
    const [createdShipment] = await db.insert(orderShipments).values({ orderId: createdOrder.id, trackingCode, status: shipmentStatus, lastNote: paymentMode === 'pay_on_delivery' ? 'Order placed with payment due at fulfilment.' : 'Order created and awaiting payment confirmation.', updatedAt: new Date() }).returning({ id: orderShipments.id })
    if (!createdShipment) {
      await db.update(orders).set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() }).where(eq(orders.id, createdOrder.id))
      await safelyReleasePointsForOrder(createdOrder.id)
      await releaseCollectionPromotionForOrder(createdOrder.id)
      return NextResponse.json({ error: 'The order could not be prepared for fulfilment.' }, { status: 500 })
    }
    await db.insert(orderTrackingEvents).values({ orderId: createdOrder.id, shipmentId: createdShipment.id, status: shipmentStatus, note: paymentMode === 'pay_on_delivery' ? 'Order placed with payment due at fulfilment.' : 'Order created and awaiting payment confirmation.', customerVisible: true })

    if (paymentMode === 'pay_on_delivery') {
      await markCollectionPromotionApplied(createdOrder.id)
      const deliveryMessage = deliveryMethod === 'pickup_station' && shippingAddress.pickupStation && typeof shippingAddress.pickupStation === 'object'
        ? `Pickup at ${String((shippingAddress.pickupStation as Record<string, unknown>).name || 'your selected station')}.`
        : `Door delivery to ${String(shippingAddress.city || shippingAddress.address || 'your saved address')}.`
      await notifyUser({
        userId: localUser.id,
        type: 'order_placed_pay_on_delivery',
        priority: 'important',
        title: `Order ${txRef} confirmed`,
        message: `Your pay-on-delivery order is confirmed. Payment is due when your order is delivered or collected. ${deliveryMessage}`,
        actionUrl: `/client/orders?order=${encodeURIComponent(createdOrder.id)}`,
        metadata: { orderId: createdOrder.id, orderNumber: txRef, status: 'confirmed', total: amountAfterPoints.toFixed(2), currency: expectedCurrency, paymentMode, deliveryAddress: shippingAddress, items: orderItems, trackingCode },
        channels: ['in_app', 'push', 'email'],
      })
      return NextResponse.json({ txRef, orderId: createdOrder.id, paymentMode, status: 'placed', orderStatus: 'confirmed', paymentStatus: 'pending', amount: amountAfterPoints, discountUgx, promotionCode: promotionResult?.success ? promotionResult.quote.promotion.code : null, promotionDiscountUgx })
    }

    const phone = normalizeUgandaPhone(phoneNumber)
    const customer: Record<string, unknown> = { email, name: customerNameParts(customerName), address: addressForFlutterwave(shippingAddress) }
    if (phone) customer.phone = { country_code: phone.countryCode, number: phone.number }
    const baseUrl = normalizeBaseUrl(request)
    if (!paymentMethod) {
      await db.update(orders).set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() }).where(eq(orders.id, createdOrder.id))
      await safelyReleasePointsForOrder(createdOrder.id)
      await releaseCollectionPromotionForOrder(createdOrder.id)
      return NextResponse.json({ error: 'Choose a valid payment method.' }, { status: 400 })
    }
    const flwResponse = await createFlutterwaveCharge({ reference: txRef, amount: amountAfterPoints, currency: expectedCurrency, redirectUrl: `${baseUrl}/api/checkout/callback?reference=${encodeURIComponent(txRef)}&tx_ref=${encodeURIComponent(txRef)}`, customer, paymentMethod, idempotencyKey: randomUUID(), meta: { orderId: createdOrder.id, txRef } })
    const flwPayload = flwResponse.payload || {}
    const charge = flwPayload.data
    const chargeStatus = String(charge?.status || '').toLowerCase()
    if (!flwResponse.response?.ok || !['success', 'pending'].includes(String(flwPayload.status || '').toLowerCase()) || !charge?.id) {
      await db.update(orders).set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() }).where(eq(orders.id, createdOrder.id))
      await db.update(orderShipments).set({ status: 'cancelled', lastNote: 'Payment initialization failed.', updatedAt: new Date() }).where(eq(orderShipments.id, createdShipment.id))
      await db.insert(orderTrackingEvents).values({ orderId: createdOrder.id, shipmentId: createdShipment.id, status: 'cancelled', note: 'Payment initialization failed.', customerVisible: false })
      await safelyReleasePointsForOrder(createdOrder.id)
      await releaseCollectionPromotionForOrder(createdOrder.id)
      return NextResponse.json({ error: flutterwaveErrorMessage(flwPayload, flwResponse.response?.status || 502) }, { status: flwResponse.response?.status === 401 ? 503 : 502 })
    }

    await db.insert(paymentRecords).values({ userId: localUser.id, orderId: createdOrder.id, provider: 'flutterwave', transactionReference: String(charge.id), amount: String(amountAfterPoints), currency: expectedCurrency, method: paymentMethod.type, status: 'pending', metadata: { txRef, chargeId: String(charge.id), discountUgx } })

    if (chargeStatus === 'succeeded') {
      const settled = await settleOrderPayment({ orderRef: txRef, chargeId: String(charge.id) })
      if (settled.success) return NextResponse.json({ txRef, orderId: createdOrder.id, paymentMode, paymentMethod: paymentMethod.type, status: 'paid', amount: amountAfterPoints, discountUgx, promotionCode: promotionResult?.success ? promotionResult.quote.promotion.code : null, promotionDiscountUgx })
    }

    return NextResponse.json({ txRef, orderId: createdOrder.id, paymentMode, paymentMethod: paymentMethod.type, status: 'pending', chargeId: String(charge.id), chargeStatus: chargeStatus || 'pending', authorizationType: getFlutterwaveAuthorizationType(charge), amount: amountAfterPoints, discountUgx, promotionCode: promotionResult?.success ? promotionResult.quote.promotion.code : null, promotionDiscountUgx, paymentUrl: charge.next_action?.redirect_url?.url || null, paymentInstruction: charge.next_action?.payment_instruction?.note || null })
  } catch (error: unknown) {
    console.error('Create v4 Order Error:', error)
    return NextResponse.json({ error: 'We could not prepare this payment. Please try again.' }, { status: 500 })
  }
}
