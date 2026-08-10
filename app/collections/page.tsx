import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CollectionsBrowser } from '@/components/collections/collections-browser'

export const metadata: Metadata = {
  title: 'Collections',
  description:
    'Browse our curated collection of furniture, lighting, and décor , filter by quick picks, by space, and by item type.',
}

export default function CollectionsPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border/20 bg-gradient-to-br from-background via-background to-muted/20 pt-28 md:pt-36 pb-12 md:pb-16">
          <div className="mx-auto max-w-7xl px-6 md:px-8 space-y-6">
            <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground">
              Collections
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground font-light">
              Curated furniture, lighting, and décor | Filter by quick picks, by the space you&apos;re
              designing, or by the exact piece you need.
            </p>
          </div>
        </section>

        {/* Browser with 3-level filters */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <CollectionsBrowser />
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
