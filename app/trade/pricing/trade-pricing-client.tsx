'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { ArrowRight, Check, FileText } from '@/components/ui/luxury-icons'
import BrowserNotificationPrompt from '@/components/notifications/browser-notification-prompt'
import Link from 'next/link'

const faqs = [
  { q: 'Who can apply?', a: 'Interior designers, architects, real estate developers, hospitality teams, property professionals, and related practices can request trade access.' },
  { q: 'How are discounts set?', a: 'The studio sets the discount on each eligible product. Your Trade Collections view shows the approved price before you place an order.' },
  { q: 'Is there a membership fee?', a: 'No. Trade access is application-based and there is no recurring subscription payment.' },
  { q: 'Can product discounts change?', a: 'Yes. The studio may update product-specific trade pricing as collections and project terms change.' },
]

type Member = { businessName: string; tier: string; status: string }

export default function TradePricingClient({ member }: { member: Member }) {
  return (
    <PortalLayout portalName="Trade Portal" portalSlug="trade" navItems={[{ label: 'Dashboard', href: '/trade' }, { label: 'Collections', href: '/trade/collections' }, { label: 'Orders', href: '/trade/orders' }, { label: 'Pricing', href: '/trade/pricing' }, { label: 'Resources', href: '/trade/resources' }]}>
      <div className="space-y-12">
        <BrowserNotificationPrompt context="trade" />
        <div><p className="text-xs uppercase tracking-[0.2em] text-primary">Trade access / {member.businessName}</p><h1 className="mt-3 font-serif text-4xl font-light text-foreground md:text-5xl">A clearer way to specify.</h1><p className="mt-3 max-w-2xl text-lg text-muted-foreground">Your approved trade relationship gives you access to product-specific pricing, sourcing support, and a more direct studio conversation.</p></div>
        <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8"><div className="flex items-start gap-4"><Check className="mt-1 size-6 text-primary" /><div><p className="text-xs uppercase tracking-[0.2em] text-primary">Account status</p><h2 className="mt-2 font-serif text-3xl font-light text-foreground">{member.tier}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Browse Trade Collections to see the discount configured for each product. Retail prices remain unchanged for the public collection.</p><Link href="/trade/collections" className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary">Open Trade Collections <ArrowRight className="size-4" /></Link></div></div></section>
        <section className="grid gap-4 md:grid-cols-3"><article className="rounded-lg border border-border/60 p-6"><FileText className="size-6 text-primary" /><h2 className="mt-5 font-serif text-2xl font-light">Product pricing</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Each product can carry its own trade discount, visible only in the protected trade collection.</p></article><article className="rounded-lg border border-border/60 p-6"><Check className="size-6 text-primary" /><h2 className="mt-5 font-serif text-2xl font-light">No subscription</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Access is reviewed and approved for qualifying practices without a monthly or annual programme fee.</p></article><article className="rounded-lg border border-border/60 p-6"><ArrowRight className="size-6 text-primary" /><h2 className="mt-5 font-serif text-2xl font-light">Studio support</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Bring a brief to the studio for sourcing, specification, and project support.</p></article></section>
        <section className="space-y-4"><h3 className="font-serif text-2xl font-light text-foreground">Trade access FAQs</h3>{faqs.map((faq) => <div key={faq.q} className="border-b border-border/60 pb-4"><p className="font-medium text-foreground">{faq.q}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.a}</p></div>)}</section>
      </div>
    </PortalLayout>
  )
}
