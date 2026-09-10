'use client'

import Image from 'next/image'
import Link from 'next/link'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Package, Sparkles } from '@/components/ui/luxury-icons'
import { WishlistButton } from '@/components/collections/wishlist-button'
import { membershipNavItems } from '@/components/portals/portal-navigation'

function formatCurrency(value: number, currency = 'UGX') {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0)
}

type Product = { id: string; slug: string; name: string; price: number; originalPrice: number | null; currency: string; image: string | null }

export default function MembershipCollectionsClient({ products = [] }: { products: Product[] }) {
  return <PortalLayout portalName="Revamp Membership" portalSlug="membership" navItems={[...membershipNavItems]}><div className="space-y-10"><header className="max-w-3xl space-y-4"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Membership collections</p><h1 className="font-serif text-4xl font-light leading-[1.04] text-foreground md:text-6xl">Pieces selected for a more considered life.</h1><p className="text-base leading-7 text-muted-foreground">A changing edit of pieces the studio thinks are worth living with. Save what speaks to you, then open the full product detail when you are ready.</p></header><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <article key={product.id} className="group overflow-hidden rounded-xl border border-border/70 bg-card shadow-soft"><div className="relative aspect-[4/5] overflow-hidden bg-muted">{product.image ? <Link href={`/collections/${product.slug}`} className="absolute inset-0"><Image src={product.image} alt={product.name} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /></Link> : <div className="flex h-full items-center justify-center"><Package className="size-8 text-muted-foreground" /></div>}<div className="absolute right-3 top-3"><WishlistButton productId={product.id} variant="icon" /></div></div><div className="p-5"><Link href={`/collections/${product.slug}`} className="font-serif text-xl text-foreground hover:text-primary">{product.name}</Link><div className="mt-3 flex flex-wrap items-baseline gap-2"><span className="text-sm font-semibold text-foreground">{formatCurrency(product.price, product.currency)}</span>{product.originalPrice && product.originalPrice > product.price && <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.originalPrice, product.currency)}</span>}</div><Link href={`/collections/${product.slug}`} className="mt-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">View piece <span aria-hidden="true">↗</span></Link></div></article>)}{products.length === 0 && <div className="sm:col-span-2 lg:col-span-3 flex flex-col items-center rounded-xl border border-dashed border-border/50 p-12 text-center"><Sparkles className="mb-3 size-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">The next member edit is being prepared.</p><Link href="/collections" className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-primary underline underline-offset-4">Explore the full collection</Link></div>}</div></div></PortalLayout>
}
