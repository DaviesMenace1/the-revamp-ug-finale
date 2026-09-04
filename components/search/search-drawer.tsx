'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, X, ArrowUpRight } from '@/components/ui/luxury-icons'
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/utils'

interface SearchProduct { id: string; name: string; slug: string; description: string; imageUrl?: string; brand?: string; url: string }

export function SearchDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<SearchProduct[]>([])
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const currentRequest = ++requestId.current
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const term = query.trim()
        const response = await fetch(`/api/search/products?limit=12${term ? `&search=${encodeURIComponent(term)}` : ''}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
        if (!response.ok) throw new Error('Search request failed')
        const data = await response.json()
        if (currentRequest === requestId.current) setProducts(Array.isArray(data.products) ? data.products : [])
      } catch (error) {
        if ((error as Error).name !== 'AbortError' && currentRequest === requestId.current) setProducts([])
      } finally {
        if (currentRequest === requestId.current) setLoading(false)
      }
    }, query.trim() ? 100 : 0)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [open, query])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown) }
  }, [open, onClose])

  const clearQuery = () => setQuery('')

  return <>
    {open && <button type="button" aria-label="Close search" onClick={onClose} className="fixed inset-0 z-[80] cursor-default bg-obsidian/35 backdrop-blur-sm" />}
    <aside aria-label="Search the collection" aria-hidden={!open} className={`fixed right-0 top-0 z-[85] flex h-dvh w-full flex-col bg-canvas text-obsidian shadow-2xl transition-transform duration-500 ease-out sm:w-[75vw] lg:w-[72vw] ${open ? 'translate-x-0' : 'pointer-events-none translate-x-full'}`}>
      <div className="flex items-center justify-between border-b border-obsidian/10 px-5 py-5 sm:px-8 lg:px-12"><p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gilded">Explore The Revamp UG</p><button type="button" onClick={onClose} aria-label="Close search" className="flex size-11 items-center justify-center rounded-md border border-obsidian/15 hover:border-gilded hover:text-gilded"><X className="size-5" /></button></div>
      <div className="flex-1 overflow-y-auto px-5 py-10 sm:px-8 lg:px-12 lg:py-14"><div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3 rounded-2xl border border-obsidian/15 bg-white px-5 py-3 shadow-[0_10px_30px_-22px_rgba(28,28,28,0.45)] transition-colors focus-within:border-gilded focus-within:ring-2 focus-within:ring-gilded/15"><Search className="size-5 shrink-0 text-gilded" /><label htmlFor="drawer-search" className="sr-only">Search products, projects, journal, and services</label><input id="drawer-search" autoFocus={open} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, projects, journal..." className="min-w-0 flex-1 bg-transparent font-sans text-base text-obsidian outline-none placeholder:text-obsidian/45 sm:text-lg" />{query && <button type="button" onClick={clearQuery} aria-label="Clear search" className="flex size-8 shrink-0 items-center justify-center rounded-full text-obsidian/50 hover:bg-obsidian/5 hover:text-obsidian"><X className="size-4" /></button>}{loading && <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-gilded/25 border-t-gilded" aria-label="Searching" />}</div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4"><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground" aria-live="polite">{loading ? 'Searching live…' : `${products.length} ${products.length === 1 ? 'piece' : 'pieces'} in the current edit`}</p><Link href={`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`} onClick={onClose} className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gilded hover:text-obsidian">Open full search <ArrowUpRight className="size-4" /></Link></div>
        {products.length > 0 ? <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <Link key={product.id} href={`/collections/${product.slug}`} onClick={onClose} className="group"><div className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted"><Image src={product.imageUrl || DEFAULT_PRODUCT_IMAGE} alt={product.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" /></div><p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-gilded">{product.brand || 'The Revamp collection'}</p><h2 className="mt-2 font-serif text-2xl leading-tight group-hover:text-gilded">{product.name}</h2></Link>)}</div> : <div className="mt-16 border-y border-border py-16"><p className="font-serif text-3xl">{query ? 'No pieces found.' : 'Begin with a piece, a room, or a name.'}</p><p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">{query ? 'Try another phrase or open the full search for projects, services, and journal entries.' : 'Search the current collection and discover objects selected for considered spaces.'}</p></div>}
      </div></div><div className="border-t border-obsidian/10 px-5 py-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:px-8 lg:px-12">Results update as you type · Press <kbd className="mx-1 rounded border border-border px-1.5 py-0.5">Esc</kbd> to close</div>
    </aside>
  </>
}
