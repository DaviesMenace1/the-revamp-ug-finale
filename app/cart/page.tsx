'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, MessageCircle, Minus, Plus, ShieldCheck, ShoppingCart, Trash2, Truck } from '@/components/ui/luxury-icons'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductCard } from '@/components/collections/product-card'
import { useCart } from '@/lib/context/cart-context'
import { DEFAULT_PRODUCT_IMAGE, formatMoney, normalizeCurrency, resolveProductImageUrls } from '@/lib/utils'

function getImage(item: any) {
  const image = item.image || item.selectedColor?.image || item.selectedFinish?.image || item.selectedVariant?.image
  if (typeof image === 'string' && image.trim()) return image
  if (image && typeof image === 'object' && typeof image.url === 'string' && image.url.trim()) return image.url
  return resolveProductImageUrls(item.product)[0] || DEFAULT_PRODUCT_IMAGE
}

function optionsFor(item: any) {
  const options = [
    item.selectedColor?.label || item.selectedColor?.name ? `Colour: ${item.selectedColor.label || item.selectedColor.name}` : null,
    item.selectedFabric?.label || item.selectedFabric?.name ? `Fabric: ${item.selectedFabric.label || item.selectedFabric.name}` : null,
    item.selectedMaterial?.label || item.selectedMaterial?.name ? `Material: ${item.selectedMaterial.label || item.selectedMaterial.name}` : null,
    item.selectedFinish?.label || item.selectedFinish?.name ? `Finish: ${item.selectedFinish.label || item.selectedFinish.name}` : null,
    item.selectedVariant?.label || item.selectedVariant?.name ? `Variant: ${item.selectedVariant.label || item.selectedVariant.name}` : null,
    Array.isArray(item.selectedAccessories) && item.selectedAccessories.length > 0 ? `Add-ons: ${item.selectedAccessories.map((option: any) => option.label || option.name).filter(Boolean).join(', ')}` : null,
  ].filter(Boolean) as string[]
  const dimensions = item.customDimensions
  if (dimensions && Object.values(dimensions).some(Boolean)) options.push(`Custom dimensions: ${Object.entries(dimensions).filter(([key, value]) => key !== 'unit' && value).map(([key, value]) => `${key} ${value}`).join(', ')}`)
  return options
}

function whatsappCartMessage(items: any[], total: number, currency: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://therevampug.com'
  const lines = items.map((item) => {
    const unitPrice = Number(item.unitPrice ?? item.product?.salePrice ?? item.product?.price ?? 0)
    const url = item.product?.slug ? `${origin}/collections/${item.product.slug}` : null
    return [`• ${item.product?.name || 'Saved selection'} × ${item.quantity} | ${formatMoney(unitPrice * item.quantity, currency)}`, ...optionsFor(item).map((value) => `  ${value}`), url ? `  ${url}` : null].filter(Boolean).join('\n')
  })
  return ['Hello The Revamp UG, I would like to order the following selection:', '', lines.join('\n'), '', `Estimated total: ${formatMoney(total, currency)}`, '', 'Please confirm availability, delivery, installation, and the final quotation.'].join('\n')
}

function QuantityControl({ quantity, onDecrease, onIncrease }: { quantity: number; onDecrease: () => void; onIncrease: () => void }) {
  return <div className="inline-flex items-center border border-border/80 bg-background"><button type="button" onClick={onDecrease} className="flex size-10 items-center justify-center hover:bg-muted" aria-label="Decrease quantity"><Minus className="size-3.5" /></button><span className="min-w-10 text-center text-sm tabular-nums">{quantity}</span><button type="button" onClick={onIncrease} className="flex size-10 items-center justify-center hover:bg-muted" aria-label="Increase quantity"><Plus className="size-3.5" /></button></div>
}

export default function CartPage() {
  const { items, cart, updateQuantity, removeFromCart, clearCart, isLoaded } = useCart()
  const [recommendations, setRecommendations] = useState<any[]>([])
  const currencies = Array.from(new Set(items.map((item) => normalizeCurrency(item.currency ?? item.product?.currency))))
  const hasMixedCurrencies = currencies.length > 1
  const cartCurrency = currencies[0] || 'UGX'

  useEffect(() => {
    if (!isLoaded) return
    let cancelled = false
    fetch('/api/products')
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled || !payload?.success || !Array.isArray(payload.data)) return
        const cartIds = new Set(items.map((item) => item.productId || item.product?.id))
        const next = payload.data.filter((product: any) => !cartIds.has(product.id)).slice(0, 4)
        setRecommendations(next)
      })
      .catch(() => setRecommendations([]))
    return () => { cancelled = true }
  }, [isLoaded, items])

  const shareCartOnWhatsApp = () => {
    const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '256783476807').replace(/[^0-9]/g, '')
    const message = whatsappCartMessage(items, Number(cart?.total || 0), cartCurrency)
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  if (!isLoaded) return <><SiteHeader /><main className="flex min-h-dvh items-center justify-center px-6 pt-24"><p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Loading your selection...</p></main><SiteFooter /></>

  if (items.length === 0) return <><SiteHeader /><main className="min-h-[70dvh] bg-background px-5 pb-24 pt-32 sm:px-8 md:pt-40"><div className="mx-auto max-w-xl text-center"><ShoppingCart className="mx-auto size-12 text-primary" /><p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-primary">Your selection</p><h1 className="mt-3 font-serif text-5xl font-light tracking-tight sm:text-7xl">Almost yours.</h1><p className="mt-5 text-sm leading-7 text-muted-foreground">Your selection is waiting. Explore furniture, lighting, and considered objects for a more refined tomorrow.</p><Link href="/collections" className="mt-8 inline-flex min-h-12 items-center gap-2 bg-foreground px-6 text-xs uppercase tracking-[0.16em] text-background">Explore collections <ArrowRight className="size-4" /></Link></div></main><SiteFooter /></>

  return <>
    <SiteHeader />
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden bg-obsidian text-ivory"><Image src="/prototype/hero-natural-light.jpg" alt="A considered living space" fill priority sizes="100vw" className="object-cover opacity-60" /><div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" /><div className="relative mx-auto flex min-h-[21rem] max-w-[1440px] flex-col justify-end px-5 pb-10 pt-32 sm:px-8 lg:min-h-[25rem] lg:px-16"><div className="flex items-end justify-between gap-5"><div><p className="text-[10px] uppercase tracking-[0.3em] text-ivory/70">Your cart</p><h1 className="mt-4 max-w-2xl font-serif text-5xl font-light leading-[0.9] sm:text-7xl">Curated for a more refined tomorrow.</h1><p className="mt-5 max-w-xl text-sm text-ivory/75">Thoughtful pieces. A more considered way of living.</p></div><div className="hidden size-20 shrink-0 items-center justify-center rounded-full border border-ivory/40 text-ivory sm:flex"><ShoppingCart className="size-9" /></div></div></div></section>
      <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-14 lg:px-16"><div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-6"><div><p className="text-[10px] uppercase tracking-[0.28em] text-primary">Order summary</p><h2 className="mt-3 font-serif text-4xl font-light sm:text-5xl">Almost yours.</h2><p className="mt-2 text-sm text-muted-foreground">Review your pieces and proceed to a secure checkout.</p></div><div className="flex items-center gap-4"><span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><ShoppingCart className="size-4 text-primary" />{items.reduce((sum, item) => sum + item.quantity, 0)} items</span><button type="button" onClick={() => window.confirm('Clear everything from your cart?') && clearCart()} className="text-xs uppercase tracking-[0.16em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Clear all</button></div></div>
        {hasMixedCurrencies && <div role="alert" className="mb-6 border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">This selection contains more than one currency. Separate checkout is required.</div>}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:gap-16"><section aria-label="Cart items" className="min-w-0">{items.map((item) => { const name = item.product?.name || 'Saved selection'; const slug = item.product?.slug; const href = item.unavailable || !slug ? null : `/collections/${slug}`; const image = getImage(item); const currency = normalizeCurrency(item.currency ?? item.product?.currency); const unitPrice = Number(item.unitPrice ?? item.product?.salePrice ?? item.product?.price ?? 0); return <article key={item.cartItemId} className="group flex gap-4 border-b border-border/70 py-5 first:pt-0 sm:gap-6"><div className="relative aspect-square w-28 shrink-0 overflow-hidden bg-muted sm:w-40">{href ? <Link href={href}><Image src={image} alt={name} fill sizes="160px" className="object-cover transition duration-500 group-hover:scale-105" /></Link> : <Image src={image} alt={name} fill sizes="160px" className="object-cover opacity-70" />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div className="min-w-0">{href ? <Link href={href} className="font-serif text-2xl leading-tight hover:text-primary sm:text-3xl">{name}</Link> : <p className="font-serif text-2xl leading-tight sm:text-3xl">{name}</p>}<p className="mt-2 text-xs text-muted-foreground">{optionsFor(item).join(' · ') || 'A considered selection'}</p></div><button type="button" onClick={() => removeFromCart(item.cartItemId)} className="flex size-10 shrink-0 items-center justify-center text-muted-foreground hover:text-destructive" aria-label={`Remove ${name}`}><Trash2 className="size-4" /></button></div><div className="mt-5 flex flex-wrap items-end justify-between gap-4"><QuantityControl quantity={item.quantity} onDecrease={() => updateQuantity(item.cartItemId, item.quantity - 1)} onIncrease={() => updateQuantity(item.cartItemId, item.quantity + 1)} /><div className="text-right"><p className="text-xs text-muted-foreground">{formatMoney(unitPrice, currency)} each</p><p className="mt-1 font-serif text-xl tabular-nums">{formatMoney(unitPrice * item.quantity, currency)}</p></div></div></div></article> })}
          <div className="grid grid-cols-3 gap-3 border-b border-border/70 py-7 text-center text-[10px] text-muted-foreground"><div><Truck className="mx-auto mb-2 size-5 text-primary" />Worldwide sourcing<br />& delivery</div><div><ShieldCheck className="mx-auto mb-2 size-5 text-primary" />Secure<br />payments</div><div><ShoppingCart className="mx-auto mb-2 size-5 text-primary" />White glove<br />installation</div></div>
        </section>
        <aside className="h-fit border border-border/70 bg-card p-5 shadow-soft sm:p-7 lg:sticky lg:top-28"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.28em] text-primary">Order summary</p><h2 className="mt-3 font-serif text-4xl font-light">Review your pieces.</h2></div><ShoppingCart className="size-7 text-primary" /></div><div className="mt-6 space-y-4 border-y border-border/70 py-5 text-sm"><div className="flex justify-between gap-4"><span className="text-muted-foreground">Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span><span className="tabular-nums">{formatMoney(cart?.subtotal || 0, cartCurrency)}</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Shipping</span><span className="text-xs text-muted-foreground">Calculated at checkout</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Taxes</span><span className="text-xs text-muted-foreground">Calculated at checkout</span></div></div><div className="flex items-end justify-between gap-4 py-5"><span className="font-serif text-2xl">Total</span><span className="font-serif text-2xl tabular-nums">{formatMoney(cart?.total || 0, cartCurrency)}</span></div>{hasMixedCurrencies || items.some((item) => item.unavailable) ? <span className="flex min-h-12 items-center justify-center bg-muted px-5 text-center text-xs uppercase tracking-[0.14em] text-muted-foreground">Review selection before checkout</span> : <Link href="/checkout" className="flex min-h-12 items-center justify-center gap-2 bg-foreground px-5 text-xs uppercase tracking-[0.14em] text-background">Proceed to checkout <ArrowRight className="size-4" /></Link>}<button type="button" onClick={shareCartOnWhatsApp} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 border border-[#25D366]/60 px-5 text-xs uppercase tracking-[0.14em] text-[#168c45] hover:bg-[#25D366]/10"><MessageCircle className="size-4" /> Chat on WhatsApp to order</button><p className="mt-4 text-center text-xs leading-6 text-muted-foreground">Prefer a personal touch? Chat with our team for product advice, custom requests, and final delivery guidance.</p><Link href="/collections" className="mt-5 flex min-h-11 items-center justify-center border border-border px-5 text-xs uppercase tracking-[0.14em] hover:bg-muted">Continue shopping</Link></aside></div>

        {recommendations.length > 0 && <section className="mt-16 border-t border-border/70 pt-10 sm:mt-24 sm:pt-14"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.28em] text-primary">Continue exploring</p><h2 className="mt-3 font-serif text-4xl font-light sm:text-5xl">You may also like.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Complete the room with pieces selected from the current collection.</p></div><Link href="/collections" className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary hover:underline">View all collections <ArrowRight className="size-4" /></Link></div><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">{recommendations.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>}
      </div>
    </main>
    <SiteFooter />
  </>
}
