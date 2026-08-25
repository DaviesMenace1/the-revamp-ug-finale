import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { getConsultationPricing, getEligibleConsultationPromotion, normalizePromotionCode, pricingSummaryForPromotion } from '@/lib/consultation-commerce'

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Please sign in to apply a promotion.' }, { status: 401 })
    const user = await getOrCreateCurrentUser(clerkId)
    if (!user) return NextResponse.json({ error: 'Your account is not ready yet. Please try again.' }, { status: 503 })
    const body = await request.json().catch(() => ({})) as { promoCode?: unknown; serviceType?: unknown }
    const code = normalizePromotionCode(body.promoCode)
    const serviceType = typeof body.serviceType === 'string' ? body.serviceType.trim().slice(0, 100) : ''
    const pricing = await getConsultationPricing()
    const eligible = await getEligibleConsultationPromotion({ code, userId: user.id, serviceType: serviceType || null })
    if (eligible.error) return NextResponse.json({ error: eligible.error }, { status: 400 })
    const summary = pricingSummaryForPromotion(pricing, eligible.promotion)
    return NextResponse.json({
      baseFee: summary.baseAmount,
      discount: summary.discountAmount,
      tax: summary.taxAmount,
      total: summary.amount,
      currency: summary.currency,
      taxRate: summary.taxRate,
      taxInclusive: summary.taxInclusive,
      promoCode: summary.promotionCode,
      promoName: summary.promotionName,
    })
  } catch (error) {
    console.error('[consultation-quote] failed:', error)
    return NextResponse.json({ error: 'We could not calculate the consultation price. Please try again.' }, { status: 500 })
  }
}
