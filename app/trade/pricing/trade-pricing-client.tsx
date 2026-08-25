'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import SubscriptionCheckoutClient, { type SubscriptionPlanOption } from '@/components/subscriptions/subscription-checkout-client'

const faqs = [
  { q: 'Are there volume discounts?', a: 'Yes, orders over 100,000 UGX may qualify for additional discounts according to your active trade plan.' },
  { q: 'What payment terms do you offer?', a: 'Net-15 for Professional Trade and Net-30 for Strategic Partners are available subject to the applicable account terms.' },
  { q: 'Do prices include shipping?', a: 'No, shipping is calculated separately based on location and order size.' },
  { q: 'Do subscriptions renew automatically?', a: 'No. Trade subscriptions currently renew manually, so you stay in control of each payment.' },
]

export default function TradePricingClient({
  currentTierTitle,
  currentPlanKey,
  discountRate,
  subscriptionPlans,
}: {
  currentTierTitle: string | null
  currentPlanKey: string | null
  discountRate: number | null
  subscriptionPlans: SubscriptionPlanOption[]
}) {
  return (
    <PortalLayout
      portalName="Wholesale Partner"
      portalSlug="trade"
      navItems={[
        { label: 'Dashboard', href: '/trade' },
        { label: 'Collections', href: '/trade/collections' },
        { label: 'Orders', href: '/trade/orders' },
        { label: 'Pricing', href: '/trade/pricing' },
        { label: 'Resources', href: '/trade/resources' },
      ]}
    >
      <div className="space-y-12">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-primary">Trade access</p>
          <h1 className="mb-2 mt-3 font-serif text-4xl font-light text-foreground">Trade subscriptions</h1>
          <p className="text-lg text-muted-foreground">
            {currentTierTitle ? `You are currently on the ${currentTierTitle} tier${discountRate ? ` (${discountRate}% off retail)` : ''}.` : 'Choose the trade relationship that fits your practice.'}
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-serif text-2xl font-light text-foreground">Choose your plan</h2>
          <p className="mb-8 max-w-2xl text-sm leading-6 text-muted-foreground">Trade access activates immediately after verified payment. Choose monthly flexibility or an annual plan for a better value.</p>
          <SubscriptionCheckoutClient program="trade" plans={subscriptionPlans} currentPlan={currentPlanKey} />
        </div>

        <div className="space-y-4">
          <h3 className="font-serif text-2xl font-light text-foreground">Pricing FAQs</h3>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-border/20 pb-3">
                <p className="mb-2 font-medium text-foreground">{faq.q}</p>
                <p className="text-sm font-light text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
