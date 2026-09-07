'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowRight, Calendar, Download, Package, Sparkles } from '@/components/ui/luxury-icons'
import { tradeNavItems } from '@/components/portals/portal-navigation'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

type Member = {
  businessName: string
  tier: string
  status: string
} | null

type Stats = {
  totalOrders: number
  pendingOrders: number
  ytdSpend: number
}

export default function TradeDashboardView({ member, stats, dataIssue }: { member: Member; stats: Stats; dataIssue?: boolean }) {
  const approved = member?.status === 'approved' || member?.status === 'active'
  const pending = member?.status === 'pending'
  const rejected = member && !approved && !pending

  return (
    <PortalLayout portalName="Trade Portal" portalSlug="trade" navItems={[...tradeNavItems]}>
      <div className="space-y-12">
        <header className="max-w-3xl space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">The Revamp UG / Trade</p>
          <h1 className="font-serif text-4xl font-light leading-[1.02] text-foreground sm:text-5xl md:text-6xl">A clearer way to specify.</h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">One considered workspace for product pricing, project resources, events, and orders for approved design practices.</p>
        </header>

        {dataIssue && <Card className="border-destructive/30 bg-destructive/5 p-5" role="alert"><p className="font-medium text-foreground">Some account information is temporarily unavailable.</p><p className="mt-1 text-sm text-muted-foreground">Your access has not changed. Refresh this page or contact the studio if the issue continues.</p></Card>}

        {!member && <Card className="border-primary/20 bg-primary/5 p-6 sm:p-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Trade access</p><h2 className="mt-2 font-serif text-3xl font-light text-foreground">Not a trade member yet.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Apply if you are an interior designer, architect, developer, hospitality professional, or work in a related practice.</p></div><Link href="/trade-program#apply" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-foreground px-5 text-xs font-semibold uppercase tracking-[0.14em] text-background hover:bg-primary">Apply for access <ArrowRight className="size-4" /></Link></div></Card>}

        {pending && <Card className="border-amber-300/70 bg-amber-50 p-6"><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-800">Application in review</p><h2 className="mt-2 font-serif text-3xl font-light text-foreground">We are reviewing {member.businessName}.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Collections and trade pricing will open here once the studio completes its review. You can return to your application or contact the studio if you need to update your details.</p><div className="mt-5 flex flex-wrap gap-4"><Link href="/trade-program#apply" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground underline underline-offset-4">Review application <ArrowRight className="size-4" /></Link><Link href="/contact" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground underline underline-offset-4">Contact the studio</Link></div></Card>}

        {rejected && <Card className="border-destructive/30 bg-destructive/5 p-6"><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-destructive">Trade access update</p><h2 className="mt-2 font-serif text-3xl font-light text-foreground">Your application needs attention.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">The studio has not marked this account as approved. Contact us for the next step before using trade collections.</p><Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground underline underline-offset-4">Speak with the studio <ArrowRight className="size-4" /></Link></Card>}

        <section aria-label="Trade account summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[['Orders placed', stats.totalOrders.toLocaleString('en-UG')], ['Pending orders', stats.pendingOrders.toLocaleString('en-UG')], ['Year to date', formatCurrency(stats.ytdSpend)], ['Account tier', approved ? (member?.tier || 'Approved') : 'Pending']].map(([label, value]) => <Card key={label} className="p-5 sm:p-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p><p className="mt-3 font-serif text-3xl font-light text-foreground">{value}</p>{label === 'Year to date' && <p className="mt-2 text-xs text-muted-foreground">Confirmed order value</p>}</Card>)}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link href={approved ? '/trade/collections' : '/trade-program#apply'} className="group rounded-xl border border-border/70 bg-card p-6 transition hover:border-primary/40 hover:bg-primary/5"><Package className="size-7 text-primary" /><h2 className="mt-5 font-serif text-2xl font-light text-foreground">Trade collections</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Browse products with the approved price for your practice.</p><span className="mt-6 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{approved ? 'Browse collection' : 'Apply first'} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span></Link>
          <Link href="/trade/events" className="group rounded-xl border border-border/70 bg-card p-6 transition hover:border-primary/40 hover:bg-primary/5"><Calendar className="size-7 text-primary" /><h2 className="mt-5 font-serif text-2xl font-light text-foreground">Trade events</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Find product previews, sourcing sessions, and studio gatherings.</p><span className="mt-6 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">View events <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span></Link>
          <Link href="/trade/resources" className="group rounded-xl border border-border/70 bg-card p-6 transition hover:border-primary/40 hover:bg-primary/5"><Download className="size-7 text-primary" /><h2 className="mt-5 font-serif text-2xl font-light text-foreground">Practice resources</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Keep specification sheets, catalogues, and studio guidance close.</p><span className="mt-6 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Open resources <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span></Link>
        </section>

        <Card className="flex flex-col gap-5 bg-foreground p-6 text-background sm:flex-row sm:items-center sm:justify-between sm:p-8"><div><Sparkles className="size-6 text-gold-light" /><h2 className="mt-4 font-serif text-2xl font-light">Need help with a project?</h2><p className="mt-2 max-w-xl text-sm leading-6 text-background/70">Bring your brief to the studio for sourcing, specification, and delivery guidance.</p></div><Link href="/contact?context=service" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-background/30 px-5 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-background hover:text-foreground">Start a conversation <ArrowRight className="size-4" /></Link></Card>
      </div>
    </PortalLayout>
  )
}
