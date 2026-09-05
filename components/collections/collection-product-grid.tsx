'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, SlidersHorizontal, X } from '@/components/ui/luxury-icons'
import { ProductCard } from '@/components/collections/product-card'

const filterOptions = ['All', 'New', 'Sale', 'In stock']
const sortOptions = ['Popularity', 'New', 'Price: low to high', 'Price: high to low', 'Name: A-Z', 'Name: Z-A']
const browseFilters = ['Price', 'New', 'Category', 'Type', 'Size', 'Colour', 'Features', 'Top Material', 'Material', 'Sale']

type Product = Record<string, any> & { id: string; name: string }

function isSale(product: Product) {
  const price = Number(product.price ?? 0)
  const salePrice = Number(product.salePrice ?? price)
  return Boolean(product.isOnSale) || (Number.isFinite(price) && Number.isFinite(salePrice) && salePrice > 0 && salePrice < price)
}

function isNew(product: Product) {
  return Boolean(product.isNewArrival) || Boolean(product.createdAt && Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 90)
}

function isInStock(product: Product) {
  const availability = String(product.availability || '').toLowerCase()
  return availability !== 'out_of_stock' && availability !== 'discontinued' && Number(product.quantity ?? 1) !== 0
}

export function CollectionProductGrid({ products }: { products: Product[] }) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('Popularity')

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => filter === 'All' || (filter === 'New' && isNew(product)) || (filter === 'Sale' && isSale(product)) || (filter === 'In stock' && isInStock(product)))
    return [...filtered].sort((a, b) => {
      if (sort === 'Price: low to high') return Number(a.salePrice ?? a.price ?? 0) - Number(b.salePrice ?? b.price ?? 0)
      if (sort === 'Price: high to low') return Number(b.salePrice ?? b.price ?? 0) - Number(a.salePrice ?? a.price ?? 0)
      if (sort === 'Name: A-Z') return a.name.localeCompare(b.name)
      if (sort === 'Name: Z-A') return b.name.localeCompare(a.name)
      if (sort === 'New') return Number(isNew(b)) - Number(isNew(a))
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured))
    })
  }, [filter, products, sort])

  const chooseFilter = (value: string) => { setFilter(value); setFilterOpen(false) }
  const chooseSort = (value: string) => { setSort(value); setSortOpen(false) }

  return <>
    <div className="mb-8 hidden items-center justify-between border-b border-border pb-5 md:flex">
      <button type="button" onClick={() => setFilterOpen(true)} className="inline-flex items-center gap-2 text-sm text-foreground hover:text-gilded"><SlidersHorizontal className="size-4" /> Filters{filter !== 'All' && <span className="text-gilded">· {filter}</span>}</button>
      <p className="text-sm text-muted-foreground">{visibleProducts.length} Items</p>
      <label className="flex items-center gap-2 text-sm">Sort by <select value={sort} onChange={(event) => chooseSort(event.target.value)} className="border-0 bg-transparent py-2 text-gilded outline-none">{sortOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
    </div>

    <div className="fixed inset-x-0 bottom-0 z-40 flex h-14 border-t border-border bg-obsidian text-canvas md:hidden">
      <button type="button" onClick={() => setFilterOpen(true)} className="flex flex-1 items-center justify-center gap-2 border-r border-canvas/20 text-sm"><SlidersHorizontal className="size-4" /> Filter{filter !== 'All' && <span className="text-gilded">· {filter}</span>}</button>
      <div className="relative flex flex-1"><button type="button" onClick={() => setSortOpen((value) => !value)} className="flex w-full items-center justify-center gap-2 text-sm">Sort by <ChevronDown className={`size-4 transition-transform ${sortOpen ? 'rotate-180' : ''}`} /></button>{sortOpen && <div className="absolute bottom-14 right-2 w-60 bg-canvas p-2 text-left text-obsidian shadow-xl ring-1 ring-border">{sortOptions.map((option) => <button type="button" key={option} onClick={() => chooseSort(option)} className={`block w-full px-4 py-3 text-sm hover:bg-muted ${sort === option ? 'text-gilded' : ''}`}>{sort === option && <span className="mr-2">•</span>}{option}</button>)}</div>}</div>
    </div>

    {filterOpen && <><button type="button" aria-label="Close filters" onClick={() => setFilterOpen(false)} className="fixed inset-0 z-50 bg-obsidian/55" /><aside aria-label="Collection filters" className="fixed inset-y-0 left-0 z-[55] flex w-[86vw] max-w-xl flex-col bg-canvas text-obsidian shadow-2xl sm:w-[25rem]"><div className="flex items-center justify-between border-b border-border px-6 py-7"><h2 className="font-serif text-4xl">Filter</h2><button type="button" onClick={() => setFilterOpen(false)} aria-label="Close filters" className="size-10 text-gilded"><X className="mx-auto size-5" /></button></div><div className="flex-1 overflow-y-auto px-6"><div className="border-b border-border py-5"><p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Availability</p><div className="flex flex-wrap gap-2">{filterOptions.map((option) => <button type="button" key={option} onClick={() => chooseFilter(option)} className={`rounded-full border px-4 py-2 text-sm ${filter === option ? 'border-obsidian bg-obsidian text-canvas' : 'border-border hover:border-gilded'}`}>{option}</button>)}</div></div>{browseFilters.map((item) => <button type="button" key={item} onClick={() => item === 'New' ? chooseFilter('New') : item === 'Sale' ? chooseFilter('Sale') : undefined} className={`flex w-full items-center justify-between border-b border-border py-6 text-left text-lg hover:text-gilded ${((item === 'New' && filter === 'New') || (item === 'Sale' && filter === 'Sale')) ? 'text-gilded' : ''}`}><span>{item}</span><ChevronRight className="size-5" /></button>)}</div><div className="flex gap-4 border-t border-border px-6 py-6"><button type="button" onClick={() => setFilter('All')} className="min-h-14 flex-1 rounded-md bg-muted px-4 text-sm">Clear filter</button><button type="button" onClick={() => setFilterOpen(false)} className="min-h-14 flex-1 rounded-md bg-obsidian px-4 text-sm text-canvas">Apply filter</button></div></aside></>}

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">{visibleProducts.map((product, index) => <ProductCard key={product.id} product={product as any} className="motion-reveal" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }} />)}</div>
    {visibleProducts.length === 0 && <div className="border border-dashed border-border p-12 text-center"><p className="font-serif text-3xl">No pieces match this edit.</p><button type="button" onClick={() => setFilter('All')} className="mt-4 text-sm text-gilded underline underline-offset-4">Clear filters</button></div>}
  </>
}
