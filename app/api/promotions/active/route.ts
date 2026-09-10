import { and, count, eq, gt, gte, inArray, isNotNull, isNull, lte, or } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import {
  collectionPromotions,
  consultationPromotionRedemptions,
  consultationPromotions,
  orderPromotionRedemptions,
} from '@/lib/db/schema'

export const dynamic = 'force-dynamic'
export const revalidate = 60

function readableSlug(value: string) {
  return value.split('-').filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function scopeLabel(targetType: string | null, slugs: unknown) {
  const values = Array.isArray(slugs) ? slugs.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).map(readableSlug) : []
  if (targetType === 'all') return 'All published products'
  if (targetType === 'category') return values.length > 0 ? `Categories: ${values.slice(0, 3).join(', ')}` : 'Selected categories'
  if (targetType === 'subcategory') return values.length > 0 ? `Subcategories: ${values.slice(0, 3).join(', ')}` : 'Selected subcategories'
  if (targetType === 'product') return 'Selected products'
  return values.length > 0 ? `Collection: ${values.slice(0, 3).join(', ')}` : 'Selected collection'
}

export async function GET() {
  const now = new Date()
  try {
    const [collectionRows, consultationRows] = await Promise.all([
      db.select({
        id: collectionPromotions.id,
        name: collectionPromotions.name,
        code: collectionPromotions.code,
        discountType: collectionPromotions.discountType,
        discountValue: collectionPromotions.discountValue,
        maxDiscount: collectionPromotions.maxDiscount,
        totalUsageLimit: collectionPromotions.totalUsageLimit,
        audience: collectionPromotions.audience,
        startsAt: collectionPromotions.startsAt,
        endsAt: collectionPromotions.endsAt,
        targetType: collectionPromotions.targetType,
        collectionSlugs: collectionPromotions.collectionSlugs,
      }).from(collectionPromotions).where(and(
        eq(collectionPromotions.status, 'active'),
        lte(collectionPromotions.startsAt, now),
        or(gt(collectionPromotions.endsAt, now), isNull(collectionPromotions.endsAt)),
      )).limit(12),
      db.select({
        id: consultationPromotions.id,
        name: consultationPromotions.name,
        code: consultationPromotions.code,
        discountType: consultationPromotions.discountType,
        discountValue: consultationPromotions.discountValue,
        maxDiscount: consultationPromotions.maxDiscount,
        totalUsageLimit: consultationPromotions.totalUsageLimit,
        serviceTypes: consultationPromotions.serviceTypes,
        audience: consultationPromotions.audience,
        startsAt: consultationPromotions.startsAt,
        endsAt: consultationPromotions.endsAt,
      }).from(consultationPromotions).where(and(
        eq(consultationPromotions.status, 'active'),
        isNotNull(consultationPromotions.code),
        or(eq(consultationPromotions.audience, 'all'), eq(consultationPromotions.audience, 'new_customer'), eq(consultationPromotions.audience, 'returning_customer'), eq(consultationPromotions.audience, 'members')),
        or(lte(consultationPromotions.startsAt, now), isNull(consultationPromotions.startsAt)),
        or(gte(consultationPromotions.endsAt, now), isNull(consultationPromotions.endsAt)),
      )).limit(12),
    ])

    const collectionUsage = collectionRows.length === 0 ? [] : await db.select({
      promotionId: orderPromotionRedemptions.promotionId,
      totalUsed: count(),
    }).from(orderPromotionRedemptions).where(and(
      inArray(orderPromotionRedemptions.promotionId, collectionRows.map((promotion) => promotion.id)),
      inArray(orderPromotionRedemptions.status, ['reserved', 'applied']),
    )).groupBy(orderPromotionRedemptions.promotionId)
    const consultationUsage = consultationRows.length === 0 ? [] : await db.select({
      promotionId: consultationPromotionRedemptions.promotionId,
      totalUsed: count(),
    }).from(consultationPromotionRedemptions).where(and(
      inArray(consultationPromotionRedemptions.promotionId, consultationRows.map((promotion) => promotion.id)),
      inArray(consultationPromotionRedemptions.status, ['reserved', 'applied']),
    )).groupBy(consultationPromotionRedemptions.promotionId)
    const collectionUsageById = new Map(collectionUsage.map((usage) => [usage.promotionId, Number(usage.totalUsed)]))
    const consultationUsageById = new Map(consultationUsage.map((usage) => [usage.promotionId, Number(usage.totalUsed)]))

    const collectionOffers = collectionRows
      .filter((promotion) => promotion.totalUsageLimit === null || (collectionUsageById.get(promotion.id) || 0) < promotion.totalUsageLimit)
      .map((promotion) => ({
        kind: 'collection' as const,
        id: promotion.id,
        name: promotion.name,
        code: promotion.code,
        discountType: promotion.discountType,
        discountValue: String(promotion.discountValue),
        maxDiscount: promotion.maxDiscount ? String(promotion.maxDiscount) : null,
        audience: promotion.audience,
        startsAt: promotion.startsAt?.toISOString() || null,
        endsAt: promotion.endsAt?.toISOString() || null,
        scopeLabel: scopeLabel(promotion.targetType, promotion.collectionSlugs),
        href: '/collections',
      }))
    const consultationOffers = consultationRows
      .filter((promotion) => promotion.totalUsageLimit === null || (consultationUsageById.get(promotion.id) || 0) < promotion.totalUsageLimit)
      .map((promotion) => ({
        kind: 'consultation' as const,
        id: promotion.id,
        name: promotion.name,
        code: promotion.code,
        discountType: promotion.discountType,
        discountValue: String(promotion.discountValue),
        maxDiscount: promotion.maxDiscount ? String(promotion.maxDiscount) : null,
        audience: promotion.audience,
        startsAt: promotion.startsAt?.toISOString() || null,
        endsAt: promotion.endsAt?.toISOString() || null,
        scopeLabel: 'Consultation booking',
        href: '/book-consultation',
      }))

    return NextResponse.json({ promotions: [...collectionOffers, ...consultationOffers].slice(0, 8) }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error('[promotions] public active offers failed:', error)
    return NextResponse.json({ promotions: [] }, {
      headers: { 'Cache-Control': 'public, max-age=30' },
    })
  }
}
