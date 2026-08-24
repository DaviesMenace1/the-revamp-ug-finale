import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { orders, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { sendOrderReceiptEmail } from '@/lib/email/send-receipt'

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

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('verif-hash')
    if (!signature || signature !== process.env.FLUTTERWAVE_SECRET_HASH) {
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 })
    }

    const payload = await req.json()
    const data = payload?.data
    if (payload?.event !== 'charge.completed' || data?.status !== 'successful' || !data?.tx_ref) {
      return NextResponse.json({ status: 'ignored' })
    }

    const expectedCurrency = process.env.FLUTTERWAVE_CURRENCY || 'UGX'
    const existingOrder = await db.query.orders.findFirst({ where: eq(orders.orderNumber, data.tx_ref) })
    if (!existingOrder) return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    if (existingOrder.paymentStatus === 'completed') return NextResponse.json({ message: 'Order already processed' })

    const amountMatches = Number(data.amount) >= Number(existingOrder.total)
    const currencyMatches = data.currency === expectedCurrency
    if (!amountMatches || !currencyMatches) {
      await db.update(orders).set({ paymentStatus: 'failed', updatedAt: new Date() }).where(eq(orders.orderNumber, data.tx_ref))
      return NextResponse.json({ error: 'Payment amount or currency mismatch' }, { status: 400 })
    }

    await db.update(orders).set({ status: 'confirmed', paymentStatus: 'completed', updatedAt: new Date() }).where(eq(orders.orderNumber, data.tx_ref))

    const customer = await db.query.users.findFirst({ where: eq(users.clerkId, existingOrder.userId) })
    const address = parseAddress(existingOrder.deliveryAddress)
    if (customer?.email) {
      await sendOrderReceiptEmail({
        toEmail: customer.email,
        orderNumber: existingOrder.orderNumber,
        amount: String(existingOrder.total),
        currency: expectedCurrency,
        customerName: typeof address.name === 'string' ? address.name : 'Valued Customer',
      })
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Flutterwave webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
