'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUser } from '@clerk/nextjs'
import { ArrowLeft, Check, CheckCircle2, CreditCard, Home, Loader2, Lock, MapPin, Pencil, Plus, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Store } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCart } from '@/lib/context/cart-context'
import { DEFAULT_PRODUCT_IMAGE, formatMoney, normalizeCurrency, resolveProductImageUrls } from '@/lib/utils'
import PickupStationMap from '@/components/delivery/pickup-station-map'

function getProductImage(item: any): string {
  const image = item?.selectedColor?.image || item?.selectedVariant?.image || item?.image
  if (typeof image === 'string' && image.trim()) return image
  if (image && typeof image === 'object' && typeof image.url === 'string' && image.url.trim()) return image.url
  return resolveProductImageUrls(item?.product)[0] || DEFAULT_PRODUCT_IMAGE
}

function itemUnitPrice(item: any) {
  const value = Number(item?.unitPrice ?? item?.product?.salePrice ?? item?.product?.price ?? item?.price ?? 0)
  return Number.isFinite(value) ? value : 0
}

type AuthorizationChallenge = { orderRef: string; chargeId: string; authorizationType: 'pin' | 'otp' }

type CheckoutLoyalty = {
  balancePoints: number
  rules: {
    redemptionUgxPerPoint: number
    redemptionCapPercent: number
  }
}

type CheckoutPromotion = {
  promotion: {
    id: string
    name: string
    code: string
    discountType: string
    discountValue: string
    maxDiscount: string | null
    audience: string
    stackable: boolean
  }
  discountAmount: number
  eligibleItemTotal: number
}

type SavedAddress = {
  id: string
  label: string
  recipientName: string
  phone: string
  address: string
  city: string
  region: string | null
  country: string
  notes: string | null
  isDefault: boolean
}

type PickupStation = {
  id: string
  name: string
  address: string
  city: string
  region: string | null
  country: string
  phone: string | null
  instructions: string | null
  fee: string
}

export default function CheckoutPage() {
  const { isLoaded: isClerkLoaded, user } = useUser()
  const { items, cart, customerName, setCustomerName, isLoaded: isCartLoaded } = useCart()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [paymentInstruction, setPaymentInstruction] = useState<string | null>(null)
  const [authorizationChallenge, setAuthorizationChallenge] = useState<AuthorizationChallenge | null>(null)
  const [authorizationCode, setAuthorizationCode] = useState('')
  const [paymentMode, setPaymentMode] = useState<'pay_now' | 'pay_on_delivery'>('pay_now')
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card'>('mobile_money')
  const [mobileMoneyNetwork, setMobileMoneyNetwork] = useState<'MTN' | 'AIRTEL'>('MTN')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiryMonth, setCardExpiryMonth] = useState('')
  const [cardExpiryYear, setCardExpiryYear] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [loyalty, setLoyalty] = useState<CheckoutLoyalty | null>(null)
  const [loyaltyPoints, setLoyaltyPoints] = useState('0')
  const [promotionCode, setPromotionCode] = useState('')
  const [promotionQuote, setPromotionQuote] = useState<CheckoutPromotion | null>(null)
  const [promotionLoading, setPromotionLoading] = useState(false)
  const [promotionError, setPromotionError] = useState<string | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<'door_delivery' | 'pickup_station'>('door_delivery')
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [pickupStations, setPickupStations] = useState<PickupStation[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [editingAddressId, setEditingAddressId] = useState('')
  const [selectedPickupStationId, setSelectedPickupStationId] = useState('')
  const [saveAddress, setSaveAddress] = useState(true)
  const [deliveryLoading, setDeliveryLoading] = useState(true)
  const [deliveryError, setDeliveryError] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', city: '', region: '', country: 'Uganda', notes: '' })
  const defaultName = user?.fullName || user?.firstName || customerName || ''
  const defaultEmail = user?.primaryEmailAddress?.emailAddress || ''
  const currentName = formData.name || defaultName
  const currentEmail = formData.email || defaultEmail

  const currencies = useMemo(() => Array.from(new Set(items.map((item) => normalizeCurrency(item.currency ?? item.product?.currency)))), [items])
  const checkoutCurrency = currencies[0] || 'UGX'
  const hasMixedCurrencies = currencies.length > 1
  const hasUnavailableItems = items.some((item) => item.unavailable)
  const checkoutTotal = Number(cart?.total || items.reduce((sum, item) => sum + itemUnitPrice(item) * item.quantity, 0))
  const checkoutSubtotal = Number(cart?.subtotal || checkoutTotal)
  const maximumRedeemablePoints = loyalty ? Math.floor((checkoutSubtotal * loyalty.rules.redemptionCapPercent / 100) / loyalty.rules.redemptionUgxPerPoint) : 0
  const selectedLoyaltyPoints = promotionQuote && !promotionQuote.promotion.stackable ? 0 : Math.min(Math.max(0, Math.floor(Number(loyaltyPoints) || 0)), Math.max(0, maximumRedeemablePoints), loyalty?.balancePoints ?? 0)
  const loyaltyDiscountPreview = loyalty ? selectedLoyaltyPoints * loyalty.rules.redemptionUgxPerPoint : 0
  const promotionDiscountPreview = promotionQuote?.discountAmount || 0
  const selectedPickupStation = pickupStations.find((station) => station.id === selectedPickupStationId) || null
  const selectedPickupFee = deliveryMethod === 'pickup_station' && selectedPickupStation ? Math.max(0, Number(selectedPickupStation.fee) || 0) : 0
  const checkoutGrossTotal = checkoutTotal + selectedPickupFee
  const paymentTotal = Math.max(0, checkoutGrossTotal - promotionDiscountPreview - loyaltyDiscountPreview)

  async function applyPromotion() {
    const code = promotionCode.trim()
    if (!code) {
      setPromotionError('Enter a collection promo code first.')
      setPromotionQuote(null)
      return
    }
    setPromotionLoading(true)
    setPromotionError(null)
    try {
      const response = await fetch('/api/checkout/promotion-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, currency: checkoutCurrency, items: items.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: itemUnitPrice(item) })) }),
      })
      const data = await response.json().catch(() => null) as { quote?: CheckoutPromotion; error?: string } | null
      if (!response.ok || !data?.quote) throw new Error(data?.error || 'That collection promo code could not be applied.')
      setPromotionQuote(data.quote)
      if (!data.quote.promotion.stackable) setLoyaltyPoints('0')
    } catch (error) {
      setPromotionQuote(null)
      setPromotionError(error instanceof Error ? error.message : 'That collection promo code could not be applied.')
    } finally {
      setPromotionLoading(false)
    }
  }

  useEffect(() => {
    if (!isClerkLoaded || !user) return
    let cancelled = false
    fetch('/api/loyalty/summary', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null
        const result = await response.json() as { loyalty?: CheckoutLoyalty | null }
        return result.loyalty ?? null
      })
      .then((result) => {
        if (!cancelled) setLoyalty(result)
      })
      .catch(() => {
        if (!cancelled) setLoyalty(null)
      })
    return () => { cancelled = true }
  }, [isClerkLoaded, user])

  useEffect(() => {
    if (!isClerkLoaded || !user) return
    let cancelled = false
    Promise.all([
      fetch('/api/account/addresses', { cache: 'no-store' }),
      fetch('/api/pickup-stations', { cache: 'no-store' }),
    ])
      .then(async ([addressesResponse, stationsResponse]) => {
        const addressesPayload = addressesResponse.ok ? await addressesResponse.json() as { addresses?: SavedAddress[] } : null
        const stationsPayload = stationsResponse.ok ? await stationsResponse.json() as { stations?: PickupStation[] } : null
        if (cancelled) return
        const addresses = Array.isArray(addressesPayload?.addresses) ? addressesPayload.addresses : []
        const stations = Array.isArray(stationsPayload?.stations) ? stationsPayload.stations : []
        setSavedAddresses(addresses)
        setPickupStations(stations)
        const defaultAddress = addresses.find((address) => address.isDefault) || addresses[0]
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
          setFormData((current) => ({ ...current, name: defaultAddress.recipientName, phone: defaultAddress.phone, address: defaultAddress.address, city: defaultAddress.city, region: defaultAddress.region || '', country: defaultAddress.country, notes: defaultAddress.notes || current.notes }))
        }
        if (stations.length > 0) setSelectedPickupStationId(stations[0].id)
      })
      .catch(() => {
        if (!cancelled) setDeliveryError('Saved delivery choices could not be loaded. You can still enter a new delivery address.')
      })
      .finally(() => {
        if (!cancelled) setDeliveryLoading(false)
      })
    return () => { cancelled = true }
  }, [isClerkLoaded, user])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    if (selectedAddressId && ['name', 'phone', 'address', 'city', 'region', 'country', 'notes'].includes(name)) setSelectedAddressId('')
    if (name === 'name') setCustomerName(value)
  }

  const selectAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id)
    setEditingAddressId(address.id)
    setFormData((current) => ({ ...current, name: address.recipientName, phone: address.phone, address: address.address, city: address.city, region: address.region || '', country: address.country, notes: address.notes || current.notes }))
    setDeliveryError(null)
  }

  const startNewAddress = () => {
    setSelectedAddressId('')
    setEditingAddressId('')
    setFormData((current) => ({ ...current, address: '', city: '', region: '', notes: '' }))
    setDeliveryError(null)
  }

  const submitAuthorization = async () => {
    if (!authorizationChallenge || !authorizationCode.trim()) return
    setErrorMessage(null)
    setLoading(true)
    try {
      const response = await fetch('/api/checkout/authorize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderRef: authorizationChallenge.orderRef, chargeId: authorizationChallenge.chargeId, authorizationType: authorizationChallenge.authorizationType, code: authorizationCode.trim() }) })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'The payment authorization was not accepted.')
      if (typeof data?.paymentUrl === 'string' && data.paymentUrl) {
        window.location.assign(data.paymentUrl)
        return
      }
      if (data?.status === 'paid') {
        window.location.assign(`/checkout/success?orderRef=${encodeURIComponent(authorizationChallenge.orderRef)}`)
        return
      }
      if (data?.authorizationType === 'pin' || data?.authorizationType === 'otp') {
        setAuthorizationChallenge((current) => current ? { ...current, authorizationType: data.authorizationType } : current)
        setAuthorizationCode('')
        setPaymentInstruction(data.authorizationType === 'pin' ? 'Enter the Sandbox card PIN to continue.' : 'Enter the Sandbox OTP to complete the card payment.')
      } else {
        setPaymentInstruction(typeof data?.paymentInstruction === 'string' ? data.paymentInstruction : 'The payment is still being authorized. Please wait a moment and try again.')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'We could not authorize the payment. Please try again.')
    } finally {
      setLoading(false)
    }
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
    if (!currentName.trim() || !currentEmail.trim() || !formData.phone.trim() || (deliveryMethod === 'door_delivery' && (!formData.address.trim() || !formData.city.trim())) || (deliveryMethod === 'pickup_station' && !selectedPickupStationId)) {
      setErrorMessage(deliveryMethod === 'pickup_station' ? 'Please choose a pickup station before continuing.' : 'Please fill in your name, email, phone, address, and city before continuing.')
      return
    }
    setPaymentInstruction(null)

    setLoading(true)
    try {
      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: checkoutGrossTotal,
          currency: checkoutCurrency,
          email: currentEmail.trim(),
          customerName: currentName.trim(),
          phoneNumber: formData.phone.trim(),
          deliveryMethod,
          addressId: deliveryMethod === 'door_delivery' ? (saveAddress ? selectedAddressId || editingAddressId || undefined : selectedAddressId || undefined) : undefined,
          pickupStationId: deliveryMethod === 'pickup_station' ? selectedPickupStationId : undefined,
          saveAddress: deliveryMethod === 'door_delivery' && saveAddress,
          shippingAddress: { name: currentName.trim(), address: formData.address.trim(), city: formData.city.trim(), region: formData.region.trim(), country: formData.country.trim(), phone: formData.phone.trim(), notes: formData.notes.trim(), deliveryMethod, addressId: saveAddress ? selectedAddressId || editingAddressId || undefined : selectedAddressId || undefined, pickupStationId: selectedPickupStationId || undefined },
          loyaltyPoints: selectedLoyaltyPoints,
          promotionCode: promotionQuote?.promotion.code || undefined,
          paymentMode,
            paymentMethod,
            mobileMoneyNetwork,
            cardNumber,
            cardExpiryMonth,
            cardExpiryYear,
            cardCvv,
            items: items.map((item) => ({
              productId: item.productId,
              name: item.product?.name || 'Product',
              quantity: item.quantity,
              unitPrice: itemUnitPrice(item),
              currency: normalizeCurrency(item.currency ?? item.product?.currency),
              color: item.selectedColor,
              fabric: item.selectedFabric,
              material: item.selectedMaterial,
              variant: item.selectedVariant,
              accessories: item.selectedAccessories,
              selectedOptions: item.selectedOptions,
              customDimensions: item.customDimensions,
              dimensions: item.customDimensions,
              image: getProductImage(item),
            })),
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.txRef) throw new Error(data?.error || 'We could not initialize this order. Please try again.')

      setLoading(false)
      if (data.paymentMode === 'pay_on_delivery') {
        window.location.assign(`/checkout/success?orderRef=${encodeURIComponent(data.txRef)}`)
        return
      }
      if (data.status === 'paid') {
        window.location.assign(`/checkout/success?orderRef=${encodeURIComponent(data.txRef)}`)
        return
      }
      if (typeof data.paymentUrl === 'string' && data.paymentUrl) {
        window.location.assign(data.paymentUrl)
        return
      }
      if (typeof data.paymentInstruction === 'string' && data.paymentInstruction) {
        setPaymentInstruction(data.paymentInstruction)
        return
      }
      if (typeof data.chargeId === 'string' && (data.authorizationType === 'pin' || data.authorizationType === 'otp')) {
        setAuthorizationChallenge({ orderRef: data.txRef, chargeId: data.chargeId, authorizationType: data.authorizationType })
        setPaymentInstruction(data.authorizationType === 'pin' ? 'Enter the Sandbox card PIN to continue.' : 'Enter the Sandbox OTP to complete the card payment.')
        return
      }
      if (typeof data.chargeId === 'string' && data.chargeId) {
        window.location.assign(`/checkout/pending?orderRef=${encodeURIComponent(data.txRef)}&message=${encodeURIComponent('Flutterwave created your payment. We are checking its status now.')}`)
        return
      }
      throw new Error('Flutterwave could not start an authorization step. Please try again or choose another payment method.')
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
      <SiteHeader />
      <main className="px-4 pb-24 pt-28 sm:px-6 md:px-10 md:pt-36">
        <div className="mx-auto max-w-7xl">
          <Link href="/cart" className="inline-flex min-h-11 items-center text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="mr-2 size-4" aria-hidden="true" /> Back to selection</Link>
          <div className="mt-7 max-w-2xl"><p className="text-[10px] uppercase tracking-[0.3em] text-primary">Secure order</p><h1 className="mt-3 font-serif text-5xl tracking-tight md:text-6xl">Checkout</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Confirm your details and review your selection before secure payment.</p></div>

          {errorMessage && <div role="alert" className="mt-7 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive"><CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{errorMessage}</span></div>}
          {hasMixedCurrencies && <div role="alert" className="mt-4 rounded-lg border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-50">Your selection includes {currencies.join(' and ')}. Payment is paused until the cart contains one currency.</div>}

          <form onSubmit={handlePayWithFlutterwave} className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
            <div className="order-2 space-y-8 lg:order-none">
              <section className="rounded-xl border border-border/70 bg-card p-5 shadow-lift sm:p-7">
                <div className="border-b border-border/70 pb-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-primary">01</p>
                  <h2 className="mt-2 font-serif text-3xl">Delivery details</h2>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">Choose where you would like to receive your order. Your saved choices remain editable for future checkouts.</p>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => setDeliveryMethod('door_delivery')} aria-pressed={deliveryMethod === 'door_delivery'} className={`flex min-h-14 items-center gap-3 rounded-lg border px-4 text-left transition-colors ${deliveryMethod === 'door_delivery' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/60'}`}>
                    <Home className="size-5 shrink-0" aria-hidden="true" />
                    <span><span className="block text-sm font-medium">Door delivery</span><span className="text-xs opacity-70">Deliver to your address</span></span>
                  </button>
                  <button type="button" onClick={() => setDeliveryMethod('pickup_station')} aria-pressed={deliveryMethod === 'pickup_station'} className={`flex min-h-14 items-center gap-3 rounded-lg border px-4 text-left transition-colors ${deliveryMethod === 'pickup_station' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/60'}`}>
                    <Store className="size-5 shrink-0" aria-hidden="true" />
                    <span><span className="block text-sm font-medium">Pickup station</span><span className="text-xs opacity-70">Collect from a Revamp location</span></span>
                  </button>
                </div>
                {deliveryError && <p role="alert" className="mt-4 rounded-md border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-50">{deliveryError}</p>}
                {deliveryLoading ? (
                  <div className="mt-6 flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> Loading delivery choices…</div>
                ) : deliveryMethod === 'pickup_station' ? (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">Choose a pickup station</p><p className="mt-1 text-xs text-muted-foreground">Select a station on the map or from the list.</p></div><MapPin className="size-4 text-primary" aria-hidden="true" /></div>
                    <PickupStationMap stations={pickupStations} selectedId={selectedPickupStationId} onSelect={(station) => setSelectedPickupStationId(station.id)} />
                  </div>
                ) : (
                  <div className="mt-6 space-y-5">
                    {savedAddresses.length > 0 && <div className="space-y-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">Saved addresses</p><p className="mt-1 text-xs text-muted-foreground">Select one to fill the form instantly.</p></div><button type="button" onClick={startNewAddress} className="inline-flex min-h-10 items-center gap-1 text-xs font-medium text-primary hover:underline"><Plus className="size-3.5" aria-hidden="true" /> New address</button></div><div className="grid gap-3 sm:grid-cols-2">{savedAddresses.map((address) => <button key={address.id} type="button" onClick={() => selectAddress(address)} aria-pressed={selectedAddressId === address.id} className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${selectedAddressId === address.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/60'}`}><span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${selectedAddressId === address.id ? 'border-primary' : 'border-muted-foreground/50'}`}>{selectedAddressId === address.id && <Check className="size-3 text-primary" aria-hidden="true" />}</span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{address.label}{address.isDefault && <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-primary">Default</span>}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{address.address}, {address.city}</span><span className="mt-1 block text-xs text-muted-foreground">{address.phone}</span></span><Pencil className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" /></button>)}</div></div>}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2"><Label htmlFor="name">Full name</Label><Input id="name" name="name" required value={currentName} onChange={handleInputChange} placeholder="e.g. Jane Doe" className="min-h-12 rounded-md bg-background" /></div>
                      <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" required value={currentEmail} onChange={handleInputChange} placeholder="jane@example.com" className="min-h-12 rounded-md bg-background" /></div>
                      <div className="space-y-2"><Label htmlFor="phone">Phone / mobile money</Label><Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleInputChange} placeholder="+256 700 000000" className="min-h-12 rounded-md bg-background" /></div>
                      <div className="space-y-2 sm:col-span-2"><Label htmlFor="address">Street address</Label><Input id="address" name="address" required value={formData.address} onChange={handleInputChange} placeholder="Plot / Street / Delivery address" className="min-h-12 rounded-md bg-background" /></div>
                      <div className="space-y-2"><Label htmlFor="city">City / region</Label><Input id="city" name="city" required value={formData.city} onChange={handleInputChange} placeholder="Kampala" className="min-h-12 rounded-md bg-background" /></div>
                      <div className="space-y-2"><Label htmlFor="region">Area / neighborhood <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="region" name="region" value={formData.region} onChange={handleInputChange} placeholder="Kyanja" className="min-h-12 rounded-md bg-background" /></div>
                      <div className="space-y-2 sm:col-span-2"><Label htmlFor="country">Country</Label><Input id="country" name="country" value={formData.country} onChange={handleInputChange} className="min-h-12 rounded-md bg-background" /></div>
                      <div className="space-y-2 sm:col-span-2"><Label htmlFor="notes">Delivery notes <span className="font-normal text-muted-foreground">(optional)</span></Label><textarea id="notes" name="notes" rows={3} value={formData.notes} onChange={handleInputChange} placeholder="Anything our delivery team should know?" className="w-full resize-y rounded-md border border-input bg-background px-3 py-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring" /></div>
                    </div>
                    <label className="flex items-start gap-3 rounded-md border border-border/70 bg-muted/20 p-3 text-sm"><input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} className="mt-0.5 size-4 accent-primary" /><span><span className="block font-medium">Save this address for next time</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">You can change or remove saved addresses from a future checkout.</span></span></label>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-border/70 bg-card p-5 shadow-lift sm:p-7"><div className="border-b border-border/70 pb-5"><p className="text-[10px] uppercase tracking-[0.24em] text-primary">02</p><h2 className="mt-2 font-serif text-3xl">Payment</h2><p className="mt-2 text-xs leading-6 text-muted-foreground">Choose when you would like to pay. Your selection is recorded with the order.</p></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setPaymentMode('pay_now')} aria-pressed={paymentMode === 'pay_now'} className={`flex min-h-16 items-center gap-3 rounded-lg border px-4 text-left transition-colors ${paymentMode === 'pay_now' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/60'}`}><CreditCard className="size-5 shrink-0" aria-hidden="true" /><span><span className="block text-sm font-medium">Pay now</span><span className="text-xs opacity-70">Secure card or mobile money payment</span></span></button><button type="button" onClick={() => setPaymentMode('pay_on_delivery')} aria-pressed={paymentMode === 'pay_on_delivery'} className={`flex min-h-16 items-center gap-3 rounded-lg border px-4 text-left transition-colors ${paymentMode === 'pay_on_delivery' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/60'}`}><ShoppingBag className="size-5 shrink-0" aria-hidden="true" /><span><span className="block text-sm font-medium">Pay on delivery</span><span className="text-xs opacity-70">Pay when your order arrives or is collected</span></span></button></div>{paymentMode === 'pay_now' ? <div className="mt-6 space-y-5"><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setPaymentMethod('mobile_money')} aria-pressed={paymentMethod === 'mobile_money'} className={`flex min-h-12 items-center gap-3 rounded-lg border px-4 text-left ${paymentMethod === 'mobile_money' ? 'border-primary bg-primary/10' : 'border-border'}`}><Smartphone className="size-4" aria-hidden="true" /><span className="text-sm font-medium">Mobile money</span></button><button type="button" onClick={() => setPaymentMethod('card')} aria-pressed={paymentMethod === 'card'} className={`flex min-h-12 items-center gap-3 rounded-lg border px-4 text-left ${paymentMethod === 'card' ? 'border-primary bg-primary/10' : 'border-border'}`}><CreditCard className="size-4" aria-hidden="true" /><span className="text-sm font-medium">Card</span></button></div>{paymentMethod === 'mobile_money' ? <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="mobile-money-network">Mobile-money network</Label><select id="mobile-money-network" value={mobileMoneyNetwork} onChange={(event) => setMobileMoneyNetwork(event.target.value as 'MTN' | 'AIRTEL')} className="min-h-12 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="MTN">MTN Mobile Money</option><option value="AIRTEL">Airtel Money</option></select></div><div className="flex items-end"><p className="pb-3 text-xs leading-5 text-muted-foreground">We will send the payment prompt to the phone number entered in your delivery details.</p></div></div> : <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="card-number">Card number</Label><Input id="card-number" inputMode="numeric" autoComplete="cc-number" value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} placeholder="1234 5678 9012 3456" className="min-h-12 rounded-md bg-background" /></div><div className="space-y-2"><Label htmlFor="card-expiry-month">Expiry month</Label><Input id="card-expiry-month" inputMode="numeric" autoComplete="cc-exp-month" value={cardExpiryMonth} onChange={(event) => setCardExpiryMonth(event.target.value)} placeholder="MM" className="min-h-12 rounded-md bg-background" /></div><div className="space-y-2"><Label htmlFor="card-expiry-year">Expiry year</Label><Input id="card-expiry-year" inputMode="numeric" autoComplete="cc-exp-year" value={cardExpiryYear} onChange={(event) => setCardExpiryYear(event.target.value)} placeholder="YY" className="min-h-12 rounded-md bg-background" /></div><div className="space-y-2"><Label htmlFor="card-cvv">CVV</Label><Input id="card-cvv" type="password" inputMode="numeric" autoComplete="cc-csc" value={cardCvv} onChange={(event) => setCardCvv(event.target.value)} placeholder="123" className="min-h-12 rounded-md bg-background" /></div></div>}</div> : <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm leading-6"><p className="font-medium text-foreground">Payment will be collected at fulfilment.</p><p className="mt-1 text-xs text-muted-foreground">Please have the exact order total ready when your order is delivered or collected. Our team may contact you to confirm availability before dispatch.</p></div>}</section>
              {paymentInstruction && <div role="status" className="rounded-lg border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-50"><p className="font-medium">{authorizationChallenge ? 'Complete payment authorization' : 'Authorize the payment on your phone'}</p><p className="mt-1">{paymentInstruction}</p><p className="mt-2 text-xs">Keep this page open. Flutterwave will notify the store after authorization.</p></div>}
              {authorizationChallenge && <div className="space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-4"><label htmlFor="checkout-authorization-code" className="block text-sm font-medium text-foreground">{authorizationChallenge.authorizationType === 'pin' ? 'Sandbox card PIN' : 'Sandbox OTP'}</label><div className="flex flex-col gap-2 sm:flex-row"><Input id="checkout-authorization-code" type="password" inputMode="numeric" value={authorizationCode} onChange={(event) => setAuthorizationCode(event.target.value)} placeholder={authorizationChallenge.authorizationType === 'pin' ? 'Enter PIN' : 'Enter OTP'} className="min-h-11 rounded-md bg-background" /><Button type="button" onClick={submitAuthorization} disabled={loading || !authorizationCode.trim()} className="min-h-11 rounded-md px-5 text-xs uppercase tracking-[0.12em]">{loading ? 'Authorizing…' : 'Authorize payment'}</Button></div></div>}
              <Button type="submit" disabled={loading || hasMixedCurrencies || hasUnavailableItems} className="min-h-14 w-full rounded-md bg-primary text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground hover:bg-primary/90">{loading ? <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Preparing payment…</span> : <span className="flex items-center gap-2">{paymentMode === 'pay_now' ? <><Lock className="size-4" aria-hidden="true" /> Pay {formatMoney(paymentTotal, checkoutCurrency)} securely</> : <><ShoppingBag className="size-4" aria-hidden="true" /> Place order, pay on delivery</>}</span>}</Button>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-emerald-600" aria-hidden="true" /> Encrypted payment via Flutterwave</div>
              <p className="text-center text-xs leading-5 text-muted-foreground">By placing this order, you agree to our <Link href="/refund-policy" className="font-medium text-primary underline underline-offset-4">cancellation and refund policy</Link>.</p>
            </div>

            <aside className="order-1 h-fit rounded-xl border border-border/70 bg-card p-5 shadow-editorial sm:p-6 lg:order-none lg:sticky lg:top-28"><div className="flex items-end justify-between gap-4 border-b border-border/70 pb-5"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Your selection</p><h2 className="mt-2 font-serif text-3xl">Summary</h2></div><span className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? 'piece' : 'pieces'}</span></div>
              <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-foreground">Collection promo code</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Apply a code for eligible products in this order. Delivery fees are not discounted.</p></div><Sparkles className="size-4 shrink-0 text-primary" aria-hidden="true" /></div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input id="collection-promotion-code" value={promotionCode} onChange={(event) => { const value = event.target.value.toUpperCase(); setPromotionCode(value); if (promotionQuote && value.trim() !== promotionQuote.promotion.code) setPromotionQuote(null); setPromotionError(null) }} placeholder="Enter promo code" className="min-h-11 rounded-md bg-background uppercase" /><Button type="button" onClick={() => void applyPromotion()} disabled={promotionLoading || !promotionCode.trim()} variant="outline" className="min-h-11 shrink-0 rounded-md">{promotionLoading ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : null}{promotionLoading ? 'Checking…' : 'Apply code'}</Button></div>{promotionQuote && <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">Applied {promotionQuote.promotion.code}: saving {formatMoney(promotionQuote.discountAmount, checkoutCurrency)} on eligible items{promotionQuote.promotion.audience === 'new_customer' ? ' for your first order' : ''}.</p>}{promotionError && <p role="alert" className="mt-2 text-xs leading-5 text-destructive">{promotionError}</p>}</div>
              <div className="mt-5 max-h-80 space-y-4 overflow-y-auto pr-1">
                {items.map((item) => { const image = getProductImage(item); const unitPrice = itemUnitPrice(item); const currency = normalizeCurrency(item.currency ?? item.product?.currency); return <div key={item.cartItemId} className="flex gap-3 border-b border-border/60 pb-4 last:border-0 last:pb-0"><div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">{image ? <Image src={image} alt="" fill sizes="64px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-primary"><ShoppingBag className="size-5" aria-hidden="true" /></div>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.product?.name || 'Saved selection'}</p><p className="mt-1 text-xs text-muted-foreground">Qty {item.quantity} · {formatMoney(unitPrice, currency)}</p>{item.customDimensions && <p className="mt-1 flex items-center gap-1 text-[10px] text-primary"><Sparkles className="size-3" aria-hidden="true" /> Bespoke sizing</p>}</div><p className="text-right text-sm font-medium tabular-nums">{formatMoney(unitPrice * item.quantity, currency)}</p></div> })}
              </div>
              <div className="mt-5 space-y-3 border-t border-border/70 pt-5 text-sm"><div className="flex justify-between gap-4 text-muted-foreground"><span>Subtotal</span><span className="tabular-nums text-foreground">{formatMoney(cart?.subtotal || 0, checkoutCurrency)}</span></div><div className="flex justify-between gap-4 text-muted-foreground"><span>Delivery</span><span className="text-right text-xs">{deliveryMethod === 'pickup_station' ? selectedPickupFee > 0 ? formatMoney(selectedPickupFee, checkoutCurrency) : 'Free pickup' : 'Confirmed after quotation'}</span></div>{promotionDiscountPreview > 0 && <div className="flex justify-between gap-4 text-muted-foreground"><span>Collection promotion <span className="font-mono text-[10px] text-primary">{promotionQuote?.promotion.code}</span></span><span className="tabular-nums text-primary">-{formatMoney(promotionDiscountPreview, checkoutCurrency)}</span></div>}{loyalty && <div className="rounded-lg border border-primary/20 bg-primary/5 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-foreground">Revamp Rewards</p><p className="mt-1 text-xs text-muted-foreground">{loyalty.balancePoints.toLocaleString('en-UG')} points available</p></div><Sparkles className="size-4 text-primary" aria-hidden="true" /></div><label htmlFor="loyalty-points" className="mt-3 block text-xs font-medium text-foreground">Use points <span className="font-normal text-muted-foreground">(up to {maximumRedeemablePoints.toLocaleString('en-UG')} on this order)</span></label><input id="loyalty-points" type="number" min="0" max={maximumRedeemablePoints} step="1" value={loyaltyPoints} disabled={Boolean(promotionQuote && !promotionQuote.promotion.stackable)} onChange={(event) => setLoyaltyPoints(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60" />{promotionQuote && !promotionQuote.promotion.stackable ? <p className="mt-2 text-xs text-muted-foreground">This promotion cannot be combined with loyalty points.</p> : loyaltyDiscountPreview > 0 && <p className="mt-2 text-xs text-primary">Saving {formatMoney(loyaltyDiscountPreview, checkoutCurrency)} with points.</p>}</div>}<div className="flex justify-between gap-4 border-t border-border/70 pt-4 font-serif text-2xl text-foreground"><span>Total</span><span className="tabular-nums text-primary">{formatMoney(paymentTotal, checkoutCurrency)}</span></div></div>
              <Link href="/cart" className="mt-5 inline-flex min-h-11 items-center justify-center text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground hover:underline">Edit selection</Link>
            </aside>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
