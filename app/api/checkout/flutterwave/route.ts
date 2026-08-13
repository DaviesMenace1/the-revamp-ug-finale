// app/api/checkout/flutterwave/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'

export async function POST(req: Request) {
  try {
    // 1. Get authenticated Clerk userId
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to checkout.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { amount, currency, email, customerName, phoneNumber, shippingAddress, items } = body

    if (!amount || !email || !items) {
      return NextResponse.json({ error: 'Missing required order details' }, { status: 400 })
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY
    if (!secretKey) {
      console.error('Missing FLUTTERWAVE_SECRET_KEY in environment variables.')
      return NextResponse.json(
        { error: 'Server configuration error: FLUTTERWAVE_SECRET_KEY missing' },
        { status: 500 }
      )
    }

    const txRef = `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const numericAmount = Number(amount) || 0
    const subtotal = (numericAmount * 0.9).toFixed(2)
    const tax = (numericAmount * 0.1).toFixed(2)

    // 2. Insert into DB
    await db.insert(orders).values({
      orderNumber: txRef,
      userId: userId,
      items: items,
      subtotal: subtotal,
      tax: tax,
      shipping: '0.00',
      discount: '0.00',
      total: String(numericAmount),
      status: 'pending',
      paymentStatus: 'pending',
      deliveryAddress: shippingAddress,
      notes: shippingAddress?.notes || null,
    })

    // 3. Initiate Flutterwave Payment
    const flwResponse = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: numericAmount,
        currency: currency || 'USD',
        redirect_url: `${baseUrl}/api/checkout/callback`,
        customer: {
          email: email,
          phonenumber: phoneNumber,
          name: customerName,
        },
        customizations: {
          title: 'Store Order',
          description: `Order #${txRef}`,
        },
      }),
    })

    // Safely check content type before parsing JSON
    const contentType = flwResponse.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const errorText = await flwResponse.text()
      console.error('Flutterwave returned non-JSON response:', errorText)
      return NextResponse.json(
        { error: 'Flutterwave gateway service error. Please try again later.' },
        { status: 502 }
      )
    }

    const flwData = await flwResponse.json()

    if (flwData.status === 'success' && flwData.data?.link) {
      return NextResponse.json({ paymentUrl: flwData.data.link, txRef })
    } else {
      return NextResponse.json(
        { error: flwData.message || 'Flutterwave payment initialization failed' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Unhandled Checkout Route Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

