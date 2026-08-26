import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { and, eq, gte, isNull, lt, or } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db/client'
import { consultationPaymentIntents, consultationPromotionRedemptions, consultationSlots } from '@/lib/db/schema'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { buildFlutterwavePaymentMethod, createFlutterwaveCharge, flutterwaveConfigurationMessage, flutterwaveErrorMessage, getFlutterwaveAuthorizationType, getFlutterwaveConfig, normalizeUgandaPhone } from '@/lib/flutterwave-config'
import { settleConsultationPayment } from '@/lib/consultation-payments'
import {
  calculatePromotionDiscount,
  getConsultationPricing,
  getEligibleConsultationPromotion,
  normalizePromotionCode,
  pricingSummaryForPromotion,
  type ConsultationPriceSummary,
} from '@/lib/consultation-commerce'

const VALID_MODES = new Set(['virtual', 'in_person', 'showroom'])

type BookingBody = {
  slotId?: unknown
  title?: unknown
  description?: unknown
  serviceType?: unknown
  budget?: unknown
  mode?: unknown
  promoCode?: unknown
  idempotencyKey?: unknown
  paymentMethod?: unknown
  phoneNumber?: unknown
  mobileMoneyNetwork?: unknown
  cardNumber?: unknown
  cardExpiryMonth?: unknown
  cardExpiryYear?: unknown
  cardCvv?: unknown
}

type PaymentIntentResponse = {
  status?: 'pending' | 'paid' | 'paid_review'
  consultationId?: string
  paymentIntentId: string
  paymentUrl?: string
  paymentInstruction?: string
  chargeId?: string
  authorizationType?: string
  txRef: string
  expiresAt: string
  pricing: ConsultationPriceSummary
}

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function normalizeBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin
  return configured.replace(/\/$/, '')
}

function responseForIntent(intent: typeof consultationPaymentIntents.$inferSelect, pricing: ConsultationPriceSummary): PaymentIntentResponse | null {
  const metadata = (intent.metadata || {}) as Record<string, unknown>
  const paymentInstruction = typeof metadata.paymentInstruction === 'string' ? metadata.paymentInstruction : undefined
  const chargeId = typeof metadata.flutterwaveChargeId === 'string' ? metadata.flutterwaveChargeId : undefined
  const authorizationType = typeof metadata.authorizationType === 'string' ? metadata.authorizationType : undefined
  if (!intent.paymentUrl && !paymentInstruction && !authorizationType && !chargeId) return null
  return {
    status: 'pending',
    paymentIntentId: intent.id,
    paymentUrl: intent.paymentUrl || undefined,
    paymentInstruction,
    chargeId,
    authorizationType,
    txRef: intent.txRef,
    expiresAt: intent.expiresAt.toISOString(),
    pricing,
  }
}

async function releaseFailedIntent(intentId: string, userId: string) {
  await db.transaction(async (transaction) => {
    await transaction.update(consultationPaymentIntents).set({ status: 'failed', failedAt: new Date(), updatedAt: new Date() }).where(and(eq(consultationPaymentIntents.id, intentId), eq(consultationPaymentIntents.userId, userId), eq(consultationPaymentIntents.status, 'pending')))
    const intent = (await transaction.select({ expiresAt: consultationPaymentIntents.expiresAt }).from(consultationPaymentIntents).where(eq(consultationPaymentIntents.id, intentId)).limit(1))[0]
    await transaction.update(consultationSlots).set({ holdUntil: null, holdUserId: null }).where(and(eq(consultationSlots.holdUserId, userId), eq(consultationSlots.holdUntil, intent?.expiresAt ?? new Date(0))))
    await transaction.update(consultationPromotionRedemptions).set({ status: 'released', releasedAt: new Date(), updatedAt: new Date() }).where(and(eq(consultationPromotionRedemptions.paymentIntentId, intentId), eq(consultationPromotionRedemptions.status, 'reserved')))
  })
}

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Please sign in before paying for a consultation.' }, { status: 401 })
    const user = await getOrCreateCurrentUser(clerkId)
    if (!user) return NextResponse.json({ error: 'Your account is not ready yet. Please try again.' }, { status: 503 })

    const body = await request.json() as BookingBody
    const slotId = text(body.slotId, 80)
    const title = text(body.title, 255)
    const description = text(body.description, 5000)
    const serviceType = text(body.serviceType, 100)
    const budget = text(body.budget, 100)
    const mode = text(body.mode, 20)
    const promoCode = normalizePromotionCode(body.promoCode)
    const idempotencyKey = text(body.idempotencyKey, 120) || randomUUID()
    if (!slotId || !title) return NextResponse.json({ error: 'Choose a time and tell us what you would like to discuss.' }, { status: 400 })
    if (!/^[0-9a-f-]{36}$/i.test(slotId)) return NextResponse.json({ error: 'The selected time is invalid.' }, { status: 400 })
    if (!VALID_MODES.has(mode)) return NextResponse.json({ error: 'Choose a valid consultation format.' }, { status: 400 })
    if (!/^[0-9a-f-]{36}$/i.test(idempotencyKey)) return NextResponse.json({ error: 'The payment request could not be identified. Please try again.' }, { status: 400 })

    const pricing = await getConsultationPricing()
    const eligible = await getEligibleConsultationPromotion({ code: promoCode, userId: user.id, serviceType: serviceType || null })
    if (eligible.error) return NextResponse.json({ error: eligible.error }, { status: 400 })
    const promotion = eligible.promotion
    const summary = pricingSummaryForPromotion(pricing, promotion)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + pricing.holdMinutes * 60 * 1000)

    const existing = await db.query.consultationPaymentIntents.findFirst({ where: eq(consultationPaymentIntents.idempotencyKey, idempotencyKey) })
    if (existing && existing.userId !== user.id) return NextResponse.json({ error: 'This payment request cannot be reused. Please refresh and try again.' }, { status: 409 })
    if (existing && existing.userId === user.id && existing.status === 'pending' && existing.expiresAt > now) {
      const existingSummary = { baseAmount: Number(existing.baseAmount), discountAmount: Number(existing.discountAmount), taxAmount: Number(existing.taxAmount), amount: Number(existing.amount), currency: existing.currency, taxRate: Number(existing.taxRate), taxInclusive: pricing.taxInclusive, promotionCode: existing.promotionCode, promotionName: promotion?.name || null } satisfies ConsultationPriceSummary
      const response = responseForIntent(existing, existingSummary)
      if (response) return NextResponse.json(response)
    }
    if (existing && existing.userId === user.id && ['paid', 'paid_review'].includes(existing.status)) return NextResponse.json({ error: 'This payment request has already been processed. Please check your consultation history.' }, { status: 409 })

    const paymentIdempotencyKey = existing ? randomUUID() : idempotencyKey
    const flutterwaveConfig = getFlutterwaveConfig()
    if (!flutterwaveConfig.ok) {
      console.error('[consultation-payment] Flutterwave v4 configuration rejected', { mode: flutterwaveConfig.mode, reason: flutterwaveConfig.reason })
      return NextResponse.json({ error: flutterwaveConfigurationMessage(flutterwaveConfig) }, { status: 503 })
    }

    const customerPhone = normalizeUgandaPhone(text(body.phoneNumber, 30))
    if (!customerPhone) return NextResponse.json({ error: 'Enter a valid Ugandan phone number for payment authorization.' }, { status: 400 })

    let paymentMethod: Awaited<ReturnType<typeof buildFlutterwavePaymentMethod>>
    try {
      paymentMethod = await buildFlutterwavePaymentMethod({ method: body.paymentMethod, phoneNumber: body.phoneNumber, mobileMoneyNetwork: body.mobileMoneyNetwork, cardNumber: body.cardNumber, cardExpiryMonth: body.cardExpiryMonth, cardExpiryYear: body.cardExpiryYear, cardCvv: body.cardCvv })
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Choose a valid payment method.' }, { status: 400 })
    }

    const txRef = `REV-CONS-${Date.now()}-${randomUUID().slice(0, 8)}`
    const created = await db.transaction(async (transaction) => {
      const [slot] = await transaction.update(consultationSlots).set({ holdUntil: expiresAt, holdUserId: user.id }).where(and(eq(consultationSlots.id, slotId), eq(consultationSlots.isBooked, false), gte(consultationSlots.startTime, now), or(isNull(consultationSlots.holdUntil), lt(consultationSlots.holdUntil, now), eq(consultationSlots.holdUserId, user.id)), eq(consultationSlots.mode, mode))).returning({ id: consultationSlots.id, startTime: consultationSlots.startTime, durationMinutes: consultationSlots.durationMinutes, mode: consultationSlots.mode })
      if (!slot) return null
      const [intent] = await transaction.insert(consultationPaymentIntents).values({
        slotId: slot.id,
        userId: user.id,
        txRef,
        idempotencyKey: paymentIdempotencyKey,
        baseAmount: summary.baseAmount.toFixed(2),
        discountAmount: summary.discountAmount.toFixed(2),
        taxAmount: summary.taxAmount.toFixed(2),
        amount: summary.amount.toFixed(2),
        taxRate: summary.taxRate.toFixed(3),
        currency: summary.currency,
        promotionId: promotion?.id || null,
        promotionCode: promotion?.code || null,
        expiresAt,
        metadata: { title, description, serviceType, budget, mode, slotStartTime: slot.startTime.toISOString(), durationMinutes: slot.durationMinutes, taxInclusive: summary.taxInclusive, paymentMethod: paymentMethod.type },
      }).returning()
      if (!intent) return null
      if (promotion) await transaction.insert(consultationPromotionRedemptions).values({ promotionId: promotion.id, paymentIntentId: intent.id, userId: user.id, code: promotion.code, discountAmount: calculatePromotionDiscount(promotion, summary.baseAmount).toFixed(2), status: 'reserved' })
      return intent
    })

    if (!created) return NextResponse.json({ error: 'That time has just been reserved by another client. Please choose another slot.' }, { status: 409 })
    let baseUrl = normalizeBaseUrl(request)
    if (!/^https?:\/\//i.test(baseUrl)) baseUrl = `https://${baseUrl}`

    const flwResponse = await createFlutterwaveCharge({
      reference: created.txRef,
      amount: Number(created.amount),
      currency: created.currency,
      redirectUrl: `${baseUrl}/api/consultations/payment-callback?reference=${encodeURIComponent(created.txRef)}&tx_ref=${encodeURIComponent(created.txRef)}`,
      customer: { email: user.email, name: { first: text(user.firstName, 50) || 'Client', last: text(user.lastName, 50) || 'Client' }, phone: { country_code: customerPhone.countryCode, number: customerPhone.number }, address: { line1: 'Consultation booking', city: 'Kampala', state: 'Central', country: 'UG', postal_code: '00000' } },
      paymentMethod,
      idempotencyKey: paymentIdempotencyKey,
      meta: { paymentIntentId: created.id, slotId: created.slotId, promotionCode: created.promotionCode || '' },
    })
    const flwPayload = flwResponse.payload || {}
    const charge = flwPayload.data
    if (!flwResponse.response?.ok || !['success', 'pending'].includes(String(flwPayload.status || '').toLowerCase()) || !charge?.id) {
      await releaseFailedIntent(created.id, user.id)
      return NextResponse.json({ error: flutterwaveErrorMessage(flwPayload, flwResponse.response?.status || 502) }, { status: flwResponse.response?.status === 401 ? 503 : 502 })
    }

    const paymentUrl = charge.next_action?.redirect_url?.url || null
    const paymentInstruction = charge.next_action?.payment_instruction?.note || null
    const authorizationType = getFlutterwaveAuthorizationType(charge)
    const metadata = { ...((created.metadata || {}) as Record<string, unknown>), flutterwaveChargeId: String(charge.id), paymentInstruction: paymentInstruction || undefined, authorizationType: authorizationType || undefined }
    const [updated] = await db.update(consultationPaymentIntents).set({ paymentUrl, metadata, updatedAt: new Date() }).where(and(eq(consultationPaymentIntents.id, created.id), eq(consultationPaymentIntents.status, 'pending'))).returning()
    if (!updated) return NextResponse.json({ error: 'Payment could not be prepared. Please try again.' }, { status: 500 })
    if (String(charge.status || '').toLowerCase() === 'succeeded') {
      const settled = await settleConsultationPayment({ txRef: updated.txRef, transactionId: String(charge.id) })
      if (settled.success) return NextResponse.json({ status: settled.status, consultationId: settled.consultationId, paymentIntentId: updated.id, txRef: updated.txRef, pricing: summary })
      if (settled.status === 'paid_review') return NextResponse.json({ status: 'paid_review', paymentIntentId: updated.id, txRef: updated.txRef, pricing: summary, message: settled.error })
      return NextResponse.json({ status: 'pending', paymentIntentId: updated.id, txRef: updated.txRef, pricing: summary, message: settled.error || 'Payment was received and is being finalized.' })
    }

    const response = responseForIntent(updated, summary)
    if (!response) return NextResponse.json({ error: 'Flutterwave did not return a usable payment state. Please try again.' }, { status: 502 })
    return NextResponse.json(response)
  } catch (error) {
    console.error('[consultation-payment] failed to initialize v4 payment:', error)
    return NextResponse.json({ error: 'We could not prepare consultation payment. Please try again.' }, { status: 500 })
  }
}
