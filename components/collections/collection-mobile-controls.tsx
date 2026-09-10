'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, SlidersHorizontal, X } from '@/components/ui/luxury-icons'

const filters = ['Price', 'New', 'Category', 'Type', 'Size', 'Colour', 'Features', 'Top Material', 'Material', 'Sale']
const sortOptions = ['New', 'Popularity', 'Price: low to high', 'Price: high to low', 'On sale', 'Name: A-Z', 'Name: Z-A']

export function CollectionMobileControls({ count }: { count: number }) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [sort, setSort] = useState('Popularity')

  return (
    <>
      <div className="mb-8 hidden items-center justify-between border-b border-border pb-5 md:flex">
        <button type="button" onClick={() => setFilterOpen(true)} className="inline-flex items-center gap-2 text-sm text-foreground hover:text-gilded">
          <SlidersHorizontal className="size-4" /> Filters
        </button>
        <p className="text-sm text-muted-foreground">{count} Items</p>
        <label className="flex items-center gap-2 text-sm">
          Sort by
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="border-0 bg-transparent py-2 text-gilded outline-none">
            {sortOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex h-14 border-t border-border bg-obsidian text-canvas md:hidden">
        <button type="button" onClick={() => setFilterOpen(true)} className="flex flex-1 items-center justify-center gap-2 border-r border-canvas/20 text-sm">
          <SlidersHorizontal className="size-4" /> Filter
        </button>
        <div className="relative flex flex-1">
          <button type="button" onClick={() => setSortOpen((value) => !value)} className="flex w-full items-center justify-center gap-2 text-sm">
            Sort by <ChevronDown className={`size-4 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
          </button>
          {sortOpen && (
            <div className="absolute bottom-14 right-2 w-56 bg-canvas p-2 text-left text-obsidian shadow-xl ring-1 ring-border">
              {sortOptions.map((option) => (
                <button type="button" key={option} onClick={() => { setSort(option); setSortOpen(false) }} className={`block w-full px-4 py-3 text-sm hover:bg-muted ${sort === option ? 'text-gilded' : ''}`}>
                  {sort === option && <span className="mr-2">•</span>}{option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filterOpen && (
        <>
          <button type="button" aria-label="Close filters" onClick={() => setFilterOpen(false)} className="fixed inset-0 z-50 bg-obsidian/55" />
          <aside aria-label="Collection filters" className="fixed inset-y-0 left-0 z-[55] flex w-[86vw] max-w-xl flex-col bg-canvas text-obsidian shadow-2xl sm:w-[25rem]">
            <div className="flex items-center justify-between border-b border-border px-6 py-7">
              <h2 className="font-serif text-4xl">Filter</h2>
              <button type="button" onClick={() => setFilterOpen(false)} aria-label="Close filters" className="size-10 text-gilded"><X className="mx-auto size-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6">
              {filters.map((filter) => (
                <button type="button" key={filter} className="flex w-full items-center justify-between border-b border-border py-6 text-left text-lg hover:text-gilded">
                  <span>{filter}</span><ChevronRight className="size-5" />
                </button>
              ))}
            </div>
            <div className="flex gap-4 border-t border-border px-6 py-6">
              <button type="button" onClick={() => setFilterOpen(false)} className="min-h-14 flex-1 rounded-md bg-muted px-4 text-sm">Clear filter</button>
              <button type="button" onClick={() => setFilterOpen(false)} className="min-h-14 flex-1 rounded-md bg-obsidian px-4 text-sm text-canvas">Apply filter</button>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
