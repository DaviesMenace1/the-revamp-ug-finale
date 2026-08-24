'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCart } from '@/lib/context/cart-context'
import { formatMoney, normalizeCurrency } from '@/lib/utils'

declare global {
  interface Window {
    FlutterwaveCheckout?: (config: Record<string, unknown>) => void
  }
}

function getProductImage(item: any): string | null {
  const product = item?.product
  const image = item?.selectedColor?.image || item?.selectedVariant?.image || item?.image || product?.thumbnailImage || product?.images?.[0]
  if (typeof image === 'string' && image.trim()) return image
  if (image && typeof image === 'object' && typeof image.url === 'string') return image.url
  return null
}

function itemUnitPrice(item: any) {
  const value = Number(item?.unitPrice ?? item?.product?.salePrice ?? item?.product?.price ?? item?.price ?? 0)
  return Number.isFinite(value) ? value : 0
}

export default function CheckoutPage() {
  const router = useRouter()
  const { isLoaded: isClerkLoaded, user } = useUser()
  const { items, cart, customerName, setCustomerName, isLoaded: isCartLoaded } = useCart()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: customerName || '', email: '', phone: '', address: '', city: '', country: 'Uganda', notes: '' })

  const currencies = useMemo(() => Array.from(new Set(items.map((item) => normalizeCurrency(item.product?.currency)))), [items])
  const checkoutCurrency = currencies[0] || 'UGX'
  const hasMixedCurrencies = currencies.length > 1
  const hasUnavailableItems = items.some((item) => item.unavailable)
  const checkoutTotal = Number(cart?.total || items.reduce((sum, item) => sum + itemUnitPrice(item) * item.quantity, 0))

  useEffect(() => {
    if (!isClerkLoaded || !user) return
    setFormData((previous) => ({
      ...previous,
      name: user.fullName || user.firstName || previous.name,
      email: user.primaryEmailAddress?.emailAddress || previous.email,
    }))
  }, [isClerkLoaded, user])

  useEffect(() => {
    if (customerName && !formData.name) setFormData((previous) => ({ ...previous, name: customerName }))
  }, [customerName, formData.name])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    if (name === 'name') setCustomerName(value)
  }

  const handlePayWithFlutterwave = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMessage(null)

    if (hasMixedCurrencies) {
      setErrorMessage('This selection contains multiple currencies. Return to the cart and check out each currency separately.')
      return
    }
    if (hasUnavailableItems) {
      setErrorMessage('One or more saved selections need review before payment. Return to the cart to remove or resolve them.')
      return
    }
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.city.trim()) {
      setErrorMessage('Please fill in your name, email, phone, address, and city before continuing.')
      return
    }
    if (typeof window.FlutterwaveCheckout !== 'function') {
      setErrorMessage('Flutterwave is still loading. Check your connection and try again.')
      return
    }

    const rawPublicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY?.trim().replace(/^['"]|['"]$/g, '')
    if (!rawPublicKey || !rawPublicKey.startsWith('FLWPUBK')) {
      setErrorMessage('Payment configuration is incomplete. Please contact support before trying again.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: checkoutTotal,
          currency: checkoutCurrency,
          email: formData.email.trim(),
          customerName: formData.name.trim(),
          phoneNumber: formData.phone.trim(),
          shippingAddress: { name: formData.name.trim(), address: formData.address.trim(), city: formData.city.trim(), country: formData.country.trim(), phone: formData.phone.trim(), notes: formData.notes.trim() },
          items: items.map((item) => ({
            productId: item.productId,
            name: item.product?.name || 'Product',
            quantity: item.quantity,
            unitPrice: itemUnitPrice(item),
            currency: normalizeCurrency(item.product?.currency),
            color: typeof item.selectedColor === 'object' ? item.selectedColor?.name || item.selectedColor?.label : item.selectedColor,
            material: typeof item.selectedMaterial === 'object' ? item.selectedMaterial?.name || item.selectedMaterial?.label : item.selectedMaterial,
            variant: typeof item.selectedVariant === 'object' ? item.selectedVariant?.name || item.selectedVariant?.label : item.selectedVariant,
            dimensions: item.customDimensions,
            image: getProductImage(item),
          })),
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.txRef) throw new Error(data?.error || 'We could not initialize this order. Please try again.')

      setLoading(false)
      window.FlutterwaveCheckout({
        public_key: rawPublicKey,
        tx_ref: data.txRef,
        amount: checkoutTotal,
        currency: checkoutCurrency,
        payment_options: 'card,mobilemoneyuganda,banktransfer',
        customer: { email: formData.email.trim(), phone_number: formData.phone.trim(), name: formData.name.trim() },
        customizations: { title: 'The Revamp UG', description: `Order #${data.txRef}` },
        callback: (result: any) => router.push(`/checkout/success?tx_ref=${result.tx_ref}&transaction_id=${result.transaction_id}`),
        onclose: () => setLoading(false),
      })
    } catch (error) {
      console.error('Checkout error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected checkout error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!isClerkLoaded || !isCartLoaded) {
    return <><SiteHeader /><main className="flex min-h-dvh items-center justify-center px-6 pt-20"><Loader2 className="size-7 animate-spin text-primary" aria-label="Loading checkout" /></main><SiteFooter /></>
  }

  if (items.length === 0) {
    return <><SiteHeader /><main className="flex min-h-[70dvh] items-center justify-center px-6 pt-20"><div className="max-w-md text-center"><ShoppingBag className="mx-auto mb-5 size-10 text-primary" aria-hidden="true" /><h1 className="font-serif text-5xl tracking-tight">Nothing to check out yet</h1><p className="mt-4 text-sm leading-7 text-muted-foreground">Return to the collection to choose a considered piece for your space.</p><Link href="/collections" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-6 text-xs font-medium uppercase tracking-[0.16em] text-primary-foreground">Return to shop</Link></div></main><SiteFooter /></>
  }

  return (
    <div className="min-h-screen bg-background">
      <Script src="https://checkout.flutterwave.com/v3.js" strategy="afterInteractive" />
      <SiteHeader />
      <main className="px-4 pb-24 pt-28 sm:px-6 md:px-10 md:pt-36">
        <div className="mx-auto max-w-7xl">
          <Link href="/cart" className="inline-flex min-h-11 items-center text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="mr-2 size-4" aria-hidden="true" /> Back to selection</Link>
          <div className="mt-7 max-w-2xl"><p className="text-[10px] uppercase tracking-[0.3em] text-primary">Secure order</p><h1 className="mt-3 font-serif text-5xl tracking-tight md:text-6xl">Checkout</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Confirm your details and review your selection before secure payment.</p></div>

          {errorMessage && <div role="alert" className="mt-7 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive"><CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{errorMessage}</span></div>}
          {hasMixedCurrencies && <div role="alert" className="mt-4 rounded-lg border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">Your selection includes {currencies.join(' and ')}. Payment is paused until the cart contains one currency.</div>}

          <form onSubmit={handlePayWithFlutterwave} className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
            <div className="space-y-8">
              <section className="rounded-xl border border-border/70 bg-card p-5 shadow-lift sm:p-7">
                <div className="border-b border-border/70 pb-5"><p className="text-[10px] uppercase tracking-[0.24em] text-primary">01</p><h2 className="mt-2 font-serif text-3xl">Shipping information</h2></div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor="name">Full name</Label><Input id="name" name="name" required value={formData.name} onChange={handleInputChange} placeholder="e.g. Jane Doe" className="min-h-12 rounded-md bg-background" /></div>
                  <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} placeholder="jane@example.com" className="min-h-12 rounded-md bg-background" /></div>
                  <div className="space-y-2"><Label htmlFor="phone">Phone / mobile money</Label><Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleInputChange} placeholder="+256 700 000000" className="min-h-12 rounded-md bg-background" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor="address">Street address</Label><Input id="address" name="address" required value={formData.address} onChange={handleInputChange} placeholder="Plot / Street / Delivery address" className="min-h-12 rounded-md bg-background" /></div>
                  <div className="space-y-2"><Label htmlFor="city">City / region</Label><Input id="city" name="city" required value={formData.city} onChange={handleInputChange} placeholder="Kampala" className="min-h-12 rounded-md bg-background" /></div>
                  <div className="space-y-2"><Label htmlFor="country">Country</Label><Input id="country" name="country" value={formData.country} onChange={handleInputChange} className="min-h-12 rounded-md bg-background" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor="notes">Delivery notes <span className="font-normal text-muted-foreground">(optional)</span></Label><textarea id="notes" name="notes" rows={3} value={formData.notes} onChange={handleInputChange} placeholder="Anything our delivery team should know?" className="w-full resize-y rounded-md border border-input bg-background px-3 py-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring" /></div>
                </div>
              </section>

              <section className="rounded-xl border border-border/70 bg-card p-5 shadow-lift sm:p-7"><div className="border-b border-border/70 pb-5"><p className="text-[10px] uppercase tracking-[0.24em] text-primary">02</p><h2 className="mt-2 font-serif text-3xl">Payment method</h2></div><div className="mt-6 flex items-start gap-4 rounded-lg border border-border/70 bg-muted/30 p-4"><CreditCard className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" /><div><p className="text-sm font-medium">Flutterwave secure checkout</p><p className="mt-1 text-xs leading-6 text-muted-foreground">Pay by card, MTN Mobile Money, Airtel Money, or bank transfer through the secure Flutterwave overlay.</p></div></div></section>

              <Button type="submit" disabled={loading || hasMixedCurrencies || hasUnavailableItems} className="min-h-14 w-full rounded-md bg-primary text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground hover:bg-primary/90">{loading ? <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Preparing payment…</span> : <span className="flex items-center gap-2"><Lock className="size-4" aria-hidden="true" /> Pay {formatMoney(checkoutTotal, checkoutCurrency)} securely</span>}</Button>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-emerald-600" aria-hidden="true" /> Encrypted payment via Flutterwave</div>
            </div>

            <aside className="h-fit rounded-xl border border-border/70 bg-card p-5 shadow-editorial sm:p-6 lg:sticky lg:top-28"><div className="flex items-end justify-between gap-4 border-b border-border/70 pb-5"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Your selection</p><h2 className="mt-2 font-serif text-3xl">Summary</h2></div><span className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? 'piece' : 'pieces'}</span></div>
              <div className="mt-5 max-h-80 space-y-4 overflow-y-auto pr-1">
                {items.map((item) => { const image = getProductImage(item); const unitPrice = itemUnitPrice(item); const currency = normalizeCurrency(item.product?.currency); return <div key={item.cartItemId} className="flex gap-3 border-b border-border/60 pb-4 last:border-0 last:pb-0"><div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">{image ? <Image src={image} alt="" fill sizes="64px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-primary"><ShoppingBag className="size-5" aria-hidden="true" /></div>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.product?.name || 'Saved selection'}</p><p className="mt-1 text-xs text-muted-foreground">Qty {item.quantity} · {formatMoney(unitPrice, currency)}</p>{item.customDimensions && <p className="mt-1 flex items-center gap-1 text-[10px] text-primary"><Sparkles className="size-3" aria-hidden="true" /> Bespoke sizing</p>}</div><p className="text-right text-sm font-medium tabular-nums">{formatMoney(unitPrice * item.quantity, currency)}</p></div> })}
              </div>
              <div className="mt-5 space-y-3 border-t border-border/70 pt-5 text-sm"><div className="flex justify-between gap-4 text-muted-foreground"><span>Subtotal</span><span className="tabular-nums text-foreground">{formatMoney(cart?.subtotal || 0, checkoutCurrency)}</span></div><div className="flex justify-between gap-4 text-muted-foreground"><span>Delivery</span><span className="text-right text-xs">Confirmed after quotation</span></div><div className="flex justify-between gap-4 border-t border-border/70 pt-4 font-serif text-2xl text-foreground"><span>Total</span><span className="tabular-nums text-primary">{formatMoney(checkoutTotal, checkoutCurrency)}</span></div></div>
              <Link href="/cart" className="mt-5 inline-flex min-h-11 items-center justify-center text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground hover:underline">Edit selection</Link>
            </aside>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
