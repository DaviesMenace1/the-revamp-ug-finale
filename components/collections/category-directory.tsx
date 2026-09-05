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
  return <section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20" aria-labelledby="collection-categories-heading"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-6 border-b border-border pb-8 md:flex-row md:items-end"><div><p className="text-[10px] uppercase tracking-[0.3em] text-gilded">Shop by room</p><h2 id="collection-categories-heading" className="mt-3 font-serif text-4xl tracking-tight sm:text-6xl">Find your next piece.</h2></div><p className="max-w-md text-sm leading-6 text-muted-foreground md:text-right">Start with a room, a material, or a mood. Each edit gathers pieces currently available through the studio.</p></div><div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4 lg:gap-x-6">{categories.map((category, index) => <Link key={category.slug} href={`/collections/${category.slug}`} className="group min-w-0" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>{category.image ? <div className="relative aspect-[4/5] overflow-hidden bg-muted"><Image src={category.image} alt={category.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" /></div> : <div className="flex aspect-[4/5] items-center justify-center bg-muted text-gilded"><PackageOpen className="size-10" aria-hidden="true" /></div>}<div className="mt-4 flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.2em] text-gilded">{category.productCount} {category.productCount === 1 ? 'piece' : 'pieces'}</p><h3 className="mt-2 font-serif text-2xl leading-none sm:text-3xl">{category.name}</h3>{category.subcategories.length > 0 && <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{category.subcategories.slice(0, 3).map((subcategory) => subcategory.name).join(' · ')}</p>}</div><ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gilded" aria-hidden="true" /></div></Link>)}</div></div></section>
}
