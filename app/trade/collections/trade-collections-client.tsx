'use client'

import Link from 'next/link'
import Image from 'next/image'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Heart, Package } from '@/components/ui/luxury-icons'
import { WishlistButton } from '@/components/collections/wishlist-button'
import { tradeNavItems } from '@/components/portals/portal-navigation'

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

export default function TradeCollectionsClient({ products = [], memberName, accessState = 'approved' }: { products: Product[]; memberName: string | null; accessState?: 'approved' | 'pending' | 'restricted' }) {
  const isApproved = accessState === 'approved'

  return (
    <PortalLayout portalName="Trade Portal" portalSlug="trade" navItems={[...tradeNavItems]}>
      <div className="space-y-10">
        <header className="flex flex-col gap-5 border-b border-border/70 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Trade collections{memberName ? ` / ${memberName}` : ''}</p><h1 className="mt-3 max-w-3xl font-serif text-4xl font-light leading-[1.04] text-foreground md:text-5xl">Products prepared for your practice.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">Approved trade accounts see the studio price configured for each product. Public retail pricing remains unchanged.</p></div>
          <Link href="/collections" className="inline-flex shrink-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">View public collection <ArrowRight className="size-4" /></Link>
        </header>

        {!isApproved && <div className="rounded-xl border border-amber-300/70 bg-amber-50 p-6"><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-800">Trade access is not open yet</p><h2 className="mt-2 font-serif text-3xl font-light text-foreground">Your application is still being reviewed.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Trade prices and collections become available after approval. Return to your application or contact the studio if you need help.</p><div className="mt-5 flex flex-wrap gap-4"><Link href="/trade-program#apply" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground underline underline-offset-4">Review application <ArrowRight className="size-4" /></Link><Link href="/contact" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground underline underline-offset-4">Contact the studio</Link></div></div>}

        {isApproved && <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">{products.map((product) => { const rate = Math.min(100, Math.max(0, product.tradeDiscountPercent || 0)); const tradePrice = product.price * (1 - rate / 100); return <article key={product.id} className="group min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft"><div className="relative aspect-[4/5] overflow-hidden bg-muted">{product.image ? <Image src={product.image} alt={product.name} fill sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center"><Package className="size-8 text-muted-foreground" /></div>}<div className="absolute right-3 top-3"><WishlistButton productId={product.id} variant="icon" /></div>{rate > 0 && <Badge className="absolute left-3 top-3 bg-emerald-700 text-[10px] text-white">Trade -{rate}%</Badge>}</div><div className="p-4 sm:p-5"><Link href={`/collections/${product.slug}?trade=1`} className="text-sm font-medium text-foreground hover:text-primary">{product.name}</Link><div className="mt-3 flex flex-wrap items-baseline gap-2"><span className="text-sm font-semibold text-primary sm:text-base">{formatCurrency(tradePrice, product.currency)}</span>{rate > 0 && <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.price, product.currency)}</span>}</div>{rate === 0 && <p className="mt-2 text-xs text-muted-foreground">Studio pricing is available on request.</p>}<Link href={`/collections/${product.slug}?trade=1`} className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">View product detail <ArrowRight className="size-4" /></Link></div></article> })}{products.length === 0 && <div className="col-span-full flex flex-col items-center rounded-lg border border-dashed border-border/40 p-12 text-center"><Heart className="mb-3 size-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">No trade products are published yet.</p></div>}</div>}
      </div>
    </PortalLayout>
  )
}
