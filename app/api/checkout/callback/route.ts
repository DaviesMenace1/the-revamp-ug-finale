import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { sendOrderReceiptEmail } from '@/lib/email/send-receipt'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Parameters sent by Flutterwave upon redirect
  const status = searchParams.get('status')
  const txRef = searchParams.get('tx_ref')
  const transactionId = searchParams.get('transaction_id')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

  // 1. Missing transaction parameter check
  if (!txRef) {
    return NextResponse.redirect(`${baseUrl}/checkout/failed?error=missing_ref`)
  }

  // 2. Handle immediate user cancellation
  if (status === 'cancelled') {
    await db
      .update(orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(orders.orderNumber, txRef))

    return NextResponse.redirect(`${baseUrl}/checkout/failed?orderRef=${txRef}&reason=cancelled`)
  }

  // If no transaction_id was returned by Flutterwave
  if (!transactionId) {
    return NextResponse.redirect(`${baseUrl}/checkout/failed?orderRef=${txRef}&error=no_transaction_id`)
  }

  try {
    // 3. Server-to-Server Verification with Flutterwave API
    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )

    const verifyData = await verifyResponse.json()

    // 4. Look up existing order in Postgres Database
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, txRef),
    })

    if (!existingOrder) {
      return NextResponse.redirect(`${baseUrl}/checkout/failed?error=order_not_found`)
    }

    // 5. Check transaction legitimacy (status, paid amount, currency match)
    const isSuccessful =
      verifyData.status === 'success' &&
      verifyData.data?.status === 'successful' &&
      Number(verifyData.data?.amount) >= Number(existingOrder.totalAmount) &&
      verifyData.data?.currency === existingOrder.currency

    if (isSuccessful) {
      // Mark order as completed in database
      await db
        .update(orders)
        .set({
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(orders.orderNumber, txRef))

      // Trigger Email Confirmation Receipt (Non-blocking)
      const customerAddress =
        typeof existingOrder.shippingAddress === 'string'
          ? JSON.parse(existingOrder.shippingAddress)
          : existingOrder.shippingAddress

      sendOrderReceiptEmail({
        toEmail: existingOrder.userEmail,
        orderNumber: existingOrder.orderNumber,
        amount: String(existingOrder.totalAmount),
        currency: existingOrder.currency,
        customerName: customerAddress?.name || 'Valued Customer',
      }).catch((emailErr) => {
        console.error('Failed to send order email receipt:', emailErr)
      })

      // Redirect user to the Order Success Page
      return NextResponse.redirect(
        `${baseUrl}/checkout/success?orderRef=${txRef}&flw_id=${transactionId}`
      )
    } else {
      // Payment failed or amount mismatch
      await db
        .update(orders)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(orders.orderNumber, txRef))

      return NextResponse.redirect(
        `${baseUrl}/checkout/failed?orderRef=${txRef}&error=payment_unverified`
      )
    }
  } catch (error: any) {
    console.error('Error verifying Flutterwave callback:', error)
    return NextResponse.redirect(
      `${baseUrl}/checkout/failed?orderRef=${txRef}&error=server_error`
    )
  }
}
