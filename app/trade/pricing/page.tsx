'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default function TradePricing() {
  const priceStructure = [
    {
      id: 1,
      title: 'Entry-Level Trade',
      minOrder: '5,000 UGX',
      discount: '10% off retail',
      benefits: [
        'Access to trade pricing',
        'Quarterly price updates',
        'Standard shipping rates',
      ],
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
      featured: true,
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

  return (
    <PortalLayout
      title="Trade Pricing & Tiers"
      subtitle="Unlock exclusive wholesale pricing based on your order volume."
      portalType="trade"
    >
      <div className="space-y-12">
        {/* Pricing Tiers */}
        <div className="grid md:grid-cols-3 gap-6">
          {priceStructure.map(tier => (
            <div
              key={tier.id}
              className={`p-6 rounded-lg border transition-all ${
                tier.featured
                  ? 'border-primary bg-primary/5'
                  : 'border-border/20 hover:border-primary/20'
              }`}
            >
              {tier.featured && (
                <Badge className="mb-4 bg-primary text-white">Most Popular</Badge>
              )}

              <h3 className="font-serif text-xl font-light text-foreground mb-3">
                {tier.title}
              </h3>

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

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
                disabled={tier.title === 'Strategic Partner'}
              >
                {tier.title === 'Strategic Partner' ? 'Contact Sales' : 'Get Started'}
              </Button>
            </div>
          ))}
        </div>

        {/* Price Guide Download */}
        <div className="bg-muted/40 border border-border/20 rounded-lg p-8">
          <h3 className="font-serif text-2xl font-light text-foreground mb-3">
            Complete Price Guide
          </h3>
          <p className="text-muted-foreground font-light mb-6">
            Download our detailed pricing guide with per-unit wholesale rates, bulk discounts, and shipping information.
          </p>
          <Button variant="outline" size="lg" className="gap-2">
            <Download className="w-5 h-5" />
            Download PDF
          </Button>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h3 className="font-serif text-2xl font-light text-foreground">Pricing FAQs</h3>
          <div className="space-y-3">
            {[
              { q: 'Are there volume discounts?', a: 'Yes, orders over 100,000 UGX qualify for additional 5% discount.' },
              { q: 'What payment terms do you offer?', a: 'Net-15 for Professional Trade, Net-30 for Strategic Partners. Bank transfer and credit terms available.' },
              { q: 'Do prices include shipping?', a: 'No, shipping calculated separately based on location and order size.' },
            ].map((faq, idx) => (
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
