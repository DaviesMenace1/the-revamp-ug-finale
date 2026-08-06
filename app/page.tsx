import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { HeroSection } from '@/components/sections/hero-section'
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
        <JournalSection />
        <PortfolioSection />
        <CollectionsSection />
        <ServicesSection />
        <ProcessSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  )
}
