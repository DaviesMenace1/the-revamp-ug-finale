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
    const category = product.subCategory?.category
    const subCategory = product.subCategory
    const name = category?.name || subCategory?.name
    if (!name) return map
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const image = product.productImages?.find((entry) => entry.isPrimary)?.url || product.productImages?.[0]?.url || null
    const current = map.get(slug)
    const subSlug = subCategory?.slug || subCategory?.name?.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const subcategories = current?.subcategories || []
    const existingSubcategory = subSlug ? subcategories.find((item) => item.slug === subSlug) : undefined
    if (subSlug && existingSubcategory) existingSubcategory.productCount += 1
    else if (subSlug) subcategories.push({ name: subCategory?.name || 'Collection', slug: subSlug, productCount: 1, image })
    map.set(slug, { name, slug, productCount: (current?.productCount || 0) + 1, image: current?.image || image, subcategories })
    return map
  }, new Map<string, { name: string; slug: string; productCount: number; image: string | null; subcategories: Array<{ name: string; slug: string; productCount: number; image: string | null }> }>()).values())
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
      <main className="min-h-screen bg-canvas text-obsidian">
        <section className="border-b border-border bg-canvas px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-24 lg:px-12 lg:pt-28">
          <div className="mx-auto max-w-7xl text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gilded">The Revamp collection / current edit</p>
            <h1 className="mx-auto mt-5 max-w-5xl font-serif text-5xl font-light leading-[0.94] sm:text-7xl lg:text-[7rem]">Furniture with presence.</h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Furniture, lighting, and accents chosen for rooms that are meant to be lived in rather than simply filled.</p>
            <div className="mx-auto mt-10 flex max-w-2xl items-center rounded-sm border border-border bg-white px-4 py-3 text-left shadow-sm"><span className="flex-1 text-sm text-muted-foreground">Search the collection</span><span className="text-[10px] uppercase tracking-[0.18em] text-gilded">{products.length} pieces</span></div>
          </div>
        </section>

        <div className="mx-auto max-w-[1440px]">
          {result.error ? (
              <div className="mx-5 my-12 flex min-h-64 items-center justify-center rounded-md border border-border bg-canvas p-6 sm:mx-8 lg:mx-16">
              <PageLoadError title="The collection is taking longer than expected." message="We could not load the current edit. Your cart and saved pieces were not changed." />
            </div>
          ) : products.length === 0 ? (
            <div className="mx-5 my-12 rounded-md border border-dashed border-border p-12 text-center sm:mx-8 lg:mx-16">
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
