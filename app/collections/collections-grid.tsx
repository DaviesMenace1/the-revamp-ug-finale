'use client'

import { Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProductCard } from '@/components/collections/product-card'

type ProductGridItem = {
  id: string
  name: string
  description?: string | null
  subCategory?: { name?: string | null; category?: { name?: string | null } | null } | null
  [key: string]: unknown
}

export default function CollectionsGrid({ products }: { products: ProductGridItem[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const categories = useMemo(() => {
    const names = products
      .map((product) => product.subCategory?.category?.name || product.subCategory?.name)
      .filter((value): value is string => Boolean(value))
    return ['All', ...Array.from(new Set(names))]
  }, [products])

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return products.filter((product) => {
      const productCategory = product.subCategory?.category?.name || product.subCategory?.name || ''
      const matchesCategory = category === 'All' || productCategory === category
      const searchable = `${product.name} ${product.description || ''} ${productCategory}`.toLowerCase()
      return matchesCategory && (!needle || searchable.includes(needle))
    })
  }, [category, products, query])

  return (
    <section className="px-5 py-12 sm:px-8 md:py-20 lg:px-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-6 border-b border-border/70 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex items-center gap-3 border-b border-foreground/35 pb-3 lg:min-w-[28rem]">
            <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="collection-search" className="sr-only">Search the collection</label>
            <input id="collection-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search objects, materials, rooms..." className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            <span>{filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'} shown</span>
          </div>
        </div>

        <div className="mt-7 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter products by category">
          {categories.map((item) => (
            <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`min-h-11 shrink-0 rounded-sm border px-4 text-[10px] uppercase tracking-[0.16em] transition-colors duration-200 ${category === item ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'}`}>
              {item}
            </button>
          ))}
        </div>

        {filteredProducts.length ? (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product as any} className="motion-reveal" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` } as any} />
            ))}
          </div>
        ) : (
          <div className="border-y border-dashed border-border py-16 text-center">
            <p className="font-serif text-3xl">No pieces match that search.</p>
            <p className="mt-3 text-sm text-muted-foreground">Try another material, category, or room.</p>
          </div>
        )}
      </div>
    </section>
  )
}
