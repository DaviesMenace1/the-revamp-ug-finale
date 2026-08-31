import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarDays, Crown, Sparkles } from '@/components/ui/luxury-icons'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Membership | The Revamp UG',
  description: 'Discover The Revamp UG membership direction, private access, design resources, events, and collection privileges for a considered life.',
  alternates: { canonical: `${SITE_URL}/membership-program` },
  openGraph: {
    title: 'Membership | The Revamp UG',
    description: 'A considered membership world for collections, content, events, and private access.',
    url: `${SITE_URL}/membership-program`,
    type: 'website',
  },
}

const tiers = [
  { name: 'Essential', description: 'A considered introduction to the Revamp world and its design perspective.' },
  { name: 'Collector', description: 'For a deeper relationship with collections, stories, and selected access.' },
  { name: 'Patron', description: 'For clients who want a more personal route into private events and consultations.' },
  { name: 'Black', description: 'A future invitation-led tier for the most private Revamp experiences.' },
]

const benefits = [
  { icon: Crown, title: 'Private access', description: 'A membership structure designed for selected collections, pages, and experiences.' },
  { icon: CalendarDays, title: 'Private events', description: 'Gatherings, showings, and conversations can be shaped for the membership community.' },
  { icon: Sparkles, title: 'Collection privileges', description: 'Early access and member pricing can be connected to eligible Revamp collections.' },
  { icon: BookOpen, title: 'A richer design world', description: 'Digital stories, magazines, resources, and references that extend beyond a single purchase.' },
]

export default function MembershipProgramPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background text-foreground">
        <section className="relative overflow-hidden bg-obsidian px-5 pb-20 pt-36 text-ivory sm:px-8 md:pb-28 md:pt-48 lg:px-16">
          <div className="absolute -left-40 top-20 size-[30rem] rounded-full border border-gold/20" aria-hidden="true" />
          <div className="relative mx-auto max-w-[1440px]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">The Revamp / membership</p>
            <h1 className="mt-6 max-w-5xl font-serif text-6xl font-light leading-[0.92] tracking-tight sm:text-8xl lg:text-[8rem]">A more personal way to live with design.</h1>
            <div className="mt-10 grid gap-8 border-t border-ivory/15 pt-8 md:grid-cols-[1fr_auto] md:items-end"><p className="max-w-2xl text-base leading-8 text-ivory/70 sm:text-lg">Membership is being shaped as a private Revamp world for people who want closer access to collections, stories, events, and considered design support.</p><Link href="/contact?interest=membership_waitlist" className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.18em] text-gold underline-offset-4 hover:underline">Join the waiting list <ArrowRight className="size-4" /></Link></div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 md:py-24 lg:px-16"><div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24"><div><p className="text-[10px] uppercase tracking-[0.28em] text-primary">The membership direction</p><h2 className="mt-5 max-w-xl font-serif text-4xl font-light leading-tight sm:text-6xl">Not just a discount. A design relationship.</h2></div><div className="space-y-6 text-base leading-8 text-muted-foreground sm:text-lg"><p>The programme is intended to connect the things that make the Revamp experience feel distinct: access to collections, a closer view of the studio’s point of view, private gatherings, and support for the spaces members are shaping.</p><p>Membership availability and benefits can evolve as the programme develops. Join the waiting list to share your interest and help the studio understand the right fit.</p><Button asChild className="min-h-12 rounded-none px-6 text-xs uppercase tracking-[0.18em]"><Link href="/contact?interest=membership_waitlist">Register your interest <ArrowRight className="ml-2 size-4" /></Link></Button></div></div></section>

        <section className="border-y border-border/70 bg-muted/20 px-5 py-16 sm:px-8 md:py-24 lg:px-16"><div className="mx-auto max-w-[1440px]"><div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">{benefits.map(({ icon: Icon, title, description }) => <article key={title} className="bg-background p-6 sm:p-8"><Icon className="size-6 text-primary" aria-hidden="true" /><h2 className="mt-8 font-serif text-2xl font-light">{title}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p></article>)}</div></div></section>

        <section className="px-5 py-16 sm:px-8 md:py-24 lg:px-16"><div className="mx-auto max-w-[1440px]"><div className="mb-10 max-w-2xl"><p className="text-[10px] uppercase tracking-[0.28em] text-primary">A possible progression</p><h2 className="mt-4 font-serif text-4xl font-light sm:text-6xl">Find your place in the world.</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{tiers.map((tier, index) => <article key={tier.name} className="border border-border p-6 sm:p-8"><span className="text-[10px] uppercase tracking-[0.2em] text-gold">0{index + 1}</span><h3 className="mt-12 font-serif text-3xl font-light">{tier.name}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{tier.description}</p></article>)}</div></div></section>

        <section className="bg-foreground px-5 py-16 text-background sm:px-8 md:py-24 lg:px-16"><div className="mx-auto flex max-w-[1100px] flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] uppercase tracking-[0.28em] text-gold">Already a member?</p><h2 className="mt-4 max-w-2xl font-serif text-4xl font-light leading-tight sm:text-5xl">Enter your Revamp membership space.</h2></div><Link href="/membership"><Button variant="outline" className="min-h-12 rounded-none border-background/30 bg-transparent px-6 text-xs uppercase tracking-[0.18em] text-background hover:bg-background hover:text-foreground">Open Membership Portal <ArrowRight className="ml-2 size-4" /></Button></Link></div></section>
      </main>
      <SiteFooter />
    </>
  )
}
