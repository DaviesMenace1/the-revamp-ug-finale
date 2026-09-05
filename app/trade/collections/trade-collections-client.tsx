'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Badge } from '@/components/ui/badge'
import { Heart, Package, ArrowRight } from '@/components/ui/luxury-icons'

const tradeNavItems = [
  { label: 'Dashboard', href: '/trade' },
  { label: 'Collections', href: '/trade/collections' },
  { label: 'Orders', href: '/trade/orders' },
  { label: 'Resources', href: '/trade/resources' },
]

function formatCurrency(value: number, currency = 'UGX') {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0)
}

type Product = {
  id: string
  slug: string
  name: string
  price: number
  tradeDiscountPercent: number
  currency: string
  image: string | null
}

export default function TradeCollectionsClient({ products = [], memberName }: { products: Product[]; memberName: string | null }) {
  const [favorites, setFavorites] = useState(new Set<string>())

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <PortalLayout portalName="Trade Portal" portalSlug="trade" navItems={tradeNavItems}>
      <div className="space-y-10">
        <header className="flex flex-col gap-4 border-b border-border/70 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs uppercase tracking-[0.2em] text-primary">Trade edit{memberName ? ` / ${memberName}` : ''}</p><h1 className="mt-3 font-serif text-4xl font-light text-foreground md:text-5xl">Collections for your practice.</h1><p className="mt-3 max-w-2xl text-muted-foreground">A trade view of the public collection, with the product-specific discounts approved for your account.</p></div>
          <Link href="/collections" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary">View public collection <ArrowRight className="size-4" /></Link>
        </header>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {products.map((product) => {
            const rate = Math.min(100, Math.max(0, product.tradeDiscountPercent || 0))
            const tradePrice = product.price * (1 - rate / 100)
            return <article key={product.id} className="group min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft"><div className="relative aspect-[4/5] overflow-hidden bg-muted">{product.image ? <Image src={product.image} alt={product.name} fill sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center"><Package className="size-8 text-muted-foreground" /></div>}<button type="button" onClick={() => toggleFavorite(product.id)} aria-label={`${favorites.has(product.id) ? 'Remove' : 'Save'} ${product.name}`} className="absolute right-3 top-3 rounded-full bg-background/90 p-2 shadow-sm"><Heart className={`size-4 ${favorites.has(product.id) ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'}`} /></button>{rate > 0 && <Badge className="absolute left-3 top-3 bg-emerald-700 text-[10px] text-white">Trade -{rate}%</Badge>}</div><div className="p-4 sm:p-5"><Link href={`/collections/${product.slug}`} className="text-sm font-medium text-foreground hover:text-primary">{product.name}</Link><div className="mt-3 flex flex-wrap items-baseline gap-2"><span className="text-sm font-semibold text-primary sm:text-base">{formatCurrency(tradePrice, product.currency)}</span>{rate > 0 && <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.price, product.currency)}</span>}</div>{rate === 0 && <p className="mt-2 text-xs text-muted-foreground">Trade pricing not configured for this product.</p>}</div></article>
          })}
          {products.length === 0 && <div className="col-span-full flex flex-col items-center rounded-lg border border-dashed border-border/40 p-12 text-center"><Package className="mb-3 size-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">No published products yet.</p></div>}
        </div>
      </div>
    </PortalLayout>
  )
}
