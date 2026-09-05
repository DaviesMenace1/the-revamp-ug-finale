'use client'

import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

type Article = { id: string; slug: string; title: string; excerpt: string | null; category: string | null; author: string | null; date: string; readTime: string; imageUrl: string | null }

export default function JournalListingClient({ articles = [] }: { articles: Article[] }) {
  return <><SiteHeader /><main className="bg-canvas"><section className="px-6 pb-10 pt-16 lg:px-12"><div className="mx-auto max-w-7xl"><p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gilded">Journal</p><h1 className="mt-5 font-serif text-5xl font-medium leading-[1.05] md:text-7xl">Field notes from the studio.</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">Dispatches from ateliers, essays on craft, and the stories behind the pieces we source.</p></div></section>{articles.length === 0 ? <section className="px-6 pb-24 lg:px-12"><div className="mx-auto max-w-7xl border-t border-border pt-12 text-center"><p className="font-serif text-3xl">The first entries are being prepared.</p><p className="mt-3 text-sm text-muted-foreground">Please check back soon.</p></div></section> : <section className="px-6 pb-24 lg:px-12"><div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <Link key={article.id} href={`/journal/${encodeURIComponent(article.slug)}`} className="group"><div className="relative mb-5 aspect-[4/5] overflow-hidden rounded-md bg-muted">{article.imageUrl && <Image src={article.imageUrl} alt={article.title} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.02]" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />}</div><p className="text-[10px] uppercase tracking-[0.25em] text-gilded">{article.category || 'Journal'}</p><h2 className="mt-2 font-serif text-2xl font-medium leading-tight group-hover:text-gilded">{article.title}</h2>{article.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>}</Link>)}</div></section>}</main><SiteFooter /></>
}
