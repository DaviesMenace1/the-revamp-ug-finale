'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, PackageOpen } from '@/components/ui/luxury-icons'

export type CollectionCategory = {
  name: string
  slug: string
  productCount: number
  image: string | null
  subcategories: Array<{ name: string; slug: string; productCount: number; image: string | null }>
}

export default function CategoryDirectory({ categories }: { categories: CollectionCategory[] }) {
  return <section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20" aria-labelledby="collection-categories-heading"><div className="mx-auto max-w-[1440px]"><div className="mb-10 flex items-end justify-between gap-6 border-b border-border pb-6"><div><p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">The collection</p><h2 id="collection-categories-heading" className="mt-4 font-serif text-5xl leading-[0.9] sm:text-6xl">Objects for refined living.</h2></div><p className="hidden max-w-sm text-right text-sm leading-6 text-muted-foreground md:block">A considered edit of furniture, lighting, décor, and objects for every room in the home.</p></div><div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">{categories.map((category, index) => <Link key={category.slug} href={`/collections/${category.slug}`} className={`group min-w-0 ${index === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}`}><div className="relative aspect-[4/5] overflow-hidden bg-muted">{category.image ? <Image src={category.image} alt={category.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 66vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-primary"><PackageOpen className="size-8" /></div>}<div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6"><p className="text-[9px] uppercase tracking-[0.2em] text-white/70">{category.productCount} {category.productCount === 1 ? 'piece' : 'pieces'}</p><h3 className="mt-2 font-serif text-3xl leading-none sm:text-4xl">{category.name}</h3><span className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] opacity-0 transition group-hover:opacity-100">Explore <ArrowRight className="size-3" /></span></div></div><div className="mt-3 flex items-center justify-between gap-3 sm:hidden"><span className="text-xs text-muted-foreground">{category.subcategories.slice(0, 2).map((item) => item.name).join(', ')}</span><ArrowUpRight className="size-4 text-muted-foreground" /></div></Link>)}</div><div className="mt-12 grid gap-4 bg-obsidian text-ivory sm:grid-cols-[1.1fr_0.9fr]"><div className="flex min-h-52 flex-col justify-center p-7 sm:p-10"><p className="text-[10px] uppercase tracking-[0.24em] text-ivory/55">Bespoke pieces. Global brands.</p><h3 className="mt-4 max-w-md font-serif text-4xl leading-none sm:text-5xl">One extraordinary collection.</h3><Link href="/source-with-revamp" className="mt-7 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] underline underline-offset-4">Learn more <ArrowRight className="size-3" /></Link></div><div className="relative min-h-52"><Image src="/prototype/process-1.jpg" alt="Bespoke craftsmanship" fill className="object-cover opacity-75" /></div></div></div></section>
}
