import { auth } from '@clerk/nextjs/server'
import { and, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db/client'
import { paymentRecords, programSubscriptions } from '@/lib/db/schema'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { buildFlutterwavePaymentMethod, createFlutterwaveCharge, flutterwaveConfigurationMessage, flutterwaveErrorMessage, getFlutterwaveAuthorizationType, getFlutterwaveConfig, normalizeUgandaPhone } from '@/lib/flutterwave-config'
import { getSubscriptionPlan, getSubscriptionPricing, subscriptionAmount, type SubscriptionBillingPeriod, type SubscriptionProgram } from '@/lib/subscriptions'
import { failSubscriptionPayment, settleSubscriptionPayment } from '@/lib/subscription-payments'

type SubscriptionBody = {
  program?: unknown
  planKey?: unknown
  billingPeriod?: unknown
  idempotencyKey?: unknown
  phoneNumber?: unknown
  mobileMoneyNetwork?: unknown
  paymentMethod?: unknown
  cardNumber?: unknown
  cardExpiryMonth?: unknown
  cardExpiryYear?: unknown
  cardCvv?: unknown
}

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function normalizeBaseUrl(request: Request) {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin).replace(/\/$/, '')
}

function responseForSubscription(subscription: typeof programSubscriptions.$inferSelect) {
  const metadata = subscription.metadata && typeof subscription.metadata === 'object' ? subscription.metadata as Record<string, unknown> : {}
  const paymentUrl = typeof metadata.paymentUrl === 'string' ? metadata.paymentUrl : undefined
  const paymentInstruction = typeof metadata.paymentInstruction === 'string' ? metadata.paymentInstruction : undefined
  const authorizationType = typeof metadata.authorizationType === 'string' ? metadata.authorizationType : undefined
  const chargeId = subscription.providerChargeId || (typeof metadata.flutterwaveChargeId === 'string' ? metadata.flutterwaveChargeId : undefined)
  if (!paymentUrl && !paymentInstruction && !authorizationType && !chargeId) return null
  return {
    status: 'pending' as const,
    subscriptionId: subscription.id,
    txRef: subscription.transactionReference,
    chargeId,
    paymentUrl,
    paymentInstruction,
    authorizationType,
    program: subscription.program,
    planKey: subscription.planKey,
    billingPeriod: subscription.billingPeriod,
    amount: Number(subscription.amount),
    currency: subscription.currency,
  }
}

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return Response.json({ error: 'Please sign in before purchasing a subscription.' }, { status: 401 })
    const user = await getOrCreateCurrentUser(clerkId)
    if (!user) return Response.json({ error: 'Your account is not ready yet. Please try again.' }, { status: 503 })

    const body = await request.json() as SubscriptionBody
    const program = text(body.program, 20) as SubscriptionProgram
    const planKey = text(body.planKey, 50)
    const billingPeriod = text(body.billingPeriod, 20) as SubscriptionBillingPeriod
    const idempotencyKey = text(body.idempotencyKey, 120) || randomUUID()
    if (!['membership', 'trade'].includes(program)) return Response.json({ error: 'Choose a valid subscription program.' }, { status: 400 })
    if (!['monthly', 'annual'].includes(billingPeriod)) return Response.json({ error: 'Choose a monthly or annual billing period.' }, { status: 400 })
    if (!/^[0-9a-f-]{36}$/i.test(idempotencyKey)) return Response.json({ error: 'The subscription payment request could not be identified. Please try again.' }, { status: 400 })

    const pricing = await getSubscriptionPricing()
    const plan = getSubscriptionPlan(pricing, program, planKey)
    if (!plan) return Response.json({ error: 'That subscription plan is not currently available.' }, { status: 400 })
    const amount = Number(subscriptionAmount(plan, billingPeriod))
    if (!Number.isSafeInteger(amount) || amount <= 0) return Response.json({ error: 'This subscription plan has not been configured with a valid price yet.' }, { status: 503 })
    const phone = normalizeUgandaPhone(text(body.phoneNumber, 30))
    if (!phone) return Response.json({ error: 'Enter a valid Ugandan phone number for payment authorization.' }, { status: 400 })

    const existing = await db.query.programSubscriptions.findFirst({ where: eq(programSubscriptions.idempotencyKey, idempotencyKey) })
    if (existing && existing.userId !== user.id) return Response.json({ error: 'This subscription payment request cannot be reused.' }, { status: 409 })
    if (existing && existing.userId === user.id && existing.status === 'active') return Response.json({ error: 'This subscription payment has already been completed.' }, { status: 409 })
    if (existing && existing.userId === user.id && existing.status === 'pending') {
      const existingResponse = responseForSubscription(existing)
      if (existingResponse) return Response.json(existingResponse)
    }

    let paymentMethod: Awaited<ReturnType<typeof buildFlutterwavePaymentMethod>>
    try {
      paymentMethod = await buildFlutterwavePaymentMethod({ method: body.paymentMethod, phoneNumber: body.phoneNumber, mobileMoneyNetwork: body.mobileMoneyNetwork, cardNumber: body.cardNumber, cardExpiryMonth: body.cardExpiryMonth, cardExpiryYear: body.cardExpiryYear, cardCvv: body.cardCvv })
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : 'Choose a valid payment method.' }, { status: 400 })
    }

    const config = getFlutterwaveConfig()
    if (!config.ok) return Response.json({ error: flutterwaveConfigurationMessage(config) }, { status: 503 })

    const transactionReference = `REV-SUB-${program.toUpperCase()}-${Date.now()}-${randomUUID().slice(0, 8)}`
    const subscription = await db.transaction(async (transaction) => {
      const [created] = await transaction.insert(programSubscriptions).values({
        userId: user.id,
        program,
        planKey: plan.key,
        billingPeriod,
        status: 'pending',
        amount: amount.toFixed(2),
        currency: 'UGX',
        transactionReference,
        idempotencyKey,
        metadata: { planName: plan.name, planDescription: plan.description, benefits: plan.benefits, discountRate: plan.discountRate ?? null, paymentMethod: paymentMethod.type },
      }).returning()
      if (created) await transaction.insert(paymentRecords).values({ userId: user.id, subscriptionId: created.id, provider: 'flutterwave', transactionReference, amount: amount.toFixed(2), currency: 'UGX', status: 'pending', metadata: { txRef: transactionReference, subscriptionId: created.id, program, planKey, billingPeriod } })
      return created
    })
    if (!subscription) return Response.json({ error: 'The subscription payment could not be started. Please try again.' }, { status: 500 })

    const baseUrl = normalizeBaseUrl(request)
    const flwResponse = await createFlutterwaveCharge({
      reference: transactionReference,
      amount,
      currency: 'UGX',
      redirectUrl: `${baseUrl}/api/subscriptions/payment-callback?program=${encodeURIComponent(program)}&reference=${encodeURIComponent(transactionReference)}&tx_ref=${encodeURIComponent(transactionReference)}`,
      customer: { email: user.email, name: { first: text(user.firstName, 50) || 'Client', last: text(user.lastName, 50) || 'Client' }, phone: { country_code: phone.countryCode, number: phone.number }, address: { line1: 'Subscription payment', city: 'Kampala', state: 'Central', country: 'UG', postal_code: '00000' } },
      paymentMethod,
      idempotencyKey,
      meta: { subscriptionId: subscription.id, program, planKey, billingPeriod },
    })
    const payload = flwResponse.payload || {}
    const charge = payload.data
    if (!flwResponse.response?.ok || !['success', 'pending'].includes(String(payload.status || '').toLowerCase()) || !charge?.id) {
      await failSubscriptionPayment(transactionReference)
      return Response.json({ error: flutterwaveErrorMessage(payload, flwResponse.response?.status || 502) }, { status: flwResponse.response?.status === 401 ? 503 : 502 })
    }

    const metadata = { ...((subscription.metadata || {}) as Record<string, unknown>), flutterwaveChargeId: String(charge.id), paymentUrl: charge.next_action?.redirect_url?.url || undefined, paymentInstruction: charge.next_action?.payment_instruction?.note || undefined, authorizationType: getFlutterwaveAuthorizationType(charge) || undefined }
    const [updated] = await db.update(programSubscriptions).set({ providerChargeId: String(charge.id), metadata, updatedAt: new Date() }).where(and(eq(programSubscriptions.id, subscription.id), eq(programSubscriptions.status, 'pending'))).returning()
    if (!updated) return Response.json({ error: 'Flutterwave did not return a usable subscription payment state. Please try again.' }, { status: 502 })
    if (String(charge.status || '').toLowerCase() === 'succeeded') {
      const settled = await settleSubscriptionPayment({ transactionReference: updated.transactionReference, chargeId: String(charge.id) })
      if (settled.success) return Response.json({ status: settled.status, subscriptionId: settled.subscriptionId, txRef: updated.transactionReference, program: updated.program, planKey: updated.planKey, billingPeriod: updated.billingPeriod, amount: Number(updated.amount), currency: updated.currency })
      return Response.json({ status: 'pending', subscriptionId: updated.id, txRef: updated.transactionReference, program: updated.program, planKey: updated.planKey, billingPeriod: updated.billingPeriod, amount: Number(updated.amount), currency: updated.currency, message: settled.error || 'Payment was received and is being finalized.' })
    }
    const response = responseForSubscription(updated)
    if (!response) return Response.json({ error: 'Flutterwave did not return a usable subscription payment state. Please try again.' }, { status: 502 })
    return Response.json(response)
  } catch (error) {
    console.error('[subscription-payment] failed to initialize payment:', error)
    return Response.json({ error: 'We could not prepare subscription payment. Please try again.' }, { status: 500 })
  }
}
