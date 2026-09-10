import { NextResponse } from 'next/server'
import { getConsultationPricing } from '@/lib/consultation-commerce'

export async function GET() {
  const pricing = await getConsultationPricing()
  return NextResponse.json({
    baseFee: Number(pricing.baseFee),
    currency: pricing.currency,
    taxRate: Number(pricing.taxRate),
    taxInclusive: pricing.taxInclusive,
    terms: pricing.terms,
  })
}
