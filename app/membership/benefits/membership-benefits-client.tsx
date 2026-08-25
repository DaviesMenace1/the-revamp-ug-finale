'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Check, Zap, Gift } from 'lucide-react'
import SubscriptionCheckoutClient, { type SubscriptionPlanOption } from '@/components/subscriptions/subscription-checkout-client'

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

export default function MembershipBenefitsClient({
  currentTier,
  subscriptionPlans,
}: {
  currentTier: string | null
  subscriptionPlans: SubscriptionPlanOption[]
}) {
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
          <h1 className="mb-2 font-serif text-4xl font-light text-foreground">Membership Benefits</h1>
          <p className="text-lg text-muted-foreground">Choose the tier that fits your design practice.</p>
        </div>

        <div>
          <h2 className="mb-8 font-serif text-2xl font-light text-foreground">What You Get</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {perks.map((perk) => {
              const Icon = perk.icon
              return (
                <div key={perk.title} className="space-y-3">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10"><Icon className="size-6 text-primary" /></div>
                  <h3 className="font-medium text-foreground">{perk.title}</h3>
                  <p className="text-sm font-light text-muted-foreground">{perk.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-2 font-serif text-2xl font-light text-foreground">Membership plans</h2>
          <p className="mb-8 text-sm leading-6 text-muted-foreground">Choose monthly flexibility or save with an annual plan. Your access activates after verified payment.</p>
          <SubscriptionCheckoutClient program="membership" plans={subscriptionPlans} currentPlan={currentTier} />
        </div>
      </div>
    </PortalLayout>
  )
}
