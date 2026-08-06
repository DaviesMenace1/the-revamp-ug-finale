'use client'

import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { SERVICES } from '@/lib/data/services'
import { ChevronRight, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ServicesPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(SERVICES[0]?.id || null)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border/20 py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="space-y-6">
              <h1 className="font-serif text-5xl md:text-6xl font-light text-foreground leading-tight">
                Our Services
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground font-light">
                From concept to completion, we offer a comprehensive range of luxury design and procurement services 
                tailored to your unique vision and requirements. Choose from 11 service categories and 70+ specialized services.
              </p>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Categories Sidebar */}
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">
                  Service Categories
                </p>
                {SERVICES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() =>
                      setExpandedCategory(expandedCategory === category.id ? null : category.id)
                    }
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-lg transition-all duration-200',
                      expandedCategory === category.id
                        ? 'bg-gold/10 border border-gold/20'
                        : 'hover:bg-background/50 border border-transparent'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className={cn(
                        'font-medium text-sm transition-colors',
                        expandedCategory === category.id ? 'text-gold' : 'text-foreground'
                      )}>
                        {category.name}
                      </h3>
                      <ChevronRight
                        size={16}
                        className={cn(
                          'transition-transform',
                          expandedCategory === category.id ? 'rotate-90 text-gold' : 'text-muted-foreground'
                        )}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.services.length} services
                    </p>
                  </button>
                ))}
              </div>

              {/* Services Content */}
              <div className="lg:col-span-3">
                {SERVICES.map((category) => (
                  expandedCategory === category.id && (
                    <div key={category.id} className="space-y-8">
                      <div>
                        <h2 className="font-serif text-4xl font-light text-foreground mb-3">
                          {category.name}
                        </h2>
                        <p className="text-foreground/70 max-w-2xl">
                          {category.description}
                        </p>
                      </div>

                      {/* Services Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.services.map((service) => (
                          <Link
                            key={service.slug}
                            href={`/services/${category.slug}/${service.slug}`}
                            className="group block"
                          >
                            <div className="h-full p-6 border border-border/30 rounded-lg hover:border-gold/50 hover:bg-gold/5 transition-all duration-300">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-medium text-foreground group-hover:text-gold transition-colors">
                                    {service.name}
                                  </h3>
                                  <p className="text-sm text-foreground/60 mt-2 group-hover:text-foreground/70 transition-colors">
                                    {service.description}
                                  </p>
                                </div>
                                <ArrowRight
                                  size={16}
                                  className="text-muted-foreground group-hover:text-gold transition-all duration-300 ml-3 flex-shrink-0 group-hover:translate-x-1"
                                />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/20 bg-foreground text-background py-20 md:py-24">
          <div className="mx-auto max-w-3xl px-6 md:px-8 text-center space-y-8">
            <div className="space-y-4">
              <h2 className="font-serif text-4xl md:text-5xl font-light">
                Ready to transform your space?
              </h2>
              <p className="text-lg opacity-90">
                Book a consultation with our team to discuss your project and discover how we can bring your vision to life.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-gold text-foreground hover:bg-gold/90 rounded font-medium text-base px-8 py-3"
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
