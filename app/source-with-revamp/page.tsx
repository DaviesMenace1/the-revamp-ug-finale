import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Boxes, ClipboardCheck, Globe2, Truck } from '@/components/ui/luxury-icons'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Source With Revamp | Furniture, Materials and Procurement',
  description: 'A considered sourcing and procurement service for furniture, lighting, materials, and custom pieces for residential, hospitality, and commercial spaces.',
  alternates: { canonical: `${SITE_URL}/source-with-revamp` },
  openGraph: {
    title: 'Source With Revamp | The Revamp UG',
    description: 'Furniture, materials, custom pieces, and procurement support for considered spaces.',
    url: `${SITE_URL}/source-with-revamp`,
    type: 'website',
  },
}

const steps = [
  {
    number: '01',
    title: 'Define the brief',
    description: 'Share the room, project stage, quantities, dimensions, preferred materials, and the decisions that still need to be made.',
  },
  {
    number: '02',
    title: 'Shape the shortlist',
    description: 'We research suitable furniture, lighting, finishes, and custom options around the brief and the way the space will be used.',
  },
  {
    number: '03',
    title: 'Coordinate the route',
    description: 'When the scope is agreed, procurement, supplier coordination, inspection, logistics, and installation requirements can be planned together.',
  },
]

const capabilities = [
  { icon: Globe2, title: 'Global sourcing', description: 'Explore furniture, lighting, art, décor, materials, and custom options from suitable suppliers and makers.' },
  { icon: Boxes, title: 'Customisation', description: 'Develop a product or finish brief around dimensions, material direction, colour, and intended use.' },
  { icon: ClipboardCheck, title: 'Procurement support', description: 'Bring specifications, supplier conversations, quantities, and quality considerations into one considered brief.' },
  { icon: Truck, title: 'Logistics planning', description: 'Discuss inspection, shipping, import coordination, delivery, and installation requirements as part of the project scope.' },
]

export default function SourceWithRevampPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background text-foreground">
        <section className="relative overflow-hidden bg-obsidian px-5 pb-20 pt-36 text-ivory sm:px-8 md:pb-28 md:pt-48 lg:px-16">
          <div className="absolute -right-32 top-16 size-96 rounded-full border border-gold/20" aria-hidden="true" />
          <div className="absolute -bottom-56 left-1/3 size-[34rem] rounded-full border border-ivory/10" aria-hidden="true" />
          <div className="relative mx-auto max-w-[1440px]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">The Revamp / sourcing studio</p>
            <h1 className="mt-6 max-w-5xl font-serif text-6xl font-light leading-[0.92] tracking-tight sm:text-8xl lg:text-[9rem]">Source the pieces that make the room.</h1>
            <div className="mt-10 grid gap-8 border-t border-ivory/15 pt-8 md:grid-cols-[1fr_auto] md:items-end">
              <p className="max-w-2xl text-base leading-8 text-ivory/70 sm:text-lg">From a single statement piece to a full project brief, we help bring furniture, materials, lighting, art, and custom elements into a more coherent direction.</p>
              <Link href="/contact?interest=sourcing" className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.18em] text-gold underline-offset-4 hover:underline">Start a sourcing brief <ArrowRight className="size-4" /></Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 md:py-24 lg:px-16">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-primary">A considered route</p>
              <h2 className="mt-5 max-w-xl font-serif text-4xl font-light leading-tight sm:text-6xl">Sourcing is part of the design.</h2>
            </div>
            <div className="space-y-6 text-base leading-8 text-muted-foreground sm:text-lg">
              <p>The right piece is not only a question of appearance. Scale, comfort, material, durability, budget, availability, and the journey to site all shape whether it belongs in a space.</p>
              <p>Tell us what you are building, furnishing, or refining. We can help clarify the brief before discussing the most suitable next step, whether that is a curated shortlist, a custom piece, or wider procurement support.</p>
              <Button asChild className="min-h-12 rounded-none px-6 text-xs uppercase tracking-[0.18em]"><Link href="/custom-services">Explore custom services <ArrowRight className="ml-2 size-4" /></Link></Button>
            </div>
          </div>
        </section>

        <section className="border-y border-border/70 bg-muted/20 px-5 py-16 sm:px-8 md:py-24 lg:px-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map(({ icon: Icon, title, description }) => (
                <article key={title} className="bg-background p-6 sm:p-8">
                  <Icon className="size-6 text-primary" aria-hidden="true" />
                  <h2 className="mt-8 font-serif text-2xl font-light">{title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 md:py-24 lg:px-16">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-primary">How we begin</p>
              <h2 className="mt-5 font-serif text-4xl font-light leading-tight sm:text-6xl">A brief before a basket.</h2>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {steps.map((step) => (
                <div key={step.number} className="grid gap-4 py-7 sm:grid-cols-[5rem_1fr] sm:gap-8">
                  <span className="font-serif text-4xl text-gold">{step.number}</span>
                  <div><h3 className="font-serif text-2xl font-light">{step.title}</h3><p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{step.description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-foreground px-5 py-16 text-background sm:px-8 md:py-24 lg:px-16">
          <div className="mx-auto flex max-w-[1100px] flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
            <div><p className="text-[10px] uppercase tracking-[0.28em] text-gold">Have a piece in mind?</p><h2 className="mt-4 max-w-2xl font-serif text-4xl font-light leading-tight sm:text-6xl">Bring us the details, and we will help shape the next conversation.</h2></div>
            <Link href="/contact?interest=sourcing"><Button variant="outline" className="min-h-12 rounded-none border-background/30 bg-transparent px-6 text-xs uppercase tracking-[0.18em] text-background hover:bg-background hover:text-foreground">Request a sourcing brief <ArrowRight className="ml-2 size-4" /></Button></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
