import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductCard } from '@/components/collections/product-card'
import PageLoadError from '@/components/system/page-load-error'
import { db } from '@/lib/db/client'
import { products as productsTable } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

async function getPublishedProducts() {
  return db.query.products.findMany({
    where: eq(productsTable.status, 'published'),
    orderBy: [desc(productsTable.createdAt)],
    with: {
      productImages: true,
      productVariants: true,
      subCategory: { with: { category: true } },
    },
  })
}

export default async function CollectionsPage() {
  const result = await safeQuery(getPublishedProducts(), 'published collections', [])
  const products = result.data

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background pb-24 pt-28 md:pt-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <header className="mb-10 flex flex-col gap-8 border-b border-border/70 pb-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">The Revamp collection</p>
              <h1 className="mt-3 font-serif text-5xl tracking-tight md:text-7xl">Objects with presence.</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">A considered edit of furniture, lighting, and accents sourced for rooms that are meant to be lived in.</p>
            </div>
            <div className="flex shrink-0 items-end justify-between gap-8 md:flex-col md:items-end md:gap-3">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{products.length} {products.length === 1 ? 'piece' : 'pieces'}</span>
              <span className="text-xs text-primary">East Africa · Worldwide sourcing</span>
            </div>
          </header>

          {result.error ? (
            <div className="flex min-h-64 items-center justify-center rounded-xl border border-border/70 bg-card p-6"><PageLoadError title="The collection is taking longer than expected." message="We could not load the current collection. Your cart and saved pieces were not changed." /></div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center"><p className="font-serif text-3xl">The next edit is on its way.</p><p className="mt-3 text-sm text-muted-foreground">No published pieces are available just yet. Return soon or speak with our studio.</p></div>
          ) : (
            <section aria-label="Published collection pieces" className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-16">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
