import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductDetail, ProductReviews } from '@/components/collections/product-detail'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateProductSchema } from '@/lib/seo/schema-generator'

// Database & Drizzle Imports
import { db } from '@/lib/db/client'
import { products as productsTable } from '@/lib/db/schema'
import { eq, ne, and } from 'drizzle-orm'

export const dynamicParams = true
export const revalidate = 60

const DEFAULT_IMAGE = 'https://therevampug.com/default-thumb.png'

const formatPrice = (price: string | number, currency = 'USD') => {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num || 0)
}

async function getProductBySlugFromDB(slug: string) {
  try {
    return await db.query.products.findFirst({
      where: eq(productsTable.slug, slug),
      with: {
        variants: true,
        productImages: true,
      },
    })
  } catch (error) {
    console.error('Failed to fetch product by slug:', error)
    return null
  }
}

async function getRelatedProductsFromDB(category: string, currentId: string) {
  try {
    return await db.query.products.findMany({
      where: and(
        eq(productsTable.category, category),
        ne(productsTable.id, currentId)
      ),
      limit: 4,
    })
  } catch (error) {
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

  const rawImages = (product.images as string[] ?? []).filter(Boolean)
  const images = rawImages.length > 0 ? rawImages : [DEFAULT_IMAGE]

  return {
    title: `${product.name} | The Revamp UG`,
    description: product.description || product.name,
    keywords: [product.name, product.category].filter(Boolean) as string[],
    openGraph: {
      title: product.name,
      description: product.description || product.name,
      type: 'website',
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

  // --- COMPREHENSIVE SANITIZATION & DIMENSION NORMALIZATION ---
  const rawImages = (product.images as string[] ?? []).filter(Boolean)
  const safeImages = rawImages.length > 0 ? rawImages : [DEFAULT_IMAGE]

  const safeProductImages =
    Array.isArray(product.productImages) && product.productImages.length > 0
      ? product.productImages
      : [
          {
            id: 'default-img-0',
            productId: product.id,
            colorId: null,
            url: safeImages[0],
            isPrimary: true,
            order: 0,
          },
        ]

  const safeVariants = Array.isArray(product.variants) ? product.variants : []
  const safeColors = safeVariants.filter((v: any) => v.type === 'COLOR')
  const safeFabrics = safeVariants.filter((v: any) => v.type === 'FABRIC')

  // Numeric fields parsing
  const safeRating = typeof product.rating === 'number' 
    ? product.rating 
    : parseFloat(product.rating || '0')

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
    rating: Number.isNaN(safeRating) ? 0 : safeRating,
    ratingCount: Number.isNaN(safeRatingCount) ? 0 : safeRatingCount,
    images: safeImages,
    productImages: safeProductImages,
    variants: safeVariants,
    colors: safeColors.length > 0 ? safeColors : [{ id: 'default-col', label: 'Standard', value: '#1C1C1C' }],
    fabrics: safeFabrics,
    reviews: Array.isArray((product as any).reviews) ? (product as any).reviews : [],
    tags: Array.isArray(product.tags) ? product.tags : [],
    relatedProducts: Array.isArray(product.relatedProducts) ? product.relatedProducts : [],
    options: Array.isArray((product as any).options) ? (product as any).options : [],
    specifications: Array.isArray((product as any).specifications) ? (product as any).specifications : [],
    dimensions: safeDimensions,
    tagline: product.description ?? '',
    currency: 'USD',
  }
  // -------------------------------------------------------------

  const related = await getRelatedProductsFromDB(product.category, product.id)
  const pageUrl = `https://therevampug.com/collections/${product.slug}`

  const productSchema = generateProductSchema({
    name: product.name,
    description: product.description || '',
    price: parseFloat(product.price || '0'),
    currency: 'USD',
    images: safeImages,
    options: { url: pageUrl, image: safeImages[0] },
  })

  return (
    <>
      <SchemaScript schema={productSchema} />
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

        {/* Product Detail Section */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <ProductDetail product={safeProduct as any} />
          </div>
        </section>

        {/* Reviews Section */}
        <section className="border-t border-border/20 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <ProductReviews product={safeProduct as any} />
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
                  const relImages = (p.images as string[] ?? []).filter(Boolean)
                  const thumb = relImages[0] || DEFAULT_IMAGE

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
                          {formatPrice(p.price)}
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






// import Link from 'next/link'
// import { notFound } from 'next/navigation'
// import type { Metadata } from 'next'
// import { ArrowLeft } from 'lucide-react'
// import { SiteHeader } from '@/components/site-header'
// import { SiteFooter } from '@/components/site-footer'
// import { ProductDetail, ProductReviews } from '@/components/collections/product-detail'
// import { SchemaScript } from '@/components/seo/schema-script'
// import { generateProductSchema } from '@/lib/seo/schema-generator'
// import {
//   products,
//   getProductBySlug,
//   getRelatedProducts,
//   isNewArrival,
//   formatPrice,
// } from '@/lib/data/products'

// export function generateStaticParams() {
//   return products.map((p) => ({ slug: p.slug }))
// }

// export async function generateMetadata({
//   params,
// }: {
//   params: Promise<{ slug: string }>
// }): Promise<Metadata> {
//   const { slug } = await params
//   const product = getProductBySlug(slug)
//   if (!product) {
//     return {
//       title: 'Product Not Found',
//       description: 'This product could not be found',
//     }
//   }

//   // Defensive: ensure images is always an array of strings
//   const images = (product.images ?? []).filter(Boolean)

//   const openGraphImages = images.length
//     ? images.map((img: string) => ({ url: String(img), width: 1200, height: 1200 }))
//     : [{ url: 'https://therevampug.com/default-og.png', width: 1200, height: 1200 }]

//   return {
//     title: `${product.name} | The Revamp UG`,
//     description: product.tagline || product.description,
//     keywords: [product.name, product.category, (product as any).subCategory].filter(Boolean),
//     openGraph: {
//       title: product.name,
//       description: product.tagline || product.description,
//       // Next.js OpenGraph type must be one of the supported types — use 'website' instead of custom 'product'
//       type: 'website',
//       images: openGraphImages,
//     },
//     twitter: {
//       card: 'summary_large_image',
//       title: product.name,
//       description: product.tagline || product.description,
//       images: images.length ? [images[0]] : ['https://therevampug.com/default-twitter.png'],
//     },
//   }
// }

// export default async function ProductPage({
//   params,
// }: {
//   params: Promise<{ slug: string }>
// }) {
//   const { slug } = await params
//   const product = getProductBySlug(slug)
//   if (!product) notFound()

//   const related = getRelatedProducts(product)

//   // Defensive: ensure images array
//   const images = (product.images ?? []).filter(Boolean)
//   const pageUrl = `https://therevampug.com/collections/${product.slug}`

//   // Use object-style call (schema-generator supports it) and provide fallbacks
//   const productSchema = generateProductSchema({
//     name: product.name,
//     description: product.description,
//     price: product.price,
//     currency: product.currency || 'USD',
//     images,
//     options: { url: pageUrl, image: images[0] },
//   })

//   return (
//     <>
//       <SchemaScript schema={productSchema} />
//       <SiteHeader />
//       <main className="min-h-screen bg-background">
//         {/* Breadcrumb */}
//         <div className="border-b border-border/20 pt-28 md:pt-32 pb-6">
//           <div className="mx-auto max-w-7xl px-6 md:px-8">
//             <Link
//               href="/collections"
//               className="inline-flex items-center gap-2 font-sans text-xs tracking-widest uppercase text-muted-foreground hover:text-gold transition-colors"
//             >
//               <ArrowLeft size={14} />
//               Back to Collections
//             </Link>
//           </div>
//         </div>

//         {/* Product */}
//         <section className="py-12 md:py-16">
//           <div className="mx-auto max-w-7xl px-6 md:px-8">
//             <ProductDetail product={product} />
//           </div>
//         </section>

//         {/* Reviews */}
//         <section className="border-t border-border/20 py-16 md:py-20">
//           <div className="mx-auto max-w-7xl px-6 md:px-8">
//             <ProductReviews product={product} />
//           </div>
//         </section>

//         {/* Related */}
//         {related.length > 0 && (
//           <section className="border-t border-border/20 py-16 md:py-20">
//             <div className="mx-auto max-w-7xl px-6 md:px-8">
//               <h2 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-10">
//                 You may also like
//               </h2>
//               <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
//                 {related.map((p) => (
//                   <Link
//                     key={p.id}
//                     href={`/collections/${p.slug}`}
//                     className="group relative bg-background overflow-hidden"
//                   >
//                     <div className="relative aspect-[3/4] overflow-hidden">
//                       <div
//                         className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
//                         style={{ backgroundImage: `url('${p.images?.[0] ?? 'https://therevampug.com/default-thumb.png'}')` }}
//                         role="img"
//                         aria-label={p.name}
//                       />
//                       <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/30 transition-colors duration-500" />
//                       {isNewArrival(p) && (
//                         <span className="absolute top-3 left-3 bg-gold text-obsidian font-sans text-[10px] tracking-widest uppercase px-2.5 py-1">
//                           New Arrivals
//                         </span>
//                       )}
//                     </div>
//                     <div className="p-4 border-t border-border">
//                       <h3 className="font-serif text-base font-light text-foreground group-hover:text-gold transition-colors leading-tight mb-1">
//                         {p.name}
//                       </h3>
//                       <span className="font-sans text-sm text-foreground font-medium">
//                         {formatPrice(p.price, p.currency)}
//                       </span>
//                     </div>
//                   </Link>
//                 ))}
//               </div>
//             </div>
//           </section>
//         )}
//       </main>
//       <SiteFooter />
//     </>
//   )
// }
