import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { and, eq, gte, isNull, lt, or } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db/client'
import { consultationPaymentIntents, consultationPromotionRedemptions, consultationSlots } from '@/lib/db/schema'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { getPesapalConfig, submitPesapalOrder } from '@/lib/pesapal/client'
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
  pesapalOrderTrackingId?: string
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
  const trackingId = typeof metadata.pesapalOrderTrackingId === 'string' ? metadata.pesapalOrderTrackingId : undefined
  if (!intent.paymentUrl && !paymentInstruction && !trackingId) return null
  return {
    status: 'pending',
    paymentIntentId: intent.id,
    paymentUrl: intent.paymentUrl || undefined,
    paymentInstruction,
    pesapalOrderTrackingId: trackingId,
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
    const chargedSummary = summary
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
    const pesapalConfig = getPesapalConfig()
    if (!pesapalConfig.ok) return NextResponse.json({ error: pesapalConfig.error }, { status: 503 })

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
        discountAmount: chargedSummary.discountAmount.toFixed(2),
        taxAmount: chargedSummary.taxAmount.toFixed(2),
        amount: chargedSummary.amount.toFixed(2),
        taxRate: summary.taxRate.toFixed(3),
        currency: summary.currency,
        promotionId: promotion?.id || null,
        promotionCode: promotion?.code || null,
        expiresAt,
        metadata: { title, description, serviceType, budget, mode, slotStartTime: slot.startTime.toISOString(), durationMinutes: slot.durationMinutes, taxInclusive: summary.taxInclusive, paymentMethod: 'pesapal_hosted' },
      }).returning()
      if (!intent) return null
      if (promotion) await transaction.insert(consultationPromotionRedemptions).values({ promotionId: promotion.id, paymentIntentId: intent.id, userId: user.id, code: promotion.code, discountAmount: calculatePromotionDiscount(promotion, summary.baseAmount).toFixed(2), status: 'reserved' })
      return intent
    })

    if (!created) return NextResponse.json({ error: 'That time has just been reserved by another client. Please choose another slot.' }, { status: 409 })
    let baseUrl = normalizeBaseUrl(request)
    if (!/^https?:\/\//i.test(baseUrl)) baseUrl = `https://${baseUrl}`

    let pesapalResponse: Awaited<ReturnType<typeof submitPesapalOrder>>
    try {
      pesapalResponse = await submitPesapalOrder({
        id: created.txRef,
        amount: Number(created.amount),
        currency: created.currency,
        description: `The Revamp UG consultation ${created.txRef}`,
        callbackUrl: `${baseUrl}/api/consultations/pesapal-callback`,
        cancellationUrl: `${baseUrl}/book-consultation?payment=failed&tx_ref=${encodeURIComponent(created.txRef)}`,
        billingAddress: {
          emailAddress: user.email,
          phoneNumber: text(body.phoneNumber, 30),
          countryCode: 'UG',
          firstName: text(user.firstName, 50) || 'Client',
          lastName: text(user.lastName, 50) || 'Client',
          line1: 'Consultation booking',
          city: 'Kampala',
          state: 'UG',
        },
      })
    } catch (error) {
      await releaseFailedIntent(created.id, user.id)
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Pesapal could not initialize this payment.' }, { status: 502 })
    }

    const trackingId = String(pesapalResponse.order_tracking_id || '').trim()
    const paymentUrl = String(pesapalResponse.redirect_url || '').trim()
    if (!trackingId || !paymentUrl) {
      await releaseFailedIntent(created.id, user.id)
      return NextResponse.json({ error: 'Pesapal did not return a usable payment page.' }, { status: 502 })
    }
    const paymentInstruction = 'You will choose card or mobile money securely on Pesapal.'
    const metadata = { ...((created.metadata || {}) as Record<string, unknown>), pesapalOrderTrackingId: trackingId, paymentInstruction }
    const [updated] = await db.update(consultationPaymentIntents).set({ paymentUrl, metadata, updatedAt: new Date() }).where(and(eq(consultationPaymentIntents.id, created.id), eq(consultationPaymentIntents.status, 'pending'))).returning()
    if (!updated) return NextResponse.json({ error: 'Payment could not be prepared. Please try again.' }, { status: 500 })
    return NextResponse.json({ status: 'pending', paymentIntentId: updated.id, txRef: updated.txRef, expiresAt: updated.expiresAt.toISOString(), pricing: chargedSummary, paymentUrl, paymentInstruction, pesapalOrderTrackingId: trackingId })
  } catch (error) {
    const traceId = randomUUID()
    console.error('[consultation-payment] failed to initialize payment', { traceId, error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error })
    return NextResponse.json({ error: `We could not prepare consultation payment. Please try again. Reference: ${traceId.slice(0, 8)}` }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
