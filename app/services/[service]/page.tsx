'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const serviceDetails: Record<string, any> = {
  architecture: {
    title: 'Architecture',
    subtitle: 'Transforming vision into structural reality',
    hero: 'Thoughtful architectural design that balances aesthetics with function, sustainability, and timeless elegance.',
    benefits: [
      'Bespoke design tailored to your vision',
      'Structural expertise & building compliance',
      'Sustainable & timeless solutions',
      'Project management from concept to completion',
    ],
    process: [
      'Initial consultation & site analysis',
      'Design development & 3D visualization',
      'Technical documentation & permits',
      'Construction management & oversight',
    ],
  },
  'interior-design': {
    title: 'Interior Design',
    subtitle: 'Curating spaces that tell your story',
    hero: 'We create bespoke interiors that reflect your unique lifestyle, personality, and the character of each space.',
    benefits: [
      'Personalized design that captures your style',
      'Expert curation of furniture & décor',
      'Color, lighting & material expertise',
      'Complete project coordination',
    ],
    process: [
      'Design consultation & inspiration gathering',
      'Mood boards & material selection',
      'Space planning & 3D renders',
      'Installation & styling',
    ],
  },
  sourcing: {
    title: 'Global Sourcing',
    subtitle: 'Access to the world\'s finest collections',
    hero: 'From international artisans to luxury brands, we source unique furniture, décor, and finishes worldwide.',
    benefits: [
      'Access to exclusive international brands',
      'Direct relationships with manufacturers',
      'Custom & bespoke commissioning',
      'Logistics & compliance management',
    ],
    process: [
      'Requirements definition',
      'Global market research & sourcing',
      'Negotiation & procurement',
      'Quality assurance & delivery',
    ],
  },
  installation: {
    title: 'White-Glove Installation',
    subtitle: 'Flawless execution, from delivery to completion',
    hero: 'Our expert installation team ensures every detail is perfect, with meticulous attention to quality and finish.',
    benefits: [
      'Professional installation team',
      'Project coordination & timeline management',
      'Quality assurance & inspections',
      'Post-installation support',
    ],
    process: [
      'Site preparation & logistics',
      'Expert installation & assembly',
      'Final touches & styling',
      'Client handoff & support',
    ],
  },
}

interface ServicePageProps {
  params: { service: string }
}

export default function ServiceDetailPage({ params }: ServicePageProps) {
  const service = serviceDetails[params.service]

  if (!service) {
    notFound()
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border/20 bg-gradient-to-br from-background via-background to-muted/20 py-24 md:py-32">
          <div className="mx-auto max-w-5xl px-6 md:px-8 space-y-6">
            <p className="font-sans text-sm font-medium text-primary/80 uppercase tracking-wider">
              Service Details
            </p>
            <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground">
              {service.title}
            </h1>
            <p className="max-w-2xl text-xl text-muted-foreground font-light">
              {service.subtitle}
            </p>
          </div>
        </section>

        {/* Overview */}
        <section className="py-20 md:py-28 border-b border-border/20">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <p className="text-lg text-muted-foreground font-light leading-relaxed max-w-3xl">
              {service.hero}
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 md:py-28 border-b border-border/20">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <h2 className="font-serif text-4xl font-light text-foreground mb-12">Key Benefits</h2>
            <div className="grid gap-8 md:grid-cols-2">
              {service.benefits.map((benefit: string, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center size-8 rounded-full bg-primary/10">
                      <span className="text-sm font-medium text-primary">✓</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-light text-foreground">{benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-20 md:py-28 border-b border-border/20">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <h2 className="font-serif text-4xl font-light text-foreground mb-12">Our Process</h2>
            <div className="space-y-8">
              {service.process.map((step: string, idx: number) => (
                <div key={idx} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="font-serif text-4xl font-light text-primary/20">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="font-light text-foreground text-lg">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-24 bg-muted/5">
          <div className="mx-auto max-w-3xl px-6 md:px-8 text-center space-y-8">
            <div className="space-y-4">
              <h2 className="font-serif text-4xl font-light text-foreground">
                Ready to get started?
              </h2>
              <p className="text-lg text-muted-foreground font-light">
                Let's discuss how we can help transform your project
              </p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-light text-base px-8 py-6"
              >
                <Link href="/book-consultation">Book Consultation</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-none font-light text-base px-8 py-6"
              >
                <Link href="/contact">Get in Touch</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
