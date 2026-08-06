'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { SERVICES } from '@/lib/data/services'
import { notFound } from 'next/navigation'

interface PageProps {
  params: {
    category: string
  }
}

export default function ServiceCategoryPage({ params }: PageProps) {
  const category = SERVICES.find((c) => c.slug === params.category)

  if (!category) {
    notFound()
  }

  // Find previous and next categories
  const categoryIndex = SERVICES.findIndex((c) => c.slug === params.category)
  const prevCategory = categoryIndex > 0 ? SERVICES[categoryIndex - 1] : null
  const nextCategory = categoryIndex < SERVICES.length - 1 ? SERVICES[categoryIndex + 1] : null

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <section className="border-b border-border/20 py-6">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/services" className="hover:text-foreground transition-colors">
                Services
              </Link>
              <span>/</span>
              <span className="text-foreground">{category.name}</span>
            </div>
          </div>
        </section>

        {/* Hero */}
        <section className="border-b border-border/20 py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="space-y-6">
              <h1 className="font-serif text-5xl md:text-6xl font-light text-foreground leading-tight">
                {category.name}
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground font-light">
                {category.description}
              </p>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="space-y-6">
              {category.services.map((service, idx) => (
                <Link
                  key={service.slug}
                  href={`/services/${category.slug}/${service.slug}`}
                  className="group block"
                >
                  <div className="p-8 border border-border/30 rounded-lg hover:border-gold/50 hover:bg-gold/5 transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-3xl font-light text-muted-foreground group-hover:text-gold transition-colors">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <h3 className="font-serif text-2xl font-light text-foreground group-hover:text-gold transition-colors">
                            {service.name}
                          </h3>
                        </div>
                        <p className="text-foreground/70 max-w-2xl">
                          {service.description}
                        </p>
                      </div>
                      <ArrowRight
                        size={20}
                        className="text-muted-foreground group-hover:text-gold transition-all duration-300 ml-6 flex-shrink-0 group-hover:translate-x-1 mt-1"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="border-t border-border/20 py-16">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {prevCategory ? (
                <Link
                  href={`/services/${prevCategory.slug}`}
                  className="group p-6 border border-border/30 rounded-lg hover:border-gold/50 hover:bg-gold/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors mb-2">
                    <ArrowLeft size={16} />
                    Previous Category
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-gold transition-colors">
                    {prevCategory.name}
                  </h3>
                </Link>
              ) : (
                <div />
              )}

              {nextCategory ? (
                <Link
                  href={`/services/${nextCategory.slug}`}
                  className="group p-6 border border-border/30 rounded-lg hover:border-gold/50 hover:bg-gold/5 transition-all duration-300 text-right md:text-left"
                >
                  <div className="flex items-center justify-end md:justify-start gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors mb-2">
                    Next Category
                    <ArrowRight size={16} />
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-gold transition-colors">
                    {nextCategory.name}
                  </h3>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/20 bg-foreground text-background py-16">
          <div className="mx-auto max-w-3xl px-6 md:px-8 text-center space-y-6">
            <h2 className="font-serif text-3xl md:text-4xl font-light">
              Interested in {category.name}?
            </h2>
            <p className="opacity-90">
              Schedule a consultation with our experts to discuss your specific needs.
            </p>
            <Link
              href="/book-consultation"
              className="inline-flex items-center gap-2 bg-gold text-foreground px-8 py-3 rounded font-medium hover:bg-gold/90 transition-colors"
            >
              Book Consultation
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
