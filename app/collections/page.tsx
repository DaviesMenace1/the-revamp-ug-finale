import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import PageLoadError from '@/components/system/page-load-error'
import { db } from '@/lib/db/client'
import { products as productsTable } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { safeQuery } from '@/lib/server/safe-query'
import CollectionsGrid from './collections-grid'

export const dynamic = 'force-dynamic'

async function getPublishedProducts() {
  return db.query.products.findMany({
    where: eq(productsTable.status, 'published'),
    orderBy: [desc(productsTable.featured), desc(productsTable.createdAt)],
    with: {
      productImages: true,
      productVariants: true,
      subCategory: { with: { category: true } },
    },
    limit: 100,
  })
}

export default async function CollectionsPage() {
  const result = await safeQuery(getPublishedProducts(), 'published collections', [])
  const products = result.data

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden bg-obsidian px-5 pb-14 pt-36 text-ivory sm:px-8 md:pb-20 md:pt-48 lg:px-16">
          <div className="absolute right-[-12%] top-[-30%] size-[40rem] rounded-full border border-gold/20" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-5xl motion-reveal">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">The Revamp collection / current edit</p>
              <h1 className="mt-5 max-w-4xl font-serif text-6xl font-light leading-[0.9] sm:text-8xl lg:text-[8rem]">Objects with presence.</h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-ivory/65 sm:text-lg">Furniture, lighting, and accents chosen for rooms that are meant to be lived in rather than simply filled.</p>
            </div>
            <div className="flex items-end gap-5 border-l border-gold/45 pl-5 text-sm text-ivory/60 lg:mb-2 lg:flex-col lg:items-start lg:gap-1">
              <span className="font-serif text-5xl text-ivory">{products.length.toString().padStart(2, '0')}</span>
              <span className="max-w-[12rem] leading-6">Published pieces<br />East Africa · worldwide sourcing</span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1440px]">
          {result.error ? (
            <div className="mx-5 my-12 flex min-h-64 items-center justify-center rounded-2xl border border-border/70 bg-card p-6 sm:mx-8 lg:mx-16">
              <PageLoadError title="The collection is taking longer than expected." message="We could not load the current edit. Your cart and saved pieces were not changed." />
            </div>
          ) : products.length === 0 ? (
            <div className="mx-5 my-12 rounded-2xl border border-dashed border-border p-12 text-center sm:mx-8 lg:mx-16">
              <p className="font-serif text-3xl">The next edit is on its way.</p>
              <p className="mt-3 text-sm text-muted-foreground">No published pieces are available just yet. Return soon or speak with our studio.</p>
            </div>
          ) : (
            <CollectionsGrid products={products} />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
