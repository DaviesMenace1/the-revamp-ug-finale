import { auth } from '@clerk/nextjs/server'
import { and, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db/client'
import { programSubscriptions } from '@/lib/db/schema'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { encryptFlutterwavePin, getFlutterwaveAuthorizationType, updateFlutterwaveCharge } from '@/lib/flutterwave-config'
import { settleSubscriptionPayment } from '@/lib/subscription-payments'

type AuthorizationBody = { txRef?: unknown; subscriptionId?: unknown; chargeId?: unknown; authorizationType?: unknown; code?: unknown }

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return Response.json({ error: 'Please sign in before authorizing this subscription payment.' }, { status: 401 })
    const user = await getOrCreateCurrentUser(clerkId)
    if (!user) return Response.json({ error: 'Your account is not ready yet. Please try again.' }, { status: 503 })
    const body = await request.json() as AuthorizationBody
    const txRef = text(body.txRef, 120)
    const subscriptionId = text(body.subscriptionId, 80)
    const chargeId = text(body.chargeId, 120)
    const authorizationType = text(body.authorizationType, 10).toLowerCase()
    const code = text(body.code, 20)
    if (!txRef || !chargeId || !/^[0-9a-f-]{36}$/i.test(subscriptionId) || !['pin', 'otp'].includes(authorizationType) || !/^\d{4,8}$/.test(code)) return Response.json({ error: 'The authorization details are incomplete.' }, { status: 400 })

    const subscription = await db.query.programSubscriptions.findFirst({ where: and(eq(programSubscriptions.id, subscriptionId), eq(programSubscriptions.transactionReference, txRef), eq(programSubscriptions.userId, user.id)) })
    if (!subscription) return Response.json({ error: 'Subscription payment was not found.' }, { status: 404 })
    if (subscription.status === 'active') return Response.json({ status: 'paid', subscriptionId: subscription.id })

    const authorization = authorizationType === 'pin' ? { type: 'pin', pin: await encryptFlutterwavePin(code) } : { type: 'otp', otp: { code } }
    const update = await updateFlutterwaveCharge(chargeId, authorization, randomUUID())
    const charge = update.payload?.data
    if (!update.response?.ok || !charge) return Response.json({ error: update.payload?.error?.message || update.payload?.message || 'The payment authorization was not accepted.' }, { status: update.response?.status || 502 })

    const result = await settleSubscriptionPayment({ transactionReference: txRef, chargeId })
    if (result.success) return Response.json({ status: 'paid', subscriptionId: result.subscriptionId })
    const nextAuthorization = getFlutterwaveAuthorizationType(charge)
    if (nextAuthorization === 'pin' || nextAuthorization === 'otp') return Response.json({ status: 'pending', authorizationType: nextAuthorization, chargeId, paymentInstruction: nextAuthorization === 'pin' ? 'Enter the Sandbox card PIN to continue.' : 'Enter the Sandbox OTP to complete the subscription payment.' })
    const paymentInstruction = charge.next_action?.payment_instruction?.note
    if (typeof paymentInstruction === 'string' && paymentInstruction) return Response.json({ status: 'pending', paymentInstruction })
    return Response.json({ status: 'pending', message: result.error || 'The subscription payment is still being authorized.' })
  } catch (error) {
    console.error('[subscription-payment] authorization failed:', error)
    return Response.json({ error: 'We could not complete payment authorization. Please try again.' }, { status: 500 })
  }
}
