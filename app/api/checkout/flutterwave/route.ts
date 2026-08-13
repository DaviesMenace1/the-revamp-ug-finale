// app/api/checkout/flutterwave/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'
import axios from 'axios'

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
    const {
      amount,
      currency,
      email,
      customerName,
      phoneNumber,
      shippingAddress,
      items,
      paymentOption,
    } = body

    if (!amount || !email || !items) {
      return NextResponse.json({ error: 'Missing required order details' }, { status: 400 })
    }

    // 2. Read and Sanitize Flutterwave Secret Key
    const rawSecretKey = process.env.FLUTTERWAVE_SECRET_KEY
    if (!rawSecretKey) {
      console.error('CRITICAL: FLUTTERWAVE_SECRET_KEY is missing in environment variables.')
      return NextResponse.json(
        { error: 'Server configuration error: FLUTTERWAVE_SECRET_KEY is missing.' },
        { status: 500 }
      )
    }

    const secretKey = rawSecretKey.trim().replace(/^["']|["']$/g, '')
    const txRef = `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // 3. Ensure redirect URL uses HTTPS (Flutterwave Cloudflare WAF rejects HTTP)
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://therevampug.com'
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`
    }

    const numericAmount = Number(amount) || 0
    const subtotal = (numericAmount * 0.9).toFixed(2)
    const tax = (numericAmount * 0.1).toFixed(2)

    // 4. Insert Order into Database
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

    // 5. Construct Flutterwave Payment Payload
    const flwPayload = {
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

    // 6. Make HTTPS request using Axios (Bypasses Next.js fetch patches and Cloudflare 403)
    const flwRes = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      flwPayload,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 15000,
      }
    )

    const flwData = flwRes.data

    if (flwData.status === 'success' && flwData.data?.link) {
      return NextResponse.json({ paymentUrl: flwData.data.link, txRef })
    } else {
      return NextResponse.json(
        { error: flwData.message || 'Flutterwave payment initialization failed' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Checkout Route Error:', error?.response?.data || error?.message || error)

    // Return detailed error message if returned from Flutterwave
    if (error.response?.data?.message) {
      return NextResponse.json(
        { error: error.response.data.message },
        { status: error.response.status || 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
