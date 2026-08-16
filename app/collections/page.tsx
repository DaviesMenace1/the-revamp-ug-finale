// app/collections/page.tsx

import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

// Database & Drizzle
import { db } from '@/lib/db/client'
import { products as productsTable } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

// Force Next.js to fetch fresh database data on every request (or revalidate dynamically)
export const dynamic = 'force-dynamic'

const DEFAULT_IMAGE = 'https://therevampug.com/default-thumb.png'

const formatPrice = (price: string | number, currency = 'USD') => {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num || 0)
}

async function getPublishedProducts() {
  try {
    return await db.query.products.findMany({
      where: eq(productsTable.status, 'published'),
      orderBy: [desc(productsTable.createdAt)],
      with: {
        productImages: true,
        productVariants: true,
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
              {products.map((p) => {
  // Safe image extraction
  const imagesFromRelation = Array.isArray((p as any).productImages)
    ? (p as any).productImages.map((img: any) => img?.url).filter(Boolean)
    : []

  const imagesFromField = Array.isArray((p as any).images)
    ? (p as any).images.filter(Boolean)
    : []

  const images = imagesFromRelation.length > 0 ? imagesFromRelation : imagesFromField
  const mainImage = images[0] || DEFAULT_IMAGE

  const currentPrice = parseFloat(String(p.price || '0'))
  const comparePrice = (p as any).compareAtPrice
    ? parseFloat(String((p as any).compareAtPrice))
    : (p as any).originalPrice
    ? parseFloat(String((p as any).originalPrice))
    : null

  return (
    <Link
      key={p.id}
      href={`/collections/${p.slug}`}
      className="group relative bg-background overflow-hidden"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Image
          src={mainImage}
          alt={p.name}
          fill
          sizes="(max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/30 transition-colors duration-500 z-10" />
        {p.featured && (
          <span className="absolute top-3 left-3 bg-gold text-obsidian font-sans text-[10px] tracking-widest uppercase px-2.5 py-1 z-25">
            Featured
          </span>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <span className="text-[10px] uppercase font-semibold text-amber-700 block mb-1">
          {p.category}
        </span>
        <h3 className="font-serif text-base font-light text-foreground group-hover:text-gold transition-colors leading-tight mb-1">
          {p.name}
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="font-sans text-sm text-foreground font-medium">
            {formatPrice(currentPrice, (p as any).currency || 'USD')}
          </span>

          {comparePrice && comparePrice > currentPrice && (
            <span className="font-sans text-xs text-muted-foreground line-through">
              {formatPrice(comparePrice, (p as any).currency || 'USD')}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
})}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
