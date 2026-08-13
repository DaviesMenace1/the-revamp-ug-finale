import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { sendOrderReceiptEmail } from '@/lib/email/send-receipt'

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Secret Hash from Flutterwave headers
    const signature = req.headers.get('verif-hash')
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH

    if (!signature || signature !== secretHash) {
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 })
    }

    const payload = await req.json()
    const { event, data } = payload

    // 2. Handle successful charge events
    if (event === 'charge.completed' && data.status === 'successful') {
      const txRef = data.tx_ref

      // Fetch order from DB
      const existingOrder = await db.query.orders.findFirst({
        where: eq(orders.orderNumber, txRef),
      })

      // Skip if order missing or already completed
      if (!existingOrder || existingOrder.status === 'completed') {
        return NextResponse.json({ message: 'Order already processed or not found' })
      }

      // Verify payment amount matches database
      if (Number(data.amount) >= Number(existingOrder.totalAmount)) {
        // Mark as completed
        await db
          .update(orders)
          .set({ status: 'completed', updatedAt: new Date() })
          .where(eq(orders.orderNumber, txRef))

        // Send Email Receipt
        const shipping = typeof existingOrder.shippingAddress === 'string'
          ? JSON.parse(existingOrder.shippingAddress)
          : existingOrder.shippingAddress

        await sendOrderReceiptEmail({
          toEmail: existingOrder.userEmail,
          orderNumber: existingOrder.orderNumber,
          amount: String(existingOrder.totalAmount),
          currency: existingOrder.currency,
          customerName: shipping?.name || 'Valued Customer',
        })
      }
    }

    return NextResponse.json({ status: 'success' })
  } catch (error: any) {
    console.error('Flutterwave webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}



// import { NextResponse } from 'next/server'
// import { db } from '@/lib/db/client'
// import { orders } from '@/lib/db/schema'
// import { eq } from 'drizzle-orm'

// export async function POST(req: Request) {
//   try {
//     // 1. Verify Secret Hash Header
//     const signature = req.headers.get('verif-hash')
//     const secretHash = process.env.FLUTTERWAVE_SECRET_HASH

//     if (!signature || signature !== secretHash) {
//       return NextResponse.json(
//         { error: 'Unauthorized: Invalid signature' },
//         { status: 401 }
//       )
//     }

//     const payload = await req.json()
//     const { event, data } = payload

//     // 2. Handle successful charge event
//     if (event === 'charge.completed' && data.status === 'successful') {
//       const txRef = data.tx_ref
//       const transactionId = data.id
//       const amountPaid = data.amount
//       const currency = data.currency

//       // Optional double-verification check directly against Flutterwave API
//       const verifyRes = await fetch(
//         `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
//         {
//           headers: {
//             Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       )
//       const verifyData = await verifyRes.json()

//       if (
//         verifyData.status !== 'success' ||
//         verifyData.data.status !== 'successful'
//       ) {
//         return NextResponse.json({ message: 'Transaction verification failed' }, { status: 400 })
//       }

//       // 3. Find order in DB
//       const existingOrder = await db.query.orders.findFirst({
//         where: eq(orders.orderNumber, txRef),
//       })

//       if (!existingOrder) {
//         console.warn(`Webhook received for non-existent order: ${txRef}`)
//         return NextResponse.json({ message: 'Order not found' }, { status: 404 })
//       }

//       // Idempotency: Avoid processing already completed orders twice
//       if (existingOrder.status === 'completed') {
//         return NextResponse.json({ message: 'Order already processed' }, { status: 200 })
//       }

//       // 4. Update order status to completed
//       await db
//         .update(orders)
//         .set({
//           status: 'completed',
//           updatedAt: new Date(),
//         })
//         .where(eq(orders.orderNumber, txRef))

//       // Trigger post-payment actions here (e.g., send receipt email, update inventory)
//     }

//     // Always respond with 200 OK to acknowledge receipt of the event
//     return NextResponse.json({ status: 'success' }, { status: 200 })
//   } catch (error) {
//     console.error('Webhook error:', error)
//     return NextResponse.json(
//       { error: 'Internal Server Error' },
//       { status: 500 }
//     )
//   }
// }
