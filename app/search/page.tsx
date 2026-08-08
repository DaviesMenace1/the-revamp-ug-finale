'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ArrowUpRight } from 'lucide-react'
import { products } from '@/lib/data/products'
import { projects } from '@/lib/data/projects'
import { blogs } from '@/lib/data/blogs'
import { SERVICE_CATEGORIES } from '@/lib/data/services'

const serviceResults = SERVICE_CATEGORIES.flatMap((category) =>
  category.services.map((service) => ({
    id: service.slug,
    title: service.name,
    description: category.description,
    image: undefined,
    href: `/services/${category.slug}/${service.slug}`,
    type: 'Services' as const,
  })),
)

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const all = [
      ...products.map((item) => ({ id: item.id, title: item.name, description: item.description, image: item.images[0], href: `/collections/${item.slug}`, type: 'Products' as const })),
      ...projects.map((item) => ({ id: item.id, title: item.name, description: item.shortDescription, image: item.images[0], href: `/portfolio/${item.slug}`, type: 'Projects' as const })),
      ...blogs.filter((item) => item.status === 'published').map((item) => ({ id: item.id, title: item.title, description: item.excerpt, image: item.image, href: `/journal/${item.slug}`, type: 'Journal' as const })),
      ...serviceResults,
    ]
    return all.filter((item) => {
      const matchesFilter = filter === 'All' || item.type === filter
      const matchesQuery = !needle || `${item.title} ${item.description}`.toLowerCase().includes(needle)
      return matchesFilter && matchesQuery
    })
  }, [filter, query])

  const filters = ['All', 'Products', 'Projects', 'Journal', 'Services']

  return (
    <main className="min-h-screen bg-background px-5 pb-24 pt-32 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-muted-foreground">Explore The Revamp UG</p>
        <h1 className="mt-5 max-w-3xl font-serif text-5xl font-light leading-tight text-foreground md:text-7xl">Search the collection.</h1>
        <div className="mt-10 flex items-center gap-3 border-b border-foreground/30 pb-4">
          <Search className="text-muted-foreground" aria-hidden="true" />
          <label htmlFor="site-search" className="sr-only">Search the site</label>
          <input id="site-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects, products, journal..." className="w-full bg-transparent font-sans text-lg outline-none placeholder:text-muted-foreground" autoFocus />
        </div>
        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Search result filters">
          {filters.map((item) => (
            <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={`border px-4 py-2 font-sans text-xs uppercase tracking-widest transition-colors ${filter === item ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'}`}>
              {item}
            </button>
          ))}
        </div>
        <p className="mt-12 font-sans text-sm text-muted-foreground">{results.length} {results.length === 1 ? 'result' : 'results'}</p>
        {results.length > 0 ? (
          <div className="mt-5 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => (
              <Link key={`${result.type}-${result.id}`} href={result.href} className="group block">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {result.image ? <img src={result.image} alt="" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="flex size-full items-center justify-center font-serif text-3xl text-muted-foreground">The Revamp UG</div>}
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div><p className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold">{result.type}</p><h2 className="mt-2 font-serif text-2xl font-light text-foreground">{result.title}</h2><p className="mt-2 line-clamp-2 font-sans text-sm leading-6 text-muted-foreground">{result.description}</p></div>
                  <ArrowUpRight className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        ) : <p className="mt-16 border-y border-border py-12 font-serif text-3xl font-light text-muted-foreground">No results yet. Try another phrase.</p>}
      </div>
    </main>
  )
}
