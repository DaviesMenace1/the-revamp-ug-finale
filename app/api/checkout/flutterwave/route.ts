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

    // 2. Read and Sanitize Secret Key
    const rawSecretKey = process.env.FLUTTERWAVE_SECRET_KEY

    // Debug logging to verify key presence in Vercel
    console.log('[Flutterwave Debug] Secret key present:', !!rawSecretKey)
    if (rawSecretKey) {
      console.log('[Flutterwave Debug] Secret key length:', rawSecretKey.length)
      console.log('[Flutterwave Debug] Secret key prefix:', rawSecretKey.substring(0, 10))
    }

    if (!rawSecretKey) {
      console.error('CRITICAL: FLUTTERWAVE_SECRET_KEY is missing in environment variables.')
      return NextResponse.json(
        { error: 'Server configuration error: FLUTTERWAVE_SECRET_KEY is missing in Vercel.' },
        { status: 500 }
      )
    }

    // Clean leading/trailing spaces or quotes
    const secretKey = rawSecretKey.trim().replace(/^["']|["']$/g, '')
    const txRef = `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Ensure site URL starts with https://
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://therevampug.com'
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`
    }

    const numericAmount = Number(amount) || 0
    const subtotal = (numericAmount * 0.9).toFixed(2)
    const tax = (numericAmount * 0.1).toFixed(2)

    // 3. Insert Order into Database
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

    // 4. Construct Payload
    const flwPayload = {
      tx_ref: txRef,
      amount: numericAmount,
      currency: (currency || 'UGX').toUpperCase().trim(),
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

    // 5. Send API Request with Cloudflare-compliant Browser Headers
    const flwRes = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      flwPayload,
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
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
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status
      const data = error.response.data

      console.error(
        `[Flutterwave API Error ${status}]:`,
        typeof data === 'string' ? data.slice(0, 300) : data
      )

      if (typeof data === 'string' && data.includes('Cloudflare')) {
        return NextResponse.json(
          {
            error:
              'Cloudflare blocked the API call. Please verify FLUTTERWAVE_SECRET_KEY is configured in Vercel.',
          },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: data?.message || `Flutterwave API returned HTTP status ${status}` },
        { status: status }
      )
    }

    console.error('Unhandled Checkout Route Error:', error?.message || error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
