'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Zap, Gift } from 'lucide-react'

const membershipTiers = [
  {
    id: 1,
    name: 'Silver',
    annual: '50,000 UGX',
    benefits: [
      '15% discount on all collections',
      'Early access to new releases',
      'Quarterly design newsletters',
      'Community forum access',
      'Member events invitations',
    ],
  },
  {
    id: 2,
    name: 'Gold',
    annual: '120,000 UGX',
    benefits: [
      'All Silver benefits',
      '20% discount on all collections',
      'Monthly one-on-one consultations',
      'VIP event access',
      'Exclusive product previews',
      'Free shipping on orders over 100,000 UGX',
    ],
    featured: true,
  },
  {
    id: 3,
    name: 'Platinum',
    annual: '250,000 UGX',
    benefits: [
      'All Gold benefits',
      '25% discount on all collections',
      'Unlimited consultations',
      'Curated sourcing trips',
      'Custom product development',
      'Free shipping on all orders',
      'Dedicated relationship manager',
    ],
  },
]

const perks = [
  {
    icon: Zap,
    title: 'Early Access',
    description: "Be the first to shop new collections before they're available to the public.",
  },
  {
    icon: Gift,
    title: 'Exclusive Offers',
    description: 'Members-only discounts and special promotions throughout the year.',
  },
  {
    icon: Check,
    title: 'Priority Support',
    description: 'Dedicated customer service and expedited responses to your inquiries.',
  },
]

export default function MembershipBenefitsClient({ currentTier }: { currentTier: string | null }) {
  return (
    <PortalLayout
      portalName="Membership"
      portalSlug="membership"
      navItems={[
        { label: 'Overview', href: '/membership' },
        { label: 'Benefits', href: '/membership/benefits' },
        { label: 'Community', href: '/membership/community' },
      ]}
    >
      <div className="space-y-16">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground mb-2">Membership Benefits</h1>
          <p className="text-lg text-muted-foreground">Choose the tier that fits your design practice.</p>
        </div>

        <div>
          <h2 className="font-serif text-2xl font-light text-foreground mb-8">What You Get</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {perks.map((perk, idx) => {
              const Icon = perk.icon
              return (
                <div key={idx} className="space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground">{perk.title}</h3>
                  <p className="text-sm text-muted-foreground font-light">{perk.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="font-serif text-2xl font-light text-foreground mb-8">Membership Tiers</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {membershipTiers.map((tier) => {
              const isCurrent = currentTier?.toLowerCase() === tier.name.toLowerCase()
              const highlight = isCurrent || (!currentTier && tier.featured)

              return (
                <div
                  key={tier.id}
                  className={`rounded-lg p-6 border transition-all ${
                    highlight ? 'border-primary bg-primary/5 md:scale-105' : 'border-border/20 hover:border-primary/20'
                  }`}
                >
                  {isCurrent ? (
                    <Badge className="mb-4 bg-primary text-white">Your Tier</Badge>
                  ) : (
                    !currentTier && tier.featured && (
                      <Badge className="mb-4 bg-gold text-obsidian">Most Popular</Badge>
                    )
                  )}

                  <h3 className="font-serif text-xl font-light text-foreground mb-2">{tier.name}</h3>
                  <p className="text-2xl font-light text-primary mb-6">{tier.annual}</p>

                  <div className="space-y-3 mb-8">
                    {tier.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex gap-2 text-sm text-muted-foreground font-light">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {!isCurrent && (
                    <Button
                      className={`w-full rounded-none ${
                        highlight ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
                      }`}
                    >
                      {currentTier ? 'Contact Us to Upgrade' : 'Choose Plan'}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}