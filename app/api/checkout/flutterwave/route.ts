import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { amount, currency, email, customerName, phoneNumber, shippingAddress, items } = body

    if (!amount || !email || !items) {
      return NextResponse.json({ error: 'Missing required order details' }, { status: 400 })
    }

    // Unique transaction reference
    const txRef = `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // 1. Create Pending Order in Postgres Database
    await db.insert(orders).values({
      orderNumber: txRef,
      userEmail: email,
      totalAmount: String(amount),
      currency: currency || 'USD',
      status: 'pending',
      items: items,
      shippingAddress: shippingAddress,
    })

    // 2. Call Flutterwave Standard Payment API
    const flwResponse = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: amount,
        currency: currency || 'USD',
        redirect_url: `${baseUrl}/api/checkout/callback`,
        customer: {
          email: email,
          phonenumber: phoneNumber,
          name: customerName,
        },
        customizations: {
          title: 'Store Purchase',
          description: `Order #${txRef}`,
        },
      }),
    })

    const flwData = await flwResponse.json()

    if (flwData.status === 'success' && flwData.data?.link) {
      return NextResponse.json({ paymentUrl: flwData.data.link, txRef })
    } else {
      return NextResponse.json(
        { error: flwData.message || 'Flutterwave initialization failed' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Flutterwave API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
