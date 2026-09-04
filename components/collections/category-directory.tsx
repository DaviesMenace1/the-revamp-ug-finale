'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, PackageOpen } from '@/components/ui/luxury-icons'

export type CollectionCategory = {
  name: string
  slug: string
  productCount: number
  image: string | null
  subcategories: Array<{ name: string; slug: string; productCount: number; image: string | null }>
}

export default function CategoryDirectory({ categories }: { categories: CollectionCategory[] }) {
  return (
    <section className="px-4 py-10 sm:px-8 sm:py-16 lg:px-16 lg:py-20" aria-labelledby="collection-categories-heading">
      <div className="mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Browse by category</p>
          <h2 id="collection-categories-heading" className="mt-3 font-serif text-4xl tracking-tight sm:text-6xl">Find your next piece.</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">Start with a room, a material, or a mood. Each category opens a focused edit of the pieces currently available.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {categories.map((category, index) => (
            <Link key={category.slug} href={`/collections/${category.slug}`} className="group relative isolate min-h-[17rem] overflow-hidden rounded-xl border border-border/80 bg-card shadow-lift transition-all duration-500 hover:-translate-y-1 hover:border-primary/60 hover:shadow-editorial focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
              {category.image ? <Image src={category.image} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="absolute inset-0 flex items-center justify-center bg-muted text-primary"><PackageOpen className="size-10" aria-hidden="true" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-background sm:p-6">
                <p className="text-[10px] uppercase tracking-[0.24em] text-background/70">{category.productCount} {category.productCount === 1 ? 'piece' : 'pieces'}</p>
                <div className="mt-2 flex items-end justify-between gap-4"><h3 className="font-serif text-3xl leading-none sm:text-4xl">{category.name}</h3><ArrowUpRight className="size-5 shrink-0 translate-y-1 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /></div>
                {category.subcategories.length > 0 && <p className="mt-3 max-w-[18rem] text-xs leading-5 text-background/70">{category.subcategories.slice(0, 4).map((subcategory) => subcategory.name).join(' · ')}{category.subcategories.length > 4 ? ' · more' : ''}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
