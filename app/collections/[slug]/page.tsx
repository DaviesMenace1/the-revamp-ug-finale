import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductDetail, ProductReviews } from '@/components/collections/product-detail'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateProductSchema } from '@/lib/seo/schema-generator'
import {
  products,
  getProductBySlug,
  getRelatedProducts,
  isNewArrival,
  formatPrice,
} from '@/lib/data/products'

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'This product could not be found',
    }
  }
  return {
    title: `${product.name} | The Revamp UG`,
    description: product.tagline || product.description,
    keywords: [product.name, product.category, product.subCategory],
    openGraph: {
      title: product.name,
      description: product.tagline || product.description,
      type: 'product',
      images: product.images.map((img: string) => ({
        url: img,
        width: 1200,
        height: 1200,
      })),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.tagline,
      images: [product.images[0]],
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) notFound()

  const related = getRelatedProducts(product)

  const productSchema = generateProductSchema({
    name: product.name,
    description: product.description,
    image: product.images[0],
    price: product.price,
    currency: 'USD',
    inStock: product.inStock,
  })

  return (
    <>
      <SchemaScript schema={productSchema} />
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
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

        {/* Product */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <ProductDetail product={product} />
          </div>
        </section>

        {/* Reviews */}
        <section className="border-t border-border/20 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <ProductReviews product={product} />
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="border-t border-border/20 py-16 md:py-20">
            <div className="mx-auto max-w-7xl px-6 md:px-8">
              <h2 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-10">
                You may also like
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    href={`/collections/${p.slug}`}
                    className="group relative bg-background overflow-hidden"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url('${p.images[0]}')` }}
                        role="img"
                        aria-label={p.name}
                      />
                      <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/30 transition-colors duration-500" />
                      {isNewArrival(p) && (
                        <span className="absolute top-3 left-3 bg-gold text-obsidian font-sans text-[10px] tracking-widest uppercase px-2.5 py-1">
                          New Arrivals
                        </span>
                      )}
                    </div>
                    <div className="p-4 border-t border-border">
                      <h3 className="font-serif text-base font-light text-foreground group-hover:text-gold transition-colors leading-tight mb-1">
                        {p.name}
                      </h3>
                      <span className="font-sans text-sm text-foreground font-medium">
                        {formatPrice(p.price, p.currency)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
