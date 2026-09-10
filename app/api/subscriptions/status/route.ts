import { auth } from '@clerk/nextjs/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { programSubscriptions } from '@/lib/db/schema'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { settleSubscriptionPayment } from '@/lib/subscription-payments'

export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return Response.json({ error: 'Please sign in to check this subscription payment.' }, { status: 401 })
    const user = await getOrCreateCurrentUser(clerkId)
    if (!user) return Response.json({ error: 'Your account is not ready yet. Please try again.' }, { status: 503 })

    const txRef = new URL(request.url).searchParams.get('tx_ref')?.trim() || new URL(request.url).searchParams.get('reference')?.trim() || ''
    if (!/^REV-SUB-(MEMBERSHIP|TRADE)-/i.test(txRef)) return Response.json({ error: 'A valid subscription payment reference is required.' }, { status: 400 })

    const subscription = await db.query.programSubscriptions.findFirst({ where: and(eq(programSubscriptions.transactionReference, txRef), eq(programSubscriptions.userId, user.id)), columns: { id: true, program: true, status: true, providerChargeId: true } })
    if (!subscription) return Response.json({ error: 'Subscription payment was not found.' }, { status: 404 })
    if (subscription.status === 'active') return Response.json({ status: 'active', program: subscription.program, subscriptionId: subscription.id })

    const result = await settleSubscriptionPayment({ transactionReference: txRef, chargeId: subscription.providerChargeId })
    return Response.json({ status: result.success ? 'active' : result.status, program: subscription.program, subscriptionId: subscription.id, message: result.error || null })
  } catch (error) {
    console.error('[subscription-payment] reconciliation failed:', error)
    return Response.json({ error: 'We could not re-check this subscription payment yet.' }, { status: 500 })
  }
}
