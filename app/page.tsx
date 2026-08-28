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
      </br>
      <main>
        <HeroSection />
        <StudioIntroSection />
        <ServicesSection />
        <PortfolioSection />
        <JournalSection articles={[]} />
        <CollectionsSection />
        <section className="relative overflow-hidden border-y border-border bg-foreground text-background">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-20 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-12 lg:py-28">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Global Procurement</p>
              <h2 className="mt-5 max-w-3xl font-serif text-5xl font-light leading-[0.95] sm:text-6xl lg:text-8xl">Exceptional pieces, sourced without borders.</h2>
            </div>
            <div className="flex flex-col justify-end lg:pl-10">
              <p className="max-w-md text-sm leading-7 text-background/65 sm:text-base">Furniture, materials, lighting and objects sourced globally and brought together with the care of a single considered vision.</p>
              <Link href="/services" className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 border border-background/25 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-background transition-colors hover:border-primary hover:text-primary">Explore Sourcing <ArrowRight size={15} /></Link>
            </div>
          </div>
        </section>
        
        
        
        <ProcessSection />
        <TestimonialsSection />
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
