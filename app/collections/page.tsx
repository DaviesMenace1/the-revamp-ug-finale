import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import Link from 'next/link'
import PageLoadError from '@/components/system/page-load-error'
import { ProductCard } from '@/components/collections/product-card'
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
  const leadProduct = products.find((product) => product.featured) ?? products[0]
  const railProducts = products.filter((product) => product.id !== leadProduct?.id).slice(0, 2)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden bg-obsidian px-5 pb-14 pt-36 text-ivory sm:px-8 md:pb-20 md:pt-48 lg:px-16">
          <div className="absolute right-[-12%] top-[-30%] size-[40rem] rounded-full border border-gold/20" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-5xl motion-reveal"><p className="text-[10px] uppercase tracking-[0.3em] text-gold">The Revamp collection / current edit</p><h1 className="mt-5 max-w-4xl font-serif text-6xl font-light leading-[0.9] sm:text-8xl lg:text-[8rem]">Objects with presence.</h1><p className="mt-7 max-w-2xl text-base leading-7 text-ivory/65 sm:text-lg">Furniture, lighting, and accents chosen for rooms that are meant to be lived in rather than simply filled.</p></div>
            <div className="flex items-end gap-5 border-l border-gold/45 pl-5 text-sm text-ivory/60 lg:mb-2 lg:flex-col lg:items-start lg:gap-1"><span className="font-serif text-5xl text-ivory">{products.length.toString().padStart(2, '0')}</span><span className="max-w-[12rem] leading-6">Published pieces<br />East Africa · worldwide sourcing</span></div>
          </div>
        </section>

        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-16">
          {result.error ? <div className="my-12 flex min-h-64 items-center justify-center rounded-2xl border border-border/70 bg-card p-6"><PageLoadError title="The collection is taking longer than expected." message="We could not load the current edit. Your cart and saved pieces were not changed." /></div> : products.length === 0 ? <div className="my-12 rounded-2xl border border-dashed border-border p-12 text-center"><p className="font-serif text-3xl">The next edit is on its way.</p><p className="mt-3 text-sm text-muted-foreground">No published pieces are available just yet. Return soon or speak with our studio.</p></div> : <section aria-label="Studio edit" className="grid gap-5 border-b border-border/70 py-10 lg:grid-cols-[minmax(0,1.22fr)_minmax(280px,0.78fr)]">{leadProduct && <div className="motion-reveal"><ProductCard product={leadProduct} featured className="rounded-2xl bg-card p-2 shadow-soft sm:p-3" /></div>}<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">{railProducts.map((product, index) => <div key={product.id} className="motion-reveal" style={{ animationDelay: `${(index + 1) * 80}ms` }}><ProductCard product={product} className="rounded-2xl bg-card p-2 shadow-soft sm:p-3" /></div>)}{railProducts.length < 2 && <div className="flex min-h-48 flex-col justify-end rounded-2xl bg-foreground p-6 text-background shadow-lift"><p className="text-[10px] uppercase tracking-[0.24em] text-gold">A room, considered</p><p className="mt-3 max-w-xs font-serif text-3xl leading-tight">Choose fewer things. Choose them well.</p><Link href="/book-consultation" className="mt-5 inline-flex min-h-11 w-fit items-center border-b border-gold pb-2 text-xs uppercase tracking-[0.16em] text-gold">Work with the studio</Link></div>}</div></section>}
        </div>
        {!result.error && products.length > 0 && <CollectionsGrid products={products} />}
      </main>
      <SiteFooter />
    </>
  )
}
