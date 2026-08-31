'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from '@/components/ui/luxury-icons'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useCart } from '@/lib/context/cart-context'
import { DEFAULT_PRODUCT_IMAGE, formatMoney, normalizeCurrency, resolveProductImageUrls } from '@/lib/utils'

function getImage(item: any) {
  const image = item.image || item.selectedColor?.image || item.selectedVariant?.image
  if (typeof image === 'string' && image.trim()) return image
  if (image && typeof image === 'object' && typeof image.url === 'string' && image.url.trim()) return image.url
  return resolveProductImageUrls(item.product)[0] || DEFAULT_PRODUCT_IMAGE
}

function Option({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="flex gap-2 text-xs leading-5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function ProductOptions({ item }: { item: any }) {
  const dimensions = item.customDimensions
  const dimensionText = dimensions && Object.entries(dimensions)
    .filter(([key, value]) => key !== 'unit' && value !== undefined && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join(' × ')
  const accessories = Array.isArray(item.selectedAccessories)
    ? item.selectedAccessories.map((accessory: any) => accessory.label || accessory.name).filter(Boolean).join(', ')
    : ''

  return (
    <div className="mt-4 space-y-1 border-t border-border/70 pt-3">
      <Option label="Colour" value={item.selectedColor?.label || item.selectedColor?.name} />
      <Option label="Fabric" value={item.selectedFabric?.label || item.selectedFabric?.name} />
      <Option label="Material" value={item.selectedMaterial?.label || item.selectedMaterial?.name} />
      <Option label="Variant" value={item.selectedVariant?.label || item.selectedVariant?.name} />
      <Option label="Add-ons" value={accessories} />
      {dimensionText && <Option label="Custom dimensions" value={`${dimensionText} ${dimensions?.unit || 'in'}`} />}
    </div>
  )
}

function QuantityControl({ quantity, onDecrease, onIncrease }: { quantity: number; onDecrease: () => void; onIncrease: () => void }) {
  return (
    <div className="inline-flex items-center rounded-md border border-border/80 bg-background" aria-label="Quantity">
      <button type="button" onClick={onDecrease} className="flex size-11 items-center justify-center text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Decrease quantity">
        <Minus className="size-3.5" aria-hidden="true" />
      </button>
      <span className="min-w-10 text-center text-sm tabular-nums" aria-live="polite">{quantity}</span>
      <button type="button" onClick={onIncrease} className="flex size-11 items-center justify-center text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Increase quantity">
        <Plus className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

export default function CartPage() {
  const { items, cart, updateQuantity, removeFromCart, clearCart, isLoaded } = useCart()
  const currencies = Array.from(new Set(items.map((item) => normalizeCurrency(item.currency ?? item.product?.currency))))
  const hasMixedCurrencies = currencies.length > 1
  const cartCurrency = currencies[0] || 'UGX'

  if (!isLoaded) {
    return (
      <>
        <SiteHeader />
        <main className="flex min-h-dvh items-center justify-center px-6 pt-20"><p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Loading your selection…</p></main>
        <SiteFooter />
      </>
    )
  }

  if (items.length === 0) {
    return (
      <>
        <SiteHeader />
        <main className="flex min-h-[70dvh] items-center justify-center px-6 pt-20">
          <div className="max-w-md text-center">
            <ShoppingBag className="mx-auto mb-6 size-10 text-primary" aria-hidden="true" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Your selection</p>
            <h1 className="mt-3 font-serif text-5xl tracking-tight">Your cart is empty</h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">Discover furniture, lighting, architectural finishes, and beautifully sourced pieces from The Revamp UG.</p>
            <Link href="/collections" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-6 text-xs font-medium uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              Explore Collections  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background px-4 pb-24 pt-28 sm:px-6 md:px-10 md:pt-36">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Your selection</p>
              <h1 className="mt-3 font-serif text-5xl tracking-tight">Cart</h1>
              <p className="mt-2 text-sm text-muted-foreground">{items.length} {items.length === 1 ? 'piece' : 'pieces'} selected · Prices shown in {cartCurrency}</p>
            </div>
            <button type="button" onClick={() => window.confirm('Clear everything from your cart?') && clearCart()} className="min-h-11 self-start text-xs uppercase tracking-[0.16em] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline sm:self-auto">Clear cart</button>
          </header>

          {hasMixedCurrencies && (
            <div role="alert" className="mb-6 rounded-lg border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-50">
              This selection contains more than one currency. Separate checkout is required so we never combine incompatible amounts.
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
            <section className="space-y-4" aria-label="Cart items">
              {items.map((item) => {
                const name = item.product?.name || 'Saved selection'
                const slug = item.product?.slug
                const itemHref = item.unavailable || !slug ? null : `/collections/${slug}`
                const image = getImage(item)
                const currency = normalizeCurrency(item.currency ?? item.product?.currency)
                const unitPrice = Number(item.unitPrice ?? item.product?.salePrice ?? item.product?.price ?? 0)
                const total = unitPrice * item.quantity

                return (
                  <article key={item.cartItemId} className="rounded-xl border border-border/70 bg-card p-4 shadow-lift sm:p-5">
                    <div className="flex gap-4 sm:gap-6">
                      {itemHref ? (
                        <Link href={itemHref} className="relative block aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-36" aria-label={`View ${name}`}>
                          {image ? <Image src={image} alt={name} fill className="object-cover" sizes="144px" /> : <div className="flex h-full items-center justify-center text-primary"><ShoppingBag className="size-6" aria-hidden="true" /></div>}
                        </Link>
                      ) : (
                        <div className="relative flex aspect-[4/5] w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-primary sm:w-36" aria-label="Saved selection image unavailable">
                          {image ? <Image src={image} alt="" fill className="object-cover opacity-70" sizes="144px" /> : <ShoppingBag className="size-6" aria-hidden="true" />}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {itemHref ? <Link href={itemHref} className="font-serif text-2xl leading-tight text-foreground transition-colors hover:text-primary hover:underline">{name}</Link> : <p className="font-serif text-2xl leading-tight text-foreground">{name}</p>}
                            {item.product?.sku && <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">SKU {item.product.sku}</p>}
                          </div>
                          <button type="button" onClick={() => removeFromCart(item.cartItemId)} className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Remove ${name}`}>
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>

                        {item.unavailable && <p role="status" className="mt-3 text-xs leading-5 text-amber-800 dark:text-amber-200">This saved selection needs review before checkout because its product details are unavailable.</p>}
                        <ProductOptions item={item} />

                        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                          <QuantityControl quantity={item.quantity} onDecrease={() => updateQuantity(item.cartItemId, item.quantity - 1)} onIncrease={() => updateQuantity(item.cartItemId, item.quantity + 1)} />
                          <div className="text-right">
                            <p className="text-xs tabular-nums text-muted-foreground">{formatMoney(unitPrice, currency)} each</p>
                            <p className="mt-1 font-serif text-2xl tabular-nums text-foreground">{formatMoney(total, currency)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </section>

            <aside className="h-fit rounded-xl border border-border/70 bg-card p-5 shadow-editorial lg:sticky lg:top-28 sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Order summary</p>
              <div className="mt-5 space-y-4 border-b border-border/70 pb-5">
                <div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium tabular-nums">{formatMoney(cart?.subtotal || 0, cartCurrency)}</span></div>
                <div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">Delivery</span><span className="text-right text-xs text-muted-foreground">Calculated after quotation</span></div>
              </div>
              <div className="flex items-end justify-between gap-4 py-5"><span className="font-serif text-2xl">Estimated total</span><span className="text-right font-serif text-2xl tabular-nums">{formatMoney(cart?.total || 0, cartCurrency)}</span></div>
              {hasMixedCurrencies || items.some((item) => item.unavailable) ? (
                <span className="flex min-h-12 cursor-not-allowed items-center justify-center rounded-md bg-muted px-5 text-center text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Review selection before checkout</span>
              ) : (
                <Link href="/checkout" className="flex min-h-12 items-center justify-center rounded-md bg-primary px-5 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Continue to checkout</Link>
              )}
              <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">Final delivery, installation, and customisation costs may be confirmed during quotation.</p>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
