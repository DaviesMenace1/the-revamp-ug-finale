import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, FileText, Percent, Users } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Trade Program | The Revamp UG',
  description: 'Trade support for developers, architects, hospitality teams, restaurants, and property professionals working with considered spaces.',
  alternates: { canonical: `${SITE_URL}/trade-program` },
  openGraph: {
    title: 'Trade Program | The Revamp UG',
    description: 'A trade relationship for design professionals and property teams.',
    url: `${SITE_URL}/trade-program`,
    type: 'website',
  },
}

const audiences = ['Developers', 'Architects', 'Hotels and restaurants', 'Property investors']

const benefits = [
  { icon: Percent, title: 'Trade pricing', description: 'Approved trade members can access the pricing structure associated with their account and project needs.' },
  { icon: Building2, title: 'Project sourcing', description: 'Bring furniture, lighting, materials, and custom procurement into a coordinated project conversation.' },
  { icon: FileText, title: 'Working resources', description: 'Use project resources and product information to support specification, review, and client presentation.' },
  { icon: Users, title: 'A studio relationship', description: 'Keep a direct line with the studio as briefs develop across residential, hospitality, and commercial work.' },
]

export default function TradeProgramPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background text-foreground">
        <section className="relative overflow-hidden bg-obsidian px-5 pb-20 pt-36 text-ivory sm:px-8 md:pb-28 md:pt-48 lg:px-16">
          <div className="absolute -right-40 top-12 size-[30rem] rounded-full border border-gold/20" aria-hidden="true" />
          <div className="relative mx-auto max-w-[1440px]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">The Revamp / trade program</p>
            <h1 className="mt-6 max-w-5xl font-serif text-6xl font-light leading-[0.92] tracking-tight sm:text-8xl lg:text-[8rem]">A considered resource for the people shaping spaces.</h1>
            <div className="mt-10 grid gap-8 border-t border-ivory/15 pt-8 md:grid-cols-[1fr_auto] md:items-end">
              <p className="max-w-2xl text-base leading-8 text-ivory/70 sm:text-lg">The Trade Program is for professionals and property teams who need a thoughtful route through collections, sourcing, specification, and project support.</p>
              <Link href="/contact?interest=trade_application" className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.18em] text-gold underline-offset-4 hover:underline">Apply for trade access <ArrowRight className="size-4" /></Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 md:py-24 lg:px-16">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div><p className="text-[10px] uppercase tracking-[0.28em] text-primary">For your next brief</p><h2 className="mt-5 max-w-xl font-serif text-4xl font-light leading-tight sm:text-6xl">Bring the project context with you.</h2></div>
            <div className="space-y-7 text-base leading-8 text-muted-foreground sm:text-lg"><p>Whether you are specifying for a client, developing a property, or shaping a hospitality environment, the right relationship starts with a clear brief.</p><div className="flex flex-wrap gap-2">{audiences.map((audience) => <span key={audience} className="border border-border px-3 py-2 text-xs uppercase tracking-[0.12em] text-foreground">{audience}</span>)}</div><p>Tell us about your practice or project. The studio can review the request and share the appropriate next step for access, sourcing, or a consultation.</p><Button asChild className="min-h-12 rounded-none px-6 text-xs uppercase tracking-[0.18em]"><Link href="/contact?interest=trade_application">Start an application <ArrowRight className="ml-2 size-4" /></Link></Button></div>
          </div>
        </section>

        <section className="border-y border-border/70 bg-muted/20 px-5 py-16 sm:px-8 md:py-24 lg:px-16">
          <div className="mx-auto max-w-[1440px]"><div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">{benefits.map(({ icon: Icon, title, description }) => <article key={title} className="bg-background p-6 sm:p-8"><Icon className="size-6 text-primary" aria-hidden="true" /><h2 className="mt-8 font-serif text-2xl font-light">{title}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p></article>)}</div></div>
        </section>

        <section className="px-5 py-16 sm:px-8 md:py-24 lg:px-16">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-8 border-y border-border py-10 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] uppercase tracking-[0.28em] text-primary">Already approved?</p><h2 className="mt-4 max-w-2xl font-serif text-4xl font-light leading-tight sm:text-5xl">Go to the trade workspace.</h2></div><Link href="/trade"><Button variant="outline" className="min-h-12 rounded-none px-6 text-xs uppercase tracking-[0.18em]">Open Trade Portal <ArrowRight className="ml-2 size-4" /></Button></Link></div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
