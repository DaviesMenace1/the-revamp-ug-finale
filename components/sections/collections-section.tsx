import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { db } from '@/lib/db/client'
import { products } from '@/lib/db/schema'
import { ProductCard } from '@/components/collections/product-card'
import { desc, eq } from 'drizzle-orm'

export async function CollectionsSection() {
  let items: any[] = []
  try {
    items = await db.query.products.findMany({
      where: eq(products.status, 'published'),
      orderBy: [desc(products.featured), desc(products.createdAt)],
      with: {
        productImages: true,
        productVariants: true,
        subCategory: { with: { category: true } },
      },
      limit: 8,
    })
  } catch (error) {
    console.error('Failed to fetch published homepage products:', error)
  }

  if (!items.length) return null

  return (
    <section className="section-pad bg-background">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-16">
        <div className="mb-10 flex flex-col gap-6 border-b border-border/70 pb-7 md:flex-row md:items-end md:justify-between">
          <div><p className="text-[10px] uppercase tracking-[0.28em] text-primary">The current edit</p><h2 className="mt-3 font-serif text-4xl font-light leading-tight sm:text-6xl">Objects with presence.</h2><p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Furniture, lighting, and accents chosen for rooms that are meant to be lived in.</p></div>
          <Link href="/collections" className="group inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.16em] text-primary transition-colors hover:text-gold">Browse the full collection<ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></Link>
        </div>
        <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">{items.map((item, index) => <ProductCard key={item.id} product={item} featured={index === 0} className={index === 0 ? 'lg:col-span-2' : ''} />)}</div>
      </div>
    </section>
  )
}
