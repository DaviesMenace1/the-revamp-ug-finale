import { and, count, eq, gte, inArray, isNotNull, isNull, lte, or } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { consultationPromotionRedemptions, consultationPromotions } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export async function GET() {
  const now = new Date()
  try {
    const rows = await db
      .select({
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
      })
      .from(consultationPromotions)
      .where(and(
        eq(consultationPromotions.status, 'active'),
        isNotNull(consultationPromotions.code),
        or(eq(consultationPromotions.audience, 'all'), eq(consultationPromotions.audience, 'new_customer'), eq(consultationPromotions.audience, 'returning_customer')),
        or(lte(consultationPromotions.startsAt, now), isNull(consultationPromotions.startsAt)),
        or(gte(consultationPromotions.endsAt, now), isNull(consultationPromotions.endsAt)),
      ))
      .limit(6)

    const usageCounts = rows.length === 0 ? [] : await db
      .select({
        promotionId: consultationPromotionRedemptions.promotionId,
        totalUsed: count(),
      })
      .from(consultationPromotionRedemptions)
      .where(and(
        inArray(consultationPromotionRedemptions.promotionId, rows.map((promotion) => promotion.id)),
        or(eq(consultationPromotionRedemptions.status, 'reserved'), eq(consultationPromotionRedemptions.status, 'applied')),
      ))
      .groupBy(consultationPromotionRedemptions.promotionId)
    const usageByPromotion = new Map(usageCounts.map((usage) => [usage.promotionId, Number(usage.totalUsed)]))
    const availableRows = rows.filter((promotion) => promotion.totalUsageLimit === null || (usageByPromotion.get(promotion.id) || 0) < promotion.totalUsageLimit)

    return NextResponse.json({
      promotions: availableRows.map((promotion) => ({
        id: promotion.id,
        name: promotion.name,
        code: promotion.code,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        maxDiscount: promotion.maxDiscount,
        serviceTypes: promotion.serviceTypes,
        audience: promotion.audience,
        startsAt: promotion.startsAt?.toISOString() || null,
        endsAt: promotion.endsAt?.toISOString() || null,
      })),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('[promotions] public consultation offers failed:', error)
    return NextResponse.json({ promotions: [] }, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    })
  }
}
