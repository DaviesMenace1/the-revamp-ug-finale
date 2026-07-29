'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import Link from 'next/link'

const collections = [
  {
    name: 'Living Room',
    description: 'Sophisticated seating, side tables, and lighting to create the perfect gathering space',
    count: '240+ products',
    href: '#',
  },
  {
    name: 'Dining',
    description: 'Statement tables, chairs, and serving pieces for memorable meals',
    count: '180+ products',
    href: '#',
  },
  {
    name: 'Bedroom',
    description: 'Bedframes, nightstands, and textiles for restful, luxurious sleep',
    count: '160+ products',
    href: '#',
  },
  {
    name: 'Kitchen',
    description: 'Functional and beautiful pieces for the heart of your home',
    count: '120+ products',
    href: '#',
  },
  {
    name: 'Bathroom',
    description: 'Vanities, mirrors, and accessories for spa-like retreats',
    count: '95+ products',
    href: '#',
  },
  {
    name: 'Lighting',
    description: 'Pendants, floor lamps, and statement fixtures to set the mood',
    count: '210+ products',
    href: '#',
  },
  {
    name: 'Office',
    description: 'Desks, storage, and seating for productive, inspiring workspaces',
    count: '140+ products',
    href: '#',
  },
  {
    name: 'Outdoor',
    description: 'Weather-resistant furniture and décor for terraces and gardens',
    count: '130+ products',
    href: '#',
  },
]

export default function CollectionsPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border/20 bg-gradient-to-br from-background via-background to-muted/20 py-24 md:py-32">
          <div className="mx-auto max-w-5xl px-6 md:px-8 space-y-6">
            <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground">
              Collections
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground font-light">
              Curated collections of furniture, décor, and accessories organized by room and purpose
            </p>
          </div>
        </section>

        {/* Collections Grid */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {collections.map((collection, idx) => (
                <Link key={collection.name} href={collection.href}>
                  <div className="group h-full cursor-pointer">
                    <div className="relative space-y-6 rounded-lg overflow-hidden">
                      {/* Image */}
                      <div className="h-64 bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden group-hover:opacity-80 transition-opacity flex items-center justify-center">
                        <span className="text-muted-foreground/40 font-light text-sm">Collection Image</span>
                      </div>

                      {/* Content */}
                      <div className="space-y-3 p-4">
                        <h2 className="font-serif text-2xl font-light text-foreground group-hover:text-primary transition-colors">
                          {collection.name}
                        </h2>
                        <p className="text-sm text-muted-foreground font-light leading-relaxed line-clamp-2">
                          {collection.description}
                        </p>
                        <div className="flex items-center justify-between pt-3 border-t border-border/20">
                          <span className="text-xs font-medium text-primary/70 uppercase tracking-wider">
                            {collection.count}
                          </span>
                          <span className="inline-flex items-center gap-1 text-primary/70 group-hover:text-primary transition-colors">
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                Looking for something specific?
              </h2>
              <p className="text-lg text-muted-foreground font-light">
                Our sourcing team can find and customize any piece from around the world
              </p>
            </div>
            <Link
              href="/book-consultation"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-light transition-colors"
            >
              Schedule a Consultation
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
