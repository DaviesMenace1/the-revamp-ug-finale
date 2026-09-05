'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Search } from '@/components/ui/luxury-icons'
import { DEFAULT_PRODUCT_IMAGE, resolveProductImageUrls } from '@/lib/utils'

type ProductRecord = {
  id: string
  name: string
  slug: string
  description: string | null
  tags?: unknown
  ogImage?: string | null
  thumbnailImage?: string | null
  images?: unknown
  gallery?: unknown
  productImages?: Array<{ url: string; isPrimary: boolean; displayOrder: number }>
}

type ProjectRecord = {
  id: string
  title: string
  slug: string
  description: string | null
  shortDescription: string | null
  category: string | null
  location: string | null
  year: string | null
  thumbnailImage: string | null
  ogImage: string | null
  images: unknown
  gallery: unknown
  featured: boolean | null
}

type ArticleRecord = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: string | null
  featuredImage: string | null
  seoDescription: string | null
}

type ServiceRecord = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  ogImage: string | null
  categoryId: string
  category: { slug: string; name: string } | null
}

export type SearchData = {
  products: ProductRecord[]
  projects: ProjectRecord[]
  articles: ArticleRecord[]
  services: ServiceRecord[]
}

type SearchResult = {
  id: string
  title: string
  description: string
  image: string
  href: string
  type: 'Products' | 'Projects' | 'Journal' | 'Services'
  eyebrow?: string | null
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []
}

function imageFrom(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value
    const list = stringList(value)
    if (list[0]) return list[0]
  }
  return DEFAULT_PRODUCT_IMAGE
}

export default function SearchClient({ data, loadError }: { data: SearchData; loadError?: string | null }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<SearchResult['type'] | 'All'>('All')

  const results = useMemo<SearchResult[]>(() => {
    const all: SearchResult[] = [
      ...data.products.map((item) => ({
        id: item.id,
        title: item.name,
        description: item.description || 'Explore this piece from the current Revamp edit.',
        image: resolveProductImageUrls(item)[0],
        href: `/collections/${item.slug}`,
        type: 'Products' as const,
        eyebrow: ["Object / Collection", ...stringList(item.tags)].join(' · '),
      })),
      ...data.projects.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.shortDescription || item.description || 'Explore this Revamp studio project.',
        image: imageFrom(item.thumbnailImage, item.ogImage, item.images, item.gallery),
        href: `/portfolio/${item.slug}`,
        type: 'Projects' as const,
        eyebrow: [item.category, item.location, item.year].filter(Boolean).join(' · '),
      })),
      ...data.articles.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.excerpt || item.seoDescription || 'Read the latest from The Revamp journal.',
        image: imageFrom(item.featuredImage),
        href: `/journal/${item.slug}`,
        type: 'Journal' as const,
        eyebrow: item.category || 'Journal',
      })),
      ...data.services.map((item) => ({
        id: item.id,
        title: item.name,
        description: item.description || 'Work with The Revamp studio on a considered interior.',
        image: imageFrom(item.image, item.ogImage),
        href: `/services/${item.category?.slug || 'services'}/${item.slug}`,
        type: 'Services' as const,
        eyebrow: item.category?.name || 'Studio service',
      })),
    ]

    const needle = query.trim().toLowerCase()
    return all.filter((item) => {
      const matchesFilter = filter === 'All' || item.type === filter
      const searchable = `${item.title} ${item.description} ${item.eyebrow || ''}`.toLowerCase()
      return matchesFilter && (!needle || searchable.includes(needle))
    })
  }, [data, filter, query])

  const filters: Array<SearchResult['type'] | 'All'> = ['All', 'Products', 'Projects', 'Journal', 'Services']

  return (
    <div className="min-h-screen bg-obsidian text-ivory">
      <section className="border-b border-ivory/15 px-5 pb-14 pt-28 sm:px-8 md:pb-20 md:pt-40 lg:px-16">
        <div className="mx-auto max-w-[1440px]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gilded">Explore The Revamp UG</p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl font-light leading-[0.94] sm:text-7xl lg:text-[7rem]">Search the collection.</h1>
          <div className="mt-12 flex items-center gap-4 border-b border-ivory/35 pb-4">
            <Search className="size-5 shrink-0 text-ivory/55" aria-hidden="true" />
            <label htmlFor="site-search" className="sr-only">Search projects, products, journal, and services</label>
            <input id="site-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects, products, journal..." className="w-full bg-transparent font-sans text-lg text-ivory outline-none placeholder:text-ivory/45" autoFocus />
          </div>
          <div className="mt-8 flex flex-wrap gap-3" role="group" aria-label="Search result filters">
            {filters.map((item) => (
              <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={`min-h-11 border px-5 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${filter === item ? 'border-ivory bg-ivory text-obsidian' : 'border-ivory/20 text-ivory/65 hover:border-gold hover:text-ivory'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 md:py-16 lg:px-16">
        <div className="mx-auto max-w-[1440px]">
          {loadError && <p role="status" className="mb-8 border border-gold/40 bg-gold/10 p-4 text-sm text-ivory/80">Some live sources are temporarily unavailable. Search is showing every source that loaded successfully.</p>}
          <div className="flex items-end justify-between gap-4">
            <p className="text-sm text-ivory/55">{results.length} {results.length === 1 ? 'result' : 'results'}</p>
            {query && <p className="text-xs uppercase tracking-[0.16em] text-gold">Results for “{query}”</p>}
          </div>
          {results.length > 0 ? (
            <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-12">
              {results.map((result, index) => (
                <Link key={`${result.type}-${result.id}`} href={result.href} className={`group block ${index % 7 === 0 ? 'lg:col-span-7' : index % 5 === 0 ? 'lg:col-span-5' : 'lg:col-span-4'}`}>
                  <article>
                    <div className={`relative overflow-hidden bg-ivory/10 ${index % 7 === 0 ? 'aspect-[5/4]' : index % 5 === 0 ? 'aspect-[4/5]' : 'aspect-[4/3]'}`}>
                      <img src={result.image || DEFAULT_PRODUCT_IMAGE} alt="" loading={index < 3 ? 'eager' : 'lazy'} className="size-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]" />
                      <span className="absolute inset-0 bg-obsidian/0 transition-colors duration-500 group-hover:bg-obsidian/15" />
                    </div>
                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gold">{result.type}</p>
                        <h2 className="mt-2 font-serif text-2xl font-light text-ivory transition-colors group-hover:text-gold">{result.title}</h2>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-ivory/55">{result.eyebrow || result.description}</p>
                      </div>
                      <ArrowUpRight className="mt-1 size-5 shrink-0 text-ivory/50 transition duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-gold" aria-hidden="true" />
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-12 border-y border-ivory/15 py-16"><p className="font-serif text-3xl font-light text-ivory/65">No live results yet.</p><p className="mt-3 text-sm text-ivory/45">Try a different phrase or explore the full collection.</p></div>
          )}
        </div>
      </section>
    </div>
  )
}
