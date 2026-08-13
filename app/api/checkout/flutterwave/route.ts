// app/api/checkout/flutterwave/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'

// Import official Flutterwave SDK
// @ts-ignore
import Flutterwave from 'flutterwave-node-v3'

export async function POST(req: Request) {
  try {
    // 1. Authenticate Clerk User
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to checkout.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { amount, currency, email, customerName, phoneNumber, shippingAddress, items, paymentOption } = body

    if (!amount || !email || !items) {
      return NextResponse.json({ error: 'Missing required order details' }, { status: 400 })
    }

    // 2. Read and verify API Keys
    const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY?.trim()
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY?.trim()

    if (!secretKey || !publicKey) {
      console.error('CRITICAL: Flutterwave environment keys are missing or undefined.')
      return NextResponse.json(
        { error: 'Server configuration error: Flutterwave API keys missing.' },
        { status: 500 }
      )
    }

    // Initialize Flutterwave SDK
    const flw = new Flutterwave(publicKey, secretKey)

    const txRef = `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://therevampug.com'

    const numericAmount = Number(amount) || 0
    const subtotal = (numericAmount * 0.9).toFixed(2)
    const tax = (numericAmount * 0.1).toFixed(2)

    // 3. Save Order to Database
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

    // 4. Initialize Payment via Flutterwave SDK
    const payload = {
      tx_ref: txRef,
      amount: numericAmount,
      currency: (currency || 'USD').toUpperCase().trim(),
      redirect_url: `${baseUrl}/api/checkout/callback`,
      payment_options: paymentOption || 'card,mobilemoneyuganda,banktransfer',
      customer: {
        email: String(email).trim(),
        phonenumber: phoneNumber ? String(phoneNumber).trim() : '',
        name: customerName ? String(customerName).trim() : 'Customer',
      },
      customizations: {
        title: 'Store Order',
        description: `Order #${txRef}`,
      },
    }

    // Official SDK method call (Bypasses Cloudflare Raw Fetch blocks)
    const response = await flw.Payment.create(payload)

    if (response.status === 'success' && response.data?.link) {
      return NextResponse.json({ paymentUrl: response.data.link, txRef })
    } else {
      console.error('Flutterwave SDK Error:', response)
      return NextResponse.json(
        { error: response.message || 'Flutterwave payment initialization failed' },
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
