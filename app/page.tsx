import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { HeroSection } from '@/components/sections/hero-section'
import { StudioIntroSection } from '@/components/sections/studio-intro-section'
import { ServicesSection } from '@/components/sections/services-section'
import { PortfolioSection } from '@/components/sections/portfolio-section'
import { ProcessSection } from '@/components/sections/process-section'
import { CollectionsSection } from '@/components/sections/collections-section'
import { TestimonialsSection } from '@/components/sections/testimonials-section'
import { JournalSection } from '@/components/sections/journal-section'
import { CtaSection } from '@/components/sections/cta-section'

export const revalidate = 60

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <StudioIntroSection />
        <ServicesSection />
        <section className="section-pad bg-background">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
            <div className="grid gap-px bg-border md:grid-cols-2">
              <Link href="/services/architecture" className="group relative min-h-[420px] overflow-hidden bg-foreground p-8 sm:p-12">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,hsl(var(--primary)/0.18),transparent_45%)] transition-transform duration-700 group-hover:scale-105" />
                <div className="relative flex h-full flex-col justify-end">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-primary">01 — Architecture</p>
                  <h2 className="mt-4 max-w-lg font-serif text-4xl font-light leading-tight text-background sm:text-5xl">Spaces conceived with intention, proportion and permanence.</h2>
                  <span className="mt-8 inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.18em] text-background/70 transition-colors group-hover:text-primary">Explore Architecture <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
              <Link href="/services/interior-design" className="group relative min-h-[420px] overflow-hidden bg-card p-8 sm:p-12">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,hsl(var(--primary)/0.12),transparent_45%)] transition-transform duration-700 group-hover:scale-105" />
                <div className="relative flex h-full flex-col justify-end">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-primary">02 — Interior Design</p>
                  <h2 className="mt-4 max-w-lg font-serif text-4xl font-light leading-tight text-foreground sm:text-5xl">From spatial gesture to final object, every detail is considered.</h2>
                  <span className="mt-8 inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">Explore Interior Design <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            </div>
          </div>
        </section>
        <section className="relative overflow-hidden border-y border-border bg-foreground text-background">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-20 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-12 lg:py-28">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Global Procurement</p>
              <h2 className="mt-5 max-w-3xl font-serif text-5xl font-light leading-[0.95] sm:text-6xl lg:text-8xl">Exceptional pieces, sourced without borders.</h2>
            </div>
            <div className="flex flex-col justify-end lg:pl-10">
              <p className="max-w-md text-sm leading-7 text-background/65 sm:text-base">Furniture, materials, lighting and objects sourced globally and brought together with the care of a single considered vision.</p>
              <Link href="/source-with-revamp" className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 border border-background/25 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-background transition-colors hover:border-primary hover:text-primary">Start Sourcing <ArrowRight size={15} /></Link>
            </div>
          </div>
        </section>
        <CollectionsSection />
        <section className="section-pad border-y border-border bg-card">
          <div className="mx-auto max-w-[1440px] px-6 text-center lg:px-12">
            <p className="text-[10px] uppercase tracking-[0.28em] text-primary">Why The Revamp UG</p>
            <h2 className="mx-auto mt-4 max-w-4xl font-serif text-4xl font-light leading-tight text-foreground sm:text-6xl">A considered approach to the architecture of refined living.</h2>
            <div className="mx-auto mt-12 grid max-w-5xl gap-px bg-border sm:grid-cols-3">
              {[
                ['01', 'Considered', 'Every decision begins with the character of the space and the people who inhabit it.'],
                ['02', 'Global', 'A local design house with access to exceptional materials, makers and objects worldwide.'],
                ['03', 'White Glove', 'From first conversation through sourcing and installation, the experience remains deeply considered.'],
              ].map(([number, title, text]) => (
                <div key={number} className="bg-background p-8 text-left sm:p-10">
                  <span className="font-serif text-4xl font-light text-primary/40">{number}</span>
                  <h3 className="mt-8 font-serif text-2xl font-light text-foreground">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <PortfolioSection />
        <ProcessSection />
        <TestimonialsSection />
        <JournalSection articles={[]} />
        <section className="section-pad border-y border-border bg-card">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 md:flex-row md:items-end md:justify-between lg:px-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-primary">The Collection</p>
              <h2 className="mt-3 max-w-3xl font-serif text-4xl font-light leading-tight text-foreground sm:text-6xl">Bring the Revamp world into your next project.</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Request our latest catalogue or speak with the studio about a considered brief.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalog" className="inline-flex min-h-12 items-center gap-2 bg-foreground px-5 text-xs font-semibold uppercase tracking-[0.14em] text-background transition-transform hover:-translate-y-0.5">Request Our Catalog <ArrowRight size={14} /></Link>
              <Link href="/trade" className="inline-flex min-h-12 items-center border border-border px-5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary hover:text-primary">Trade Programme</Link>
            </div>
          </div>
        </section>
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  )
}
