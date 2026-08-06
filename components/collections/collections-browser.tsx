'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  products,
  SPACES,
  ITEM_TYPES,
  QUICK_FILTERS,
  isNewArrival,
  formatPrice,
  type QuickTag,
  type Space,
  type ItemType,
} from '@/lib/data/products'
import { PRODUCT_CATEGORIES } from '@/lib/data/categories'
import { WishlistButton } from '@/components/collections/wishlist-button'

type QuickValue = QuickTag | 'all'

export function CollectionsBrowser() {
  const [quick, setQuick] = useState<QuickValue>('all')
  const [space, setSpace] = useState<Space | 'all'>('all')
  const [item, setItem] = useState<ItemType | 'all'>('all')
  const [category, setCategory] = useState<string>('all')

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchQuick = quick === 'all' || p.tags.includes(quick)
      const matchSpace = space === 'all' || p.space === space
      const matchItem = item === 'all' || p.itemType === item
      const matchCategory = category === 'all' || p.category === category
      return matchQuick && matchSpace && matchItem && matchCategory
    })
  }, [quick, space, item, category])

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-10 lg:gap-16">
      {/* Filter rail */}
      <aside className="space-y-10">
        {/* Quick Filters */}
        <FilterGroup title="Quick Filters">
          <div className="flex flex-wrap lg:flex-col gap-2">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setQuick(f.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 text-left font-sans text-sm py-1.5 lg:py-1 transition-colors',
                  quick === f.value ? 'text-gold' : 'text-foreground/70 hover:text-foreground',
                )}
              >
                {f.icon === 'star' && <Star size={13} className="fill-gold text-gold" />}
                {f.label}
              </button>
            ))}
          </div>
        </FilterGroup>

        {/* By Category */}
        <FilterGroup title="By Category">
          <FilterList
            options={PRODUCT_CATEGORIES.map((c) => ({
              label: c.name,
              value: c.slug,
            }))}
            active={category}
            onSelect={(v) => setCategory(v as string)}
          />
        </FilterGroup>

        {/* By Space */}
        <FilterGroup title="By Space">
          <FilterList
            options={SPACES}
            active={space}
            onSelect={(v) => setSpace(v as Space | 'all')}
          />
        </FilterGroup>

        {/* By Item */}
        <FilterGroup title="By Item">
          <FilterList
            options={ITEM_TYPES}
            active={item}
            onSelect={(v) => setItem(v as ItemType | 'all')}
          />
        </FilterGroup>
      </aside>

      {/* Product grid */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <p className="font-sans text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}
          </p>
          {(quick !== 'all' || space !== 'all' || item !== 'all' || category !== 'all') && (
            <button
              onClick={() => {
                setQuick('all')
                setSpace('all')
                setItem('all')
                setCategory('all')
              }}
              className="font-sans text-xs tracking-widest uppercase text-gold hover-line"
            >
              Clear Filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="border border-border py-24 text-center">
            <p className="font-serif text-2xl font-light text-foreground mb-2">No pieces found</p>
            <p className="font-sans text-sm text-muted-foreground">
              Try adjusting your filters to see more of the collection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {filtered.map((p) => (
              <div key={p.id} className="group relative bg-background overflow-hidden">
                <Link href={`/collections/${p.slug}`} className="block">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url('${p.images[0]}')` }}
                      role="img"
                      aria-label={p.name}
                    />
                    <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/30 transition-colors duration-500" />
                    {isNewArrival(p) && (
                      <span className="absolute top-3 left-3 bg-gold text-obsidian font-sans text-[10px] tracking-widest uppercase px-2.5 py-1">
                        New Arrivals
                      </span>
                    )}
                  </div>
                </Link>

                {/* Wishlist toggle */}
                <div className="absolute top-2 right-2">
                  <WishlistButton productId={p.id} variant="icon" />
                </div>

                <div className="p-4 border-t border-border">
                  <Link href={`/collections/${p.slug}`}>
                    <h3 className="font-serif text-base font-light text-foreground group-hover:text-gold transition-colors leading-tight mb-1">
                      {p.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans text-[11px] text-muted-foreground tracking-wide uppercase">
                      {p.space}
                    </span>
                    <span className="font-sans text-sm text-foreground font-medium">
                      {formatPrice(p.price, p.currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4 pb-3 border-b border-border">
        {title}
      </h3>
      {children}
    </div>
  )
}

function FilterList({
  options,
  active,
  onSelect,
}: {
  options: readonly (string | { label: string; value: string })[]
  active: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap lg:flex-col gap-2">
      <button
        onClick={() => onSelect('all')}
        className={cn(
          'text-left font-sans text-sm py-1.5 lg:py-1 transition-colors',
          active === 'all' ? 'text-gold' : 'text-foreground/70 hover:text-foreground',
        )}
      >
        All
      </button>
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt : opt.label
        return (
          <button
            key={val}
            onClick={() => onSelect(val)}
            className={cn(
              'text-left font-sans text-sm py-1.5 lg:py-1 transition-colors',
              active === val ? 'text-gold' : 'text-foreground/70 hover:text-foreground',
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
