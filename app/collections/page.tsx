import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import Link from 'next/link'
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
  const leadProduct = products.find((product) => product.featured) ?? products[0]
  const railProducts = products.filter((product) => product.id !== leadProduct?.id).slice(0, 2)
  const remainingProducts = products.filter((product) => product.id !== leadProduct?.id && !railProducts.some((railProduct) => railProduct.id === product.id))

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background pb-28 pt-28 md:pt-36">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-12">
          <header className="grid gap-8 border-b border-border/70 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">The Revamp collection · 01</p>
              <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[0.94] tracking-tight text-foreground sm:text-7xl lg:text-[6.5rem]">Objects with presence.</h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">A considered edit of furniture, lighting, and accents sourced for rooms that are meant to be lived in.</p>
            </div>
            <div className="flex items-end justify-between gap-8 text-right lg:flex-col lg:gap-3"><span className="font-serif text-4xl text-foreground">{products.length.toString().padStart(2, '0')}</span><span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Pieces in the current edit<br />East Africa · Worldwide sourcing</span></div>
          </header>

          {result.error ? (
            <div className="mt-10 flex min-h-64 items-center justify-center rounded-2xl border border-border/70 bg-card p-6"><PageLoadError title="The collection is taking longer than expected." message="We could not load the current collection. Your cart and saved pieces were not changed." /></div>
          ) : products.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center"><p className="font-serif text-3xl">The next edit is on its way.</p><p className="mt-3 text-sm text-muted-foreground">No published pieces are available just yet. Return soon or speak with our studio.</p></div>
          ) : (
            <>
              <section aria-label="Studio edit" className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.22fr)_minmax(280px,0.78fr)]">
                {leadProduct && <ProductCard product={leadProduct} featured className="rounded-2xl bg-card p-2 shadow-soft sm:p-3" />}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                  {railProducts.map((product) => <ProductCard key={product.id} product={product} className="rounded-2xl bg-card p-2 shadow-soft sm:p-3" />)}
                  {railProducts.length < 2 && <div className="flex min-h-48 flex-col justify-end rounded-2xl bg-foreground p-6 text-background shadow-lift"><p className="text-[10px] uppercase tracking-[0.24em] text-gold">A room, considered</p><p className="mt-3 max-w-xs font-serif text-3xl leading-tight">Choose fewer things. Choose them well.</p><Link href="/book-consultation" className="mt-5 inline-flex min-h-11 w-fit items-center border-b border-gold pb-2 text-xs uppercase tracking-[0.16em] text-gold">Work with the studio</Link></div>}
                </div>
              </section>

              {remainingProducts.length > 0 && <section aria-label="All collection pieces" className="mt-20 border-t border-border/70 pt-10"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">The full edit</p><h2 className="mt-2 font-serif text-3xl text-foreground sm:text-4xl">For rooms in progress.</h2></div><span className="text-xs text-muted-foreground">{remainingProducts.length} more pieces</span></div><div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-16">{remainingProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
