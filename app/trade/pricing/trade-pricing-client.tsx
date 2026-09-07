'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { ArrowRight, Check, FileText, MessageCircle } from '@/components/ui/luxury-icons'
import BrowserNotificationPrompt from '@/components/notifications/browser-notification-prompt'
import Link from 'next/link'
import { tradeNavItems } from '@/components/portals/portal-navigation'

const faqs = [
  { q: 'Who can apply?', a: 'Interior designers, architects, real estate developers, hospitality teams, property professionals, and related practices can request trade access.' },
  { q: 'How are prices set?', a: 'The studio sets the discount on each eligible product. Your Trade Collections view shows the approved price before you place an order.' },
  { q: 'Is there a membership fee?', a: 'No. Trade access is application-based and there is no recurring subscription payment.' },
  { q: 'Can product discounts change?', a: 'Yes. The studio may update product-specific trade pricing as collections and project terms change.' },
]

type Member = { businessName: string; tier: string; status: string } | null

export default function TradePricingClient({ member }: { member: Member }) {
  const approved = member?.status === 'approved' || member?.status === 'active'

  return (
    <PortalLayout portalName="Trade Portal" portalSlug="trade" navItems={[...tradeNavItems]}>
      <div className="space-y-12">
        <BrowserNotificationPrompt context="trade" />
        <header className="max-w-3xl space-y-4"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Trade pricing / {member?.businessName || 'Application'}</p><h1 className="font-serif text-4xl font-light leading-[1.04] text-foreground md:text-6xl">Specify with confidence.</h1><p className="text-base leading-7 text-muted-foreground">Trade pricing is set product by product, so the price you see reflects the piece, the collection, and the studio terms available to your practice.</p></header>

        {!approved ? <section className="rounded-xl border border-amber-300/70 bg-amber-50 p-6 sm:p-8"><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-800">Access pending</p><h2 className="mt-2 font-serif text-3xl font-light text-foreground">Trade pricing opens after approval.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">We review each practice before showing member prices. You can review your application or speak with the studio about your eligibility.</p><div className="mt-5 flex flex-wrap gap-4"><Link href="/trade-program#apply" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground underline underline-offset-4">Review application <ArrowRight className="size-4" /></Link><Link href="/contact" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground underline underline-offset-4">Contact the studio</Link></div></section> : <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8"><div className="flex items-start gap-4"><Check className="mt-1 size-6 shrink-0 text-primary" /><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Approved trade account</p><h2 className="mt-2 font-serif text-3xl font-light text-foreground">{member?.tier || 'Trade access'}</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">Open Trade Collections to see the studio price configured for each product. Retail prices remain unchanged in the public collection.</p><Link href="/trade/collections" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Open Trade Collections <ArrowRight className="size-4" /></Link></div></div></section>}

        <section className="grid gap-4 md:grid-cols-3"><article className="rounded-xl border border-border/70 bg-card p-6"><FileText className="size-6 text-primary" /><h2 className="mt-5 font-serif text-2xl font-light">Product-specific pricing</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Every eligible piece can carry its own trade discount. Your protected collection shows the approved amount clearly.</p></article><article className="rounded-xl border border-border/70 bg-card p-6"><Check className="size-6 text-primary" /><h2 className="mt-5 font-serif text-2xl font-light">No recurring fee</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Access is reviewed for qualifying practices without a monthly or annual programme fee.</p></article><article className="rounded-xl border border-border/70 bg-card p-6"><MessageCircle className="size-6 text-primary" /><h2 className="mt-5 font-serif text-2xl font-light">Studio support</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Bring a brief to the studio for sourcing, specification, and project support.</p></article></section>
        <section className="space-y-4"><h2 className="font-serif text-3xl font-light text-foreground">Trade access questions</h2>{faqs.map((faq) => <details key={faq.q} className="group border-b border-border/60 py-4"><summary className="cursor-pointer list-none font-medium text-foreground marker:hidden">{faq.q}<span className="float-right text-primary transition group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{faq.a}</p></details>)}</section>
      </div>
    </PortalLayout>
  )
}
