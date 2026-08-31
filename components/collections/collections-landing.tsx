import type { Metadata } from 'next'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import PageLoadError from '@/components/system/page-load-error'
import { db } from '@/lib/db/client'
import { products as productsTable } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { safeQuery } from '@/lib/server/safe-query'
import CategoryDirectory from '@/components/collections/category-directory'
import { SchemaScript } from '@/components/seo/schema-script'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Furniture, Chairs and Sofas in Uganda',
  description: 'Explore The Revamp UG collection of chairs, sofas, tables, lighting, décor, and considered furniture for residential and commercial spaces.',
  keywords: ['chairs Uganda', 'sofas Uganda', 'furniture Kampala', 'interior décor Uganda', 'The Revamp UG collection'],
  alternates: { canonical: `${SITE_URL}/collections` },
  openGraph: { type: 'website', url: `${SITE_URL}/collections`, title: 'Furniture, Chairs and Sofas | The Revamp UG', description: 'Considered furniture, lighting, and interior objects sourced by The Revamp UG.' },
  twitter: { card: 'summary_large_image', title: 'Furniture, Chairs and Sofas | The Revamp UG', description: 'Considered furniture, lighting, and interior objects sourced by The Revamp UG.' },
}

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
  const categories = Array.from(products.reduce((map, product) => {
    const name = product.subCategory?.category?.name || product.subCategory?.name
    if (!name) return map
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const image = product.productImages?.find((entry) => entry.isPrimary)?.url || product.productImages?.[0]?.url || null
    const current = map.get(slug)
    map.set(slug, { name, slug, productCount: (current?.productCount || 0) + 1, image: current?.image || image })
    return map
  }, new Map<string, { name: string; slug: string; productCount: number; image: string | null }>()).values())
  const productItems = products.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: product.name,
    url: `${SITE_URL}/collections/${product.subCategory?.category?.name ? product.subCategory.category.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '/' : ''}${encodeURIComponent(product.slug)}`,
  }))

  return (
    <>
      <SchemaScript schema={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'The Revamp UG Collection', url: `${SITE_URL}/collections`, mainEntity: { '@type': 'ItemList', itemListElement: productItems } }} />
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
            <CategoryDirectory categories={categories} />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
