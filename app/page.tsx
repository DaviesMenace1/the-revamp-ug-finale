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
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <StudioIntroSection />
        <PortfolioSection />
        <ServicesSection />
        <CollectionsSection />
        <section className="border-y border-border bg-card py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-primary">Need something made around you?</p>
              <h2 className="mt-3 max-w-3xl font-serif text-3xl font-light text-foreground sm:text-4xl">Bring us the room, the reference, or the rough idea.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Custom furniture, upholstery, cabinetry, lighting, and interior styling start with the details only you can provide.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end"><Link prefetch={false} href="/custom-services" className="inline-flex min-h-12 items-center gap-2 rounded-md bg-foreground px-5 text-xs font-semibold uppercase tracking-[0.14em] text-background transition-transform hover:-translate-y-0.5">Start a custom brief <ArrowRight className="size-4" aria-hidden="true" /></Link><Link prefetch={false} href="/book-consultation" className="inline-flex min-h-12 items-center rounded-md border border-border px-5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary hover:text-primary">Book a consultation</Link></div>
          </div>
        </section>
        <ProcessSection />
        <TestimonialsSection />
        <JournalSection articles={[]} />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  )
}
