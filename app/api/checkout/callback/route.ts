import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { orders, users } from '@/lib/db/schema'
import { and, eq, ne } from 'drizzle-orm'
import { sendOrderReceiptEmail } from '@/lib/email/send-receipt'
import { safelyReleasePointsForOrder, settleSuccessfulOrderRewards } from '@/lib/loyalty/service'

type DeliveryAddress = { name?: string; [key: string]: unknown }

function parseAddress(value: unknown): DeliveryAddress {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' ? parsed as DeliveryAddress : {}
    } catch {
      return {}
    }
  }
  return value && typeof value === 'object' ? value as DeliveryAddress : {}
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const txRef = searchParams.get('tx_ref')
  const transactionId = searchParams.get('transaction_id')
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
  const expectedCurrency = process.env.FLUTTERWAVE_CURRENCY || 'UGX'

  if (!txRef) return NextResponse.redirect(`${baseUrl}/checkout/failed?error=missing_ref`)

  if (status === 'cancelled') {
    const [cancelledOrder] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.orderNumber, txRef), ne(orders.paymentStatus, 'completed')))
      .limit(1)
    if (cancelledOrder) {
      await db
        .update(orders)
        .set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() })
        .where(and(eq(orders.id, cancelledOrder.id), ne(orders.paymentStatus, 'completed')))
      await safelyReleasePointsForOrder(cancelledOrder.id)
    }
    return NextResponse.redirect(`${baseUrl}/checkout/failed?orderRef=${txRef}&reason=cancelled`)
  }

  if (!transactionId) return NextResponse.redirect(`${baseUrl}/checkout/failed?orderRef=${txRef}&error=no_transaction_id`)

  try {
    const verifyResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
    const verifyData = await verifyResponse.json()
    const existingOrder = await db.query.orders.findFirst({ where: eq(orders.orderNumber, txRef) })

    if (!existingOrder) return NextResponse.redirect(`${baseUrl}/checkout/failed?error=order_not_found`)

    const isSuccessful =
      verifyResponse.ok &&
      verifyData.status === 'success' &&
      verifyData.data?.status === 'successful' &&
      Number(verifyData.data?.amount) >= Number(existingOrder.total) &&
      verifyData.data?.currency === expectedCurrency

    if (isSuccessful) {
      const [settledOrder] = await db
        .update(orders)
        .set({ status: 'confirmed', paymentStatus: 'completed', updatedAt: new Date() })
        .where(and(eq(orders.orderNumber, txRef), ne(orders.paymentStatus, 'completed')))
        .returning({ id: orders.id })

      if (!settledOrder) {
        const [latestOrder] = await db
          .select({ paymentStatus: orders.paymentStatus })
          .from(orders)
          .where(eq(orders.orderNumber, txRef))
          .limit(1)
        if (latestOrder?.paymentStatus === 'completed') {
          return NextResponse.redirect(`${baseUrl}/checkout/success?orderRef=${txRef}&flw_id=${transactionId}`)
        }
        return NextResponse.redirect(`${baseUrl}/checkout/failed?orderRef=${txRef}&error=payment_state_conflict`)
      }

      const customer = await db.query.users.findFirst({ where: eq(users.clerkId, existingOrder.userId) })
      const address = parseAddress(existingOrder.deliveryAddress)
      if (customer) {
        await settleSuccessfulOrderRewards(customer.id, existingOrder.id, existingOrder.subtotal)
      }
      if (customer?.email) {
        await sendOrderReceiptEmail({
          toEmail: customer.email,
          orderNumber: existingOrder.orderNumber,
          amount: String(existingOrder.total),
          currency: expectedCurrency,
          customerName: typeof address.name === 'string' ? address.name : 'Valued Customer',
        })
      }

      return NextResponse.redirect(`${baseUrl}/checkout/success?orderRef=${txRef}&flw_id=${transactionId}`)
    }

    await db
      .update(orders)
      .set({ status: 'cancelled', paymentStatus: 'failed', updatedAt: new Date() })
      .where(and(eq(orders.orderNumber, txRef), ne(orders.paymentStatus, 'completed')))
    await safelyReleasePointsForOrder(existingOrder.id)
    return NextResponse.redirect(`${baseUrl}/checkout/failed?orderRef=${txRef}&error=payment_unverified`)
  } catch (error) {
    console.error('Error verifying Flutterwave callback:', error)
    return NextResponse.redirect(`${baseUrl}/checkout/failed?orderRef=${txRef}&error=server_error`)
  }
}
