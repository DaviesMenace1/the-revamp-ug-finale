'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

const priceStructure = [
  {
    id: 1,
    title: 'Entry-Level Trade',
    minOrder: '5,000 UGX',
    discount: '10% off retail',
    benefits: ['Access to trade pricing', 'Quarterly price updates', 'Standard shipping rates'],
  },
  {
    id: 2,
    title: 'Professional Trade',
    minOrder: '50,000 UGX',
    discount: '15% off retail',
    benefits: [
      'All Entry-Level benefits',
      'Priority customer support',
      'Dedicated account manager',
      'Exclusive new releases',
    ],
  },
  {
    id: 3,
    title: 'Strategic Partner',
    minOrder: '200,000 UGX',
    discount: '20% off retail',
    benefits: [
      'All Professional Trade benefits',
      'Custom net-30 payment terms',
      'Quarterly business reviews',
      'Co-marketing opportunities',
    ],
  },
]

const faqs = [
  { q: 'Are there volume discounts?', a: 'Yes, orders over 100,000 UGX qualify for additional 5% discount.' },
  {
    q: 'What payment terms do you offer?',
    a: 'Net-15 for Professional Trade, Net-30 for Strategic Partners. Bank transfer and credit terms available.',
  },
  { q: 'Do prices include shipping?', a: 'No, shipping calculated separately based on location and order size.' },
]

export default function TradePricingClient({
  currentTierTitle,
  discountRate,
}: {
  currentTierTitle: string | null
  discountRate: number | null
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
          <h1 className="font-serif text-4xl font-light text-foreground mb-2">Trade Pricing</h1>
          <p className="text-lg text-muted-foreground">
            {currentTierTitle
              ? `You're currently on the ${currentTierTitle} tier${discountRate ? ` (${discountRate}% off retail)` : ''}.`
              : 'View volume-based pricing and special wholesale rates.'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {priceStructure.map((tier) => {
            const isCurrent = tier.title === currentTierTitle

            return (
              <div
                key={tier.id}
                className={`p-6 rounded-lg border transition-all ${
                  isCurrent ? 'border-primary bg-primary/5' : 'border-border/20 hover:border-primary/20'
                }`}
              >
                {isCurrent && <Badge className="mb-4 bg-primary text-white">Your Current Tier</Badge>}

                <h3 className="font-serif text-xl font-light text-foreground mb-3">{tier.title}</h3>

                <div className="space-y-2 mb-6">
                  <p className="text-sm text-muted-foreground">Minimum Order</p>
                  <p className="text-2xl font-light text-primary">{tier.minOrder}</p>
                  <p className="text-sm font-medium text-gold">{tier.discount}</p>
                </div>

                <div className="space-y-3 mb-6">
                  {tier.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex gap-3 text-sm text-muted-foreground font-light">
                      <span className="text-primary">✓</span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                {!isCurrent && (
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
                    disabled={tier.title === 'Strategic Partner'}
                  >
                    {tier.title === 'Strategic Partner' ? 'Contact Sales' : 'Contact Us to Upgrade'}
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        <div className="space-y-4">
          <h3 className="font-serif text-2xl font-light text-foreground">Pricing FAQs</h3>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-border/20 pb-3">
                <p className="font-medium text-foreground mb-2">{faq.q}</p>
                <p className="text-sm text-muted-foreground font-light">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
