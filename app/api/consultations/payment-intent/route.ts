import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { and, eq, gte, isNull, lt, or } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db/client'
import { consultationPaymentIntents, consultationPromotionRedemptions, consultationSlots } from '@/lib/db/schema'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
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
}

type PaymentIntentResponse = {
  paymentIntentId: string
  paymentUrl: string
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

function responseForIntent(intent: typeof consultationPaymentIntents.$inferSelect, pricing: ConsultationPriceSummary) {
  if (!intent.paymentUrl) return null
  return {
    paymentIntentId: intent.id,
    paymentUrl: intent.paymentUrl,
    txRef: intent.txRef,
    expiresAt: intent.expiresAt.toISOString(),
    pricing,
  } satisfies PaymentIntentResponse
}

async function releaseFailedIntent(intentId: string, userId: string) {
  await db.transaction(async (transaction) => {
    await transaction.update(consultationPaymentIntents).set({ status: 'failed', failedAt: new Date(), updatedAt: new Date() }).where(and(eq(consultationPaymentIntents.id, intentId), eq(consultationPaymentIntents.userId, userId), eq(consultationPaymentIntents.status, 'pending')))
    await transaction.update(consultationSlots).set({ holdUntil: null, holdUserId: null }).where(and(eq(consultationSlots.holdUserId, userId), eq(consultationSlots.holdUntil, (await transaction.select({ expiresAt: consultationPaymentIntents.expiresAt }).from(consultationPaymentIntents).where(eq(consultationPaymentIntents.id, intentId)).limit(1))[0]?.expiresAt ?? new Date(0))))
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
    if (existing && existing.userId === user.id && existing.status === 'pending' && existing.expiresAt > now) {
      const existingSummary = {
        baseAmount: Number(existing.baseAmount),
        discountAmount: Number(existing.discountAmount),
        taxAmount: Number(existing.taxAmount),
        amount: Number(existing.amount),
        currency: existing.currency,
        taxRate: Number(existing.taxRate),
        taxInclusive: pricing.taxInclusive,
        promotionCode: existing.promotionCode,
        promotionName: promotion?.name || null,
      } satisfies ConsultationPriceSummary
      const response = responseForIntent(existing, existingSummary)
      if (response) return NextResponse.json(response)
    }

    const flutterwaveSecret = process.env.FLUTTERWAVE_SECRET_KEY?.trim()
    if (!flutterwaveSecret) {
      const insecurePublicSecretConfigured = Boolean(process.env.NEXT_PUBLIC_FLUTTERWAVE_SECRET_KEY?.trim())
      console.error('[consultation-payment] FLUTTERWAVE_SECRET_KEY is not configured', { insecurePublicSecretConfigured })
      return NextResponse.json({ error: insecurePublicSecretConfigured ? 'Payment setup needs one correction: rename the Flutterwave secret variable to FLUTTERWAVE_SECRET_KEY, then redeploy.' : 'Consultation payment is not configured yet. Please contact the studio while payment setup is completed.' }, { status: 503 })
    }

    const txRef = `REV-CONS-${Date.now()}-${randomUUID().slice(0, 8)}`
    const created = await db.transaction(async (transaction) => {
      const [slot] = await transaction
        .update(consultationSlots)
        .set({ holdUntil: expiresAt, holdUserId: user.id })
        .where(and(
          eq(consultationSlots.id, slotId),
          eq(consultationSlots.isBooked, false),
          gte(consultationSlots.startTime, now),
          or(isNull(consultationSlots.holdUntil), lt(consultationSlots.holdUntil, now), eq(consultationSlots.holdUserId, user.id)),
          eq(consultationSlots.mode, mode),
        ))
        .returning({ id: consultationSlots.id, startTime: consultationSlots.startTime, durationMinutes: consultationSlots.durationMinutes, mode: consultationSlots.mode })
      if (!slot) return null

      const [intent] = await transaction.insert(consultationPaymentIntents).values({
        slotId: slot.id,
        userId: user.id,
        txRef,
        idempotencyKey,
        baseAmount: summary.baseAmount.toFixed(2),
        discountAmount: summary.discountAmount.toFixed(2),
        taxAmount: summary.taxAmount.toFixed(2),
        amount: summary.amount.toFixed(2),
        taxRate: summary.taxRate.toFixed(3),
        currency: summary.currency,
        promotionId: promotion?.id || null,
        promotionCode: promotion?.code || null,
        expiresAt,
        metadata: { title, description, serviceType, budget, mode, slotStartTime: slot.startTime.toISOString(), durationMinutes: slot.durationMinutes, taxInclusive: summary.taxInclusive },
      }).returning()
      if (!intent) return null

      if (promotion) {
        await transaction.insert(consultationPromotionRedemptions).values({
          promotionId: promotion.id,
          paymentIntentId: intent.id,
          userId: user.id,
          code: promotion.code,
          discountAmount: calculatePromotionDiscount(promotion, summary.baseAmount).toFixed(2),
          status: 'reserved',
        })
      }
      return intent
    })

    if (!created) return NextResponse.json({ error: 'That time has just been reserved by another client. Please choose another slot.' }, { status: 409 })

    let baseUrl = normalizeBaseUrl(request)
    if (!/^https?:\/\//i.test(baseUrl)) baseUrl = `https://${baseUrl}`
    const paymentOptions = 'card,mobilemoneyuganda,banktransfer'
    const flwResponse = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${flutterwaveSecret}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        tx_ref: created.txRef,
        amount: Number(created.amount),
        currency: created.currency,
        redirect_url: `${baseUrl}/api/consultations/payment-callback`,
        payment_options: paymentOptions,
        customer: {
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client',
        },
        customizations: {
          title: 'Consultation with The Revamp UG',
          description: `Consultation booking ${created.txRef}`,
        },
        meta: {
          paymentIntentId: created.id,
          slotId: created.slotId,
          promotionCode: created.promotionCode,
        },
        configurations: { session_duration: pricing.holdMinutes, max_retry_attempt: 3 },
      }),
      cache: 'no-store',
    })
    const flwPayload = await flwResponse.json().catch(() => ({})) as { status?: string; message?: string; data?: { link?: string } }
    if (!flwResponse.ok || flwPayload.status !== 'success' || !flwPayload.data?.link) {
      await releaseFailedIntent(created.id, user.id)
      return NextResponse.json({ error: flwPayload.message || 'Payment could not be initialized. Please try again.' }, { status: 502 })
    }

    const [updated] = await db.update(consultationPaymentIntents).set({ paymentUrl: flwPayload.data.link, updatedAt: new Date() }).where(and(eq(consultationPaymentIntents.id, created.id), eq(consultationPaymentIntents.status, 'pending'))).returning()
    if (!updated) return NextResponse.json({ error: 'Payment could not be prepared. Please try again.' }, { status: 500 })
    const response = responseForIntent(updated, summary)
    if (!response) return NextResponse.json({ error: 'Payment link was not created. Please try again.' }, { status: 500 })
    return NextResponse.json(response)
  } catch (error) {
    console.error('[consultation-payment] failed to initialize payment:', error)
    return NextResponse.json({ error: 'We could not prepare consultation payment. Please try again.' }, { status: 500 })
  }
}
