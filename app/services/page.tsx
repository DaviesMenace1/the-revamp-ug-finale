'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const services = [
  {
    id: 'architecture',
    title: 'Architecture',
    subtitle: 'Visionary design & structural excellence',
    description: 'From concept to completion, we transform spaces through thoughtful architectural design that balances aesthetics with function.',
    href: '/services/architecture',
  },
  {
    id: 'interior-design',
    title: 'Interior Design',
    subtitle: 'Curated interiors & storytelling',
    description: 'Our designers create bespoke interiors that reflect your vision, lifestyle, and the unique character of each space.',
    href: '/services/interior-design',
  },
  {
    id: 'sourcing',
    title: 'Global Sourcing',
    subtitle: 'Furniture & décor from around the world',
    description: 'Access to curated collections from international artisans, designers, and manufacturers. We handle all logistics and compliance.',
    href: '/services/sourcing',
  },
  {
    id: 'installation',
    title: 'White-Glove Installation',
    subtitle: 'Seamless execution & project management',
    description: 'Our expert team ensures flawless execution from delivery through final installation, with meticulous attention to detail.',
    href: '/services/installation',
  },
]

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border/20 bg-gradient-to-br from-background via-background to-muted/20 py-24 md:py-32">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="space-y-6 text-center">
              <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground">
                Our Services
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground font-light">
                Comprehensive solutions for architectural design, interior curation, global sourcing, and installation
              </p>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="grid gap-12 md:grid-cols-2">
              {services.map((service, idx) => (
                <Link key={service.id} href={service.href}>
                  <div className="group h-full cursor-pointer">
                    <div className="relative space-y-6 rounded-lg border border-border/40 bg-card/30 p-8 transition-all duration-300 hover:border-primary/40 hover:bg-card/60">
                      {/* Number */}
                      <div className="inline-block">
                        <span className="font-serif text-7xl font-light text-primary/20 group-hover:text-primary/40 transition-colors">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Title */}
                      <div className="space-y-2">
                        <h2 className="font-serif text-3xl font-light text-foreground group-hover:text-primary transition-colors">
                          {service.title}
                        </h2>
                        <p className="font-sans text-sm font-medium text-primary/80 uppercase tracking-wider">
                          {service.subtitle}
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-base text-muted-foreground font-light leading-relaxed">
                        {service.description}
                      </p>

                      {/* Arrow */}
                      <div className="pt-4">
                        <span className="inline-flex items-center gap-2 font-sans text-sm font-medium text-primary/70 group-hover:text-primary transition-colors">
                          Learn more
                          <svg
                            className="size-4 transition-transform group-hover:translate-x-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/20 bg-muted/5 py-20 md:py-24">
          <div className="mx-auto max-w-3xl px-6 md:px-8 text-center space-y-8">
            <div className="space-y-4">
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">
                Ready to transform your space?
              </h2>
              <p className="text-lg text-muted-foreground font-light">
                Book a consultation with our team to discuss your project
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-light text-base px-8 py-6"
            >
              <Link href="/book-consultation">Schedule a Consultation</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
