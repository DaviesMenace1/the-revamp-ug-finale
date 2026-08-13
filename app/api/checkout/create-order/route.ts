// app/api/checkout/create-order/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Please log in.' }, { status: 401 })
    }

    const body = await req.json()
    const { amount, shippingAddress, items } = body

    if (!amount || !items) {
      return NextResponse.json({ error: 'Missing required order fields.' }, { status: 400 })
    }

    const txRef = `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const numericAmount = Number(amount) || 0
    const subtotal = (numericAmount * 0.9).toFixed(2)
    const tax = (numericAmount * 0.1).toFixed(2)

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

    return NextResponse.json({ txRef })
  } catch (error: any) {
    console.error('Create Order Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save order to database.' },
      { status: 500 }
    )
  }
}

