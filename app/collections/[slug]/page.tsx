import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductDetail, ProductReviews } from '@/components/collections/product-detail'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateBreadcrumbSchema, generateProductSchema } from '@/lib/seo/schema-generator'
import { DEFAULT_PRODUCT_IMAGE, formatMoney, normalizeCurrency, resolveProductImageUrls } from '@/lib/utils'

// Database & Drizzle Imports
import { db } from '@/lib/db/client'
import { products as productsTable } from '@/lib/db/schema'
import { eq, ne, and } from 'drizzle-orm'

export const dynamicParams = true
export const revalidate = 60

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

function extractProductImages(product: unknown): string[] {
  return resolveProductImageUrls(product)
}

async function getProductBySlugFromDB(slug: string) {
  try {
    return await db.query.products.findFirst({
      where: eq(productsTable.slug, slug),
      with: {
        productVariants: true,
        productImages: true,
        productReviews: true, // ✅ Attached customer reviews
      },
    })
  } catch (error) {
    console.error('Failed to fetch product by slug:', error)
    return null
  }
}

async function getRelatedProductsFromDB(subCategoryId: string | null, currentId: string) {
  try {
    if (!subCategoryId) return []
    return await db.query.products.findMany({
      where: and(
        eq(productsTable.subCategoryId, subCategoryId),
        ne(productsTable.id, currentId)
      ),
      with: {
        productImages: true,
      },
      limit: 4,
    })
  } catch {
    return []
  }
}

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlugFromDB(slug)

  if (!product) {
    return {
      title: 'Product Not Found | The Revamp UG',
      description: 'This product could not be found.',
    }
  }

  const images = extractProductImages(product)

  const canonical = `${SITE_URL}/collections/${encodeURIComponent(product.slug)}`
  return {
    title: `${product.name} | The Revamp UG`,
    description: product.description || product.name,
    alternates: { canonical },
    keywords: [product.name, product.googleProductCategoryPath, product.googleProductCategoryId].filter(
      (value): value is string => Boolean(value),
    ),
    openGraph: {
      title: product.name,
      description: product.description || product.name,
      type: 'website',
      url: canonical,
      images: images.map((url) => ({ url, width: 1200, height: 1200 })),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description || product.name,
      images: [images[0]],
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlugFromDB(slug)

  if (!product) notFound()

  // --- COMPREHENSIVE SANITIZATION & IMAGE RESOLUTION ---
  const safeImages = extractProductImages(product)

  const safeProductImages =
    Array.isArray(product.productImages) && product.productImages.length > 0
      ? product.productImages
      : safeImages.map((url, idx) => ({
          id: `default-img-${idx}`,
          productId: product.id,
          colorId: null,
          url,
          isPrimary: idx === 0,
          order: idx,
        }))

  const safeVariants = Array.isArray(product.productVariants) ? product.productVariants : []
  const safeColors = safeVariants.filter((v: any) => v.type === 'COLOR')
  const safeFabrics = safeVariants.filter((v: any) => v.type === 'FABRIC')

  // Numeric fields parsing
  const safeRating = typeof product.rating === 'number'
    ? product.rating
    : parseFloat(product.rating || '5.0')

  const safeRatingCount = typeof product.ratingCount === 'number'
    ? product.ratingCount
    : parseInt(product.ratingCount || '0', 10)

  // Safe Dimension Normalization
  const rawDims = (product as any).dimensions
  const safeDimensions = typeof rawDims === 'object' && rawDims !== null
    ? rawDims
    : {
        width: (product as any).width || (product as any).defaultWidth || '',
        height: (product as any).height || (product as any).defaultHeight || '',
        depth: (product as any).depth || (product as any).defaultDepth || '',
      }

  const safeProduct = {
    ...product,
    rating: Number.isNaN(safeRating) ? 5 : safeRating,
    ratingCount: Number.isNaN(safeRatingCount) ? 0 : safeRatingCount,
    images: safeImages,
    productImages: safeProductImages,
    variants: safeVariants,
    productVariants: safeVariants,
    colors: safeColors,
    fabrics: safeFabrics,
    reviews: Array.isArray((product as any).productReviews)
    ? (product as any).productReviews
    : Array.isArray((product as any).reviews)
    ? (product as any).reviews
    : [],
    tags: Array.isArray(product.tags) ? product.tags : [],
    options: Array.isArray((product as any).options) ? (product as any).options : [],
    specifications: Array.isArray((product as any).specifications) ? (product as any).specifications : [],
    dimensions: safeDimensions,
    tagline: product.description ?? '',
    currency: 'UGX',
  }
  // -------------------------------------------------------------

  const related = await getRelatedProductsFromDB(product.subCategoryId, product.id)
  const pageUrl = `${SITE_URL}/collections/${encodeURIComponent(product.slug)}`
  const availability = product.availability === 'out_of_stock' ? 'OutOfStock' : product.availability === 'pre_order' ? 'PreOrder' : product.availability === 'made_to_order' ? 'MadeToOrder' : 'InStock'
  const condition = product.condition === 'used' ? 'UsedCondition' : product.condition === 'refurbished' ? 'RefurbishedCondition' : 'NewCondition'

  const productSchema = generateProductSchema({
    name: product.name,
    description: product.description || '',
    price: parseFloat(product.price || '0'),
    currency: product.currency || 'UGX',
    images: safeImages,
    brand: product.brand || 'The Revamp UG',
    sku: product.sku,
    mpn: product.mpn,
    gtin: product.gtin,
    availability,
    condition,
    options: { url: pageUrl, image: safeImages[0] },
  })

  return (
    <>
      <SchemaScript schema={productSchema} />
      <SchemaScript schema={generateBreadcrumbSchema([
        { name: 'Home', url: `${SITE_URL}/` },
        { name: 'Collections', url: `${SITE_URL}/collections` },
        { name: product.name, url: pageUrl },
      ])} />
      <SiteHeader />
      <main className="min-h-screen bg-background">
        
        {/* Breadcrumb Navigation */}
        <div className="border-b border-border/20 pt-28 md:pt-32 pb-6">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 font-sans text-xs tracking-widest uppercase text-muted-foreground hover:text-gold transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Collections
            </Link>
          </div>
        </div>

        {/* Product Detail & Reviews Section */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            
            {/* The Main Product Details */}
            <ProductDetail product={safeProduct as any} />
            
            {/* The standalone Reviews component placed securely right underneath */}
            <div className="mt-20">
              <ProductReviews product={safeProduct as any} />
            </div>

          </div>
        </section>

        {/* Related Products Grid */}
        {related.length > 0 && (
          <section className="border-t border-border/20 py-16 md:py-20">
            <div className="mx-auto max-w-7xl px-6 md:px-8">
              <h2 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-10">
                You may also like
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
                {related.map((p) => {
                  const relImages = extractProductImages(p)
                  const thumb = relImages[0] || DEFAULT_PRODUCT_IMAGE

                  return (
                    <Link
                      key={p.id}
                      href={`/collections/${p.slug}`}
                      className="group relative bg-background overflow-hidden"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                        <Image
                          src={thumb}
                          alt={p.name}
                          fill
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/30 transition-colors duration-500 z-10" />
                      </div>
                      <div className="p-4 border-t border-border">
                        <h3 className="font-serif text-base font-light text-foreground group-hover:text-gold transition-colors leading-tight mb-1">
                          {p.name}
                        </h3>
                        <span className="font-sans text-sm text-foreground font-medium">
                          {formatMoney(p.price, normalizeCurrency(p.currency))}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  )
}