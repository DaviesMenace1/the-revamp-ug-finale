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
                const images = (p.images as string[] ?? []).filter(Boolean)
                const mainImage = images[0] || DEFAULT_IMAGE

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
                        <span className="absolute top-3 left-3 bg-gold text-obsidian font-sans text-[10px] tracking-widest uppercase px-2.5 py-1 z-20">
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
                      <span className="font-sans text-sm text-foreground font-medium">
                        {formatPrice(p.price)}
                      </span>
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


// import Link from 'next/link'
// import type { Metadata } from 'next'
// import { SiteHeader } from '@/components/site-header'
// import { SiteFooter } from '@/components/site-footer'
// import { CollectionsBrowser } from '@/components/collections/collections-browser'

// export const metadata: Metadata = {
//   title: 'Collections | The Revamp UG',
//   description:
//     'Browse our curated collection of furniture, lighting, and décor. Filter by quick picks, by space, and by item type.',
// }

// export default function CollectionsPage() {
//   return (
//     <>
//       <SiteHeader />
//       <main className="min-h-screen bg-background">
//         {/* Hero */}
//         <section className="border-b border-border/20 bg-gradient-to-br from-background via-background to-muted/20 pt-28 md:pt-36 pb-12 md:pb-16">
//           <div className="mx-auto max-w-7xl px-6 md:px-8 space-y-6">
//             <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground">
//               Collections
//             </h1>
//             <p className="max-w-2xl text-lg text-muted-foreground font-light">
//               Curated furniture, lighting, and décor | Filter by quick picks, by the space you&apos;re
//               designing, or by the exact piece you need.
//             </p>
//           </div>
//         </section>

//         {/* Browser with URL-Synced 3-level filters */}
//         <section className="py-16 md:py-20">
//           <div className="mx-auto max-w-7xl px-6 md:px-8">
//             <CollectionsBrowser />
//           </div>
//         </section>

//         {/* Call To Action */}
//         <section className="border-t border-border/20 bg-muted/5 py-20 md:py-24">
//           <div className="mx-auto max-w-3xl px-6 md:px-8 text-center space-y-8">
//             <div className="space-y-4">
//               <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">
//                 Looking for something specific?
//               </h2>
//               <p className="text-lg text-muted-foreground font-light">
//                 Our sourcing team can find and customize any piece from around the world.
//               </p>
//             </div>
//             <Link
//               href="/book-consultation"
//               className="inline-block px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-light transition-colors"
//             >
//               Schedule a Consultation
//             </Link>
//           </div>
//         </section>
//       </main>
//       <SiteFooter />
//     </>
//   )
// }


// import Link from 'next/link'
// import type { Metadata } from 'next'
// import { SiteHeader } from '@/components/site-header'
// import { SiteFooter } from '@/components/site-footer'
// import { CollectionsBrowser } from '@/components/collections/collections-browser'

// export const metadata: Metadata = {
//   title: 'Collections',
//   description:
//     'Browse our curated collection of furniture, lighting, and décor , filter by quick picks, by space, and by item type.',
// }

// export default function CollectionsPage() {
//   return (
//     <>
//       <SiteHeader />
//       <main className="min-h-screen bg-background">
//         {/* Hero */}
//         <section className="border-b border-border/20 bg-gradient-to-br from-background via-background to-muted/20 pt-28 md:pt-36 pb-12 md:pb-16">
//           <div className="mx-auto max-w-7xl px-6 md:px-8 space-y-6">
//             <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground">
//               Collections
//             </h1>
//             <p className="max-w-2xl text-lg text-muted-foreground font-light">
//               Curated furniture, lighting, and décor | Filter by quick picks, by the space you&apos;re
//               designing, or by the exact piece you need.
//             </p>
//           </div>
//         </section>

//         {/* Browser with 3-level filters */}
//         <section className="py-16 md:py-20">
//           <div className="mx-auto max-w-7xl px-6 md:px-8">
//             <CollectionsBrowser />
//           </div>
//         </section>

//         {/* CTA */}
//         <section className="border-t border-border/20 bg-muted/5 py-20 md:py-24">
//           <div className="mx-auto max-w-3xl px-6 md:px-8 text-center space-y-8">
//             <div className="space-y-4">
//               <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">
//                 Looking for something specific?
//               </h2>
//               <p className="text-lg text-muted-foreground font-light">
//                 Our sourcing team can find and customize any piece from around the world
//               </p>
//             </div>
//             <Link
//               href="/book-consultation"
//               className="inline-block px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-light transition-colors"
//             >
//               Schedule a Consultation
//             </Link>
//           </div>
//         </section>
//       </main>
//       <SiteFooter />
//     </>
//   )
// }
