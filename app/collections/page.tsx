// app/collections/page.tsx

import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductCard } from '@/components/collections/product-card'

// Database & Drizzle
import { db } from '@/lib/db/client'
import { products as productsTable } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

// Force Next.js to fetch fresh database data on every request (or revalidate dynamically)
export const dynamic = 'force-dynamic'

async function getPublishedProducts() {
  try {
    return await db.query.products.findMany({
      where: eq(productsTable.status, 'published'),
      orderBy: [desc(productsTable.createdAt)],
      with: {
        productImages: true,
        productVariants: true,
        subCategory: {
          with: {
            category: true,
          },
        },
      },
    })
  } catch (error) {
    console.error('Error fetching collection products:', error)
    return []
  }
}

export default async function CollectionsPage() {
  const products = await getPublishedProducts()

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background pt-28 md:pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-light tracking-tight text-foreground">
              Collections
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Explore our curated selection of luxury home furnishings and bespoke accents.
            </p>
          </div>

          {/* Grid */}
          {products.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border">
              <p className="text-muted-foreground">No products found in the collection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
