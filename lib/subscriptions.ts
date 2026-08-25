import 'server-only'

import { getSetting } from '@/lib/actions/settings'

export type SubscriptionProgram = 'membership' | 'trade'
export type SubscriptionBillingPeriod = 'monthly' | 'annual'

export type SubscriptionPlan = {
  key: string
  name: string
  description: string
  monthlyAmount: string
  annualAmount: string
  benefits: string[]
  discountRate?: number
  enabled: boolean
}

export type SubscriptionPricingSettings = {
  membership: SubscriptionPlan[]
  trade: SubscriptionPlan[]
}

export const DEFAULT_SUBSCRIPTION_PRICING: SubscriptionPricingSettings = {
  membership: [
    {
      key: 'silver',
      name: 'Silver',
      description: 'A considered starting point for a more connected design practice.',
      monthlyAmount: '50000',
      annualAmount: '500000',
      benefits: [
        '15% discount on all collections',
        'Early access to new releases',
        'Quarterly design newsletters',
        'Community forum access',
        'Member event invitations',
      ],
      enabled: true,
    },
    {
      key: 'gold',
      name: 'Gold',
      description: 'More access, more guidance, and a closer relationship with the studio.',
      monthlyAmount: '120000',
      annualAmount: '1200000',
      benefits: [
        'All Silver benefits',
        '20% discount on all collections',
        'Monthly one-on-one consultations',
        'VIP event access',
        'Exclusive product previews',
        'Free shipping on orders over 100,000 UGX',
      ],
      enabled: true,
    },
    {
      key: 'platinum',
      name: 'Platinum',
      description: 'The fullest expression of access, sourcing, and personal attention.',
      monthlyAmount: '250000',
      annualAmount: '2500000',
      benefits: [
        'All Gold benefits',
        '25% discount on all collections',
        'Unlimited consultations',
        'Curated sourcing trips',
        'Custom product development',
        'Free shipping on all orders',
        'Dedicated relationship manager',
      ],
      enabled: true,
    },
  ],
  trade: [
    {
      key: 'entry',
      name: 'Entry-Level Trade',
      description: 'A flexible trade starting point for emerging practices and smaller orders.',
      monthlyAmount: '',
      annualAmount: '',
      discountRate: 10,
      benefits: ['Access to trade pricing', 'Quarterly price updates', 'Standard shipping rates'],
      enabled: false,
    },
    {
      key: 'professional',
      name: 'Professional Trade',
      description: 'Priority support and better commercial access for growing practices.',
      monthlyAmount: '',
      annualAmount: '',
      discountRate: 15,
      benefits: ['All Entry-Level benefits', 'Priority customer support', 'Dedicated account manager', 'Exclusive new releases'],
      enabled: false,
    },
    {
      key: 'strategic',
      name: 'Strategic Partner',
      description: 'A deeper commercial relationship for established partners.',
      monthlyAmount: '',
      annualAmount: '',
      discountRate: 20,
      benefits: ['All Professional Trade benefits', 'Custom net-30 payment terms', 'Quarterly business reviews', 'Co-marketing opportunities'],
      enabled: false,
    },
  ],
}

export async function getSubscriptionPricing() {
  return getSetting<SubscriptionPricingSettings>('subscription_pricing', DEFAULT_SUBSCRIPTION_PRICING)
}

export function getSubscriptionPlan(
  pricing: SubscriptionPricingSettings,
  program: SubscriptionProgram,
  planKey: string,
) {
  return pricing[program].find((plan) => plan.key === planKey && plan.enabled) || null
}

export function subscriptionAmount(plan: SubscriptionPlan, billingPeriod: SubscriptionBillingPeriod) {
  return billingPeriod === 'annual' ? plan.annualAmount : plan.monthlyAmount
}

export function annualSavings(plan: SubscriptionPlan) {
  const monthly = Number(plan.monthlyAmount)
  const annual = Number(plan.annualAmount)
  if (!Number.isFinite(monthly) || !Number.isFinite(annual) || monthly <= 0 || annual <= 0) return 0
  return Math.max(0, monthly * 12 - annual)
}

export function subscriptionEndDate(startDate: Date, billingPeriod: SubscriptionBillingPeriod) {
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + (billingPeriod === 'annual' ? 12 : 1))
  return endDate
}

export function subscriptionReturnPath(program: SubscriptionProgram) {
  return program === 'membership' ? '/membership/benefits' : '/trade/pricing'
}
