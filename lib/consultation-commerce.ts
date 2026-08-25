import 'server-only'

import { and, count, eq, inArray, or } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { consultationPaymentIntents, consultationPromotionRedemptions, consultationPromotions } from '@/lib/db/schema'
import { getSetting } from '@/lib/actions/settings'

export type ConsultationPricingSettings = {
  baseFee: string
  currency: string
  taxRate: string
  taxInclusive: boolean
  holdMinutes: number
  terms: string
}

export type ConsultationPriceSummary = {
  baseAmount: number
  discountAmount: number
  taxAmount: number
  amount: number
  currency: string
  taxRate: number
  taxInclusive: boolean
  promotionCode: string | null
  promotionName: string | null
}

export const DEFAULT_CONSULTATION_PRICING: ConsultationPricingSettings = {
  baseFee: '200000',
  currency: 'UGX',
  taxRate: '18',
  taxInclusive: true,
  holdMinutes: 15,
  terms: 'Consultation bookings are confirmed after successful payment. Please contact the studio if you need to change your appointment.',
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function safeAmount(value: unknown, fallback = 0) {
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? roundMoney(amount) : fallback
}

export async function getConsultationPricing(): Promise<ConsultationPricingSettings> {
  const configured = await getSetting('consultation_pricing', DEFAULT_CONSULTATION_PRICING)
  const currency = typeof configured.currency === 'string' && /^[A-Z]{3}$/.test(configured.currency.toUpperCase())
    ? configured.currency.toUpperCase()
    : DEFAULT_CONSULTATION_PRICING.currency
  const holdMinutes = Math.min(30, Math.max(5, Math.floor(Number(configured.holdMinutes) || DEFAULT_CONSULTATION_PRICING.holdMinutes)))
  return {
    baseFee: safeAmount(configured.baseFee, Number(DEFAULT_CONSULTATION_PRICING.baseFee)).toFixed(2),
    currency,
    taxRate: Math.min(100, safeAmount(configured.taxRate, Number(DEFAULT_CONSULTATION_PRICING.taxRate))).toFixed(3),
    taxInclusive: configured.taxInclusive !== false,
    holdMinutes,
    terms: typeof configured.terms === 'string' && configured.terms.trim()
      ? configured.terms.trim().slice(0, 1000)
      : DEFAULT_CONSULTATION_PRICING.terms,
  }
}

function includedTaxAmount(grossAmount: number, taxRate: number, taxInclusive: boolean) {
  if (taxRate <= 0) return 0
  return taxInclusive
    ? roundMoney(grossAmount * taxRate / (100 + taxRate))
    : roundMoney(grossAmount * taxRate / 100)
}

export function calculateConsultationPrice(
  pricing: ConsultationPricingSettings,
  discountAmount = 0,
  promotionCode: string | null = null,
  promotionName: string | null = null,
): ConsultationPriceSummary {
  const baseAmount = safeAmount(pricing.baseFee)
  const discount = Math.min(baseAmount, safeAmount(discountAmount))
  const amount = roundMoney(Math.max(0, baseAmount - discount))
  const taxRate = Math.min(100, safeAmount(pricing.taxRate))
  const taxAmount = includedTaxAmount(amount, taxRate, pricing.taxInclusive)
  return {
    baseAmount,
    discountAmount: discount,
    taxAmount,
    amount,
    currency: pricing.currency,
    taxRate,
    taxInclusive: pricing.taxInclusive,
    promotionCode,
    promotionName,
  }
}

export function normalizePromotionCode(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 40)
}

function promotionServiceTypes(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
}

export async function getEligibleConsultationPromotion(input: {
  code: string
  userId: string
  serviceType?: string | null
  now?: Date
}) {
  const code = normalizePromotionCode(input.code)
  if (!code) return { promotion: null, discountAmount: 0, error: null }
  const now = input.now || new Date()
  const [promotion] = await db
    .select()
    .from(consultationPromotions)
    .where(and(eq(consultationPromotions.code, code), eq(consultationPromotions.status, 'active')))
    .limit(1)
  if (!promotion) return { promotion: null, discountAmount: 0, error: 'That promotion code is not available.' }
  if ((promotion.startsAt && promotion.startsAt > now) || (promotion.endsAt && promotion.endsAt < now)) {
    return { promotion: null, discountAmount: 0, error: 'That promotion is outside its valid dates.' }
  }

  const eligibleServices = promotionServiceTypes(promotion.serviceTypes)
  if (eligibleServices.length > 0 && (!input.serviceType || !eligibleServices.includes(input.serviceType))) {
    return { promotion: null, discountAmount: 0, error: 'That promotion does not apply to the selected consultation service.' }
  }

  if (promotion.audience === 'new_customer') {
    const [{ value: paidCount }] = await db
      .select({ value: count() })
      .from(consultationPaymentIntents)
      .where(and(eq(consultationPaymentIntents.userId, input.userId), eq(consultationPaymentIntents.status, 'paid')))
    if (Number(paidCount) > 0) return { promotion: null, discountAmount: 0, error: 'That promotion is for new clients only.' }
  }
  if (promotion.audience === 'returning_customer') {
    const [{ value: paidCount }] = await db
      .select({ value: count() })
      .from(consultationPaymentIntents)
      .where(and(eq(consultationPaymentIntents.userId, input.userId), eq(consultationPaymentIntents.status, 'paid')))
    if (Number(paidCount) === 0) return { promotion: null, discountAmount: 0, error: 'That promotion is for returning clients only.' }
  }

  const activeRedemptionStatuses = inArray(consultationPromotionRedemptions.status, ['reserved', 'applied'])
  if (promotion.totalUsageLimit !== null) {
    const [{ value: totalUsed }] = await db
      .select({ value: count() })
      .from(consultationPromotionRedemptions)
      .where(and(eq(consultationPromotionRedemptions.promotionId, promotion.id), activeRedemptionStatuses))
    if (Number(totalUsed) >= promotion.totalUsageLimit) return { promotion: null, discountAmount: 0, error: 'That promotion has reached its usage limit.' }
  }
  if (promotion.perCustomerLimit > 0) {
    const [{ value: customerUsed }] = await db
      .select({ value: count() })
      .from(consultationPromotionRedemptions)
      .where(and(eq(consultationPromotionRedemptions.promotionId, promotion.id), eq(consultationPromotionRedemptions.userId, input.userId), activeRedemptionStatuses))
    if (Number(customerUsed) >= promotion.perCustomerLimit) return { promotion: null, discountAmount: 0, error: 'You have already used this promotion.' }
  }

  return { promotion, discountAmount: 0, error: null }
}

export function calculatePromotionDiscount(promotion: typeof consultationPromotions.$inferSelect, baseAmount: number) {
  const gross = safeAmount(baseAmount)
  const value = safeAmount(promotion.discountValue)
  const rawDiscount = promotion.discountType === 'fixed'
    ? value
    : gross * Math.min(100, value) / 100
  const capped = promotion.maxDiscount === null ? rawDiscount : Math.min(rawDiscount, safeAmount(promotion.maxDiscount))
  return Math.min(gross, roundMoney(Math.max(0, capped)))
}

export function pricingSummaryForPromotion(
  pricing: ConsultationPricingSettings,
  promotion: typeof consultationPromotions.$inferSelect | null,
) {
  const discount = promotion ? calculatePromotionDiscount(promotion, safeAmount(pricing.baseFee)) : 0
  return calculateConsultationPrice(pricing, discount, promotion?.code || null, promotion?.name || null)
}

export function isPendingPaymentIntentActive(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() > now.getTime()
}

export function promotionUsageWhere(promotionId: string, userId?: string) {
  return userId
    ? and(eq(consultationPromotionRedemptions.promotionId, promotionId), eq(consultationPromotionRedemptions.userId, userId), or(eq(consultationPromotionRedemptions.status, 'reserved'), eq(consultationPromotionRedemptions.status, 'applied')))
    : and(eq(consultationPromotionRedemptions.promotionId, promotionId), or(eq(consultationPromotionRedemptions.status, 'reserved'), eq(consultationPromotionRedemptions.status, 'applied')))
}

export { roundMoney, safeAmount }
