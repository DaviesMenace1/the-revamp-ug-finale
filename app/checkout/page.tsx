'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCart } from '@/lib/context/cart-context'
import {
  Lock,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  CreditCard,
} from 'lucide-react'

// Declare window object for Flutterwave SDK
declare global {
  interface Window {
    FlutterwaveCheckout: any
  }
}

// Safe number helper matching cart
const safeFormatNumber = (num: any): string => {
  const val = typeof num === 'string' ? parseFloat(num) : Number(num)
  if (isNaN(val) || val === null || val === undefined) return '0.00'
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Image resolver helper matching cart
const getProductImage = (item: any): string => {
  const product = item?.product
  if (!product) return '/placeholder.jpg'
  if (item.selectedColor?.image) return item.selectedColor.image
  if (product.thumbnailImage) return product.thumbnailImage
  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstImg = product.images[0]
    if (typeof firstImg === 'string' && firstImg.length > 0) return firstImg
    if (typeof firstImg === 'object' && firstImg?.url) return firstImg.url
  }
  if (typeof product.images === 'string' && product.images.trim().length > 0) {
    return product.images
  }
  return '/placeholder.jpg'
}

export default function CheckoutPage() {
  const router = useRouter()
  const { isLoaded: isClerkLoaded, user } = useUser()
  const { items = [], cart, customerName, setCustomerName, isLoaded: isCartLoaded } = useCart()

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Form Fields
  const [formData, setFormData] = useState({
    name: customerName || '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Uganda',
    notes: '',
  })

  // Auto-fill user details from Clerk when loaded
  useEffect(() => {
    if (isClerkLoaded && user) {
      setFormData((prev) => ({
        ...prev,
        name: user.fullName || user.firstName || prev.name,
        email: user.primaryEmailAddress?.emailAddress || prev.email,
      }))
    }
  }, [user, isClerkLoaded])

  // Sync customerName if changed from context
  useEffect(() => {
    if (customerName && !formData.name) {
      setFormData((prev) => ({ ...prev, name: customerName }))
    }
  }, [customerName, formData.name])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === 'name') setCustomerName(value)
  }

  const handlePayWithFlutterwave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      setErrorMessage('Please fill in all required shipping details.')
      return
    }

    if (typeof window.FlutterwaveCheckout !== 'function') {
      setErrorMessage(
        'Flutterwave payment system is loading. Please check your internet connection and try again.'
      )
      return
    }

    setLoading(true)

    try {
      // 1. Create Pending Order Record via server
      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cart?.total || 0,
          currency: items[0]?.product?.currency || 'USD',
          email: formData.email,
          customerName: formData.name,
          phoneNumber: formData.phone,
          shippingAddress: {
            name: formData.name,
            address: formData.address,
            city: formData.city,
            country: formData.country,
            phone: formData.phone,
            notes: formData.notes,
          },
          items: items.map((item) => ({
            productId: item.productId,
            name: item.product?.name || 'Product',
            quantity: item.quantity,
            unitPrice: item.product?.salePrice || item.product?.price || 0,
            color: typeof item.selectedColor === 'object' ? item.selectedColor?.name : item.selectedColor,
            material: typeof (item as any).selectedMaterial === 'object' ? (item as any).selectedMaterial?.name : (item as any).selectedMaterial,
            variant: typeof item.selectedVariant === 'object' ? item.selectedVariant?.name : item.selectedVariant,
            dimensions: item.customDimensions,
            image: getProductImage(item),
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.txRef) {
        throw new Error(data.error || 'Failed to initialize order in system.')
      }

      setLoading(false)

      // 2. Launch Client-Side Flutterwave Modal
      const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY

      if (!publicKey) {
        throw new Error('NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY is missing in client environment variables.')
      }

      window.FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: data.txRef,
        amount: Number(cart?.total) || 0,
        currency: (items[0]?.product?.currency || 'USD').toUpperCase(),
        payment_options: 'card,mobilemoneyuganda,banktransfer',
        customer: {
          email: formData.email,
          phone_number: formData.phone,
          name: formData.name,
        },
        customizations: {
          title: 'The Revamp UG',
          description: `Order #${data.txRef}`,
        },
        callback: function (res: any) {
          console.log('Payment completed:', res)
          router.push(`/checkout/success?tx_ref=${res.tx_ref}&transaction_id=${res.transaction_id}`)
        },
        onclose: function () {
          console.log('Payment modal closed')
        },
      })
    } catch (err: any) {
      console.error('Checkout error:', err)
      setErrorMessage(err.message || 'An unexpected error occurred.')
      setLoading(false)
    }
  }

  // Loading indicator while Clerk / Cart loads
  if (!isClerkLoaded || !isCartLoaded) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </main>
        <SiteFooter />
      </div>
    )
  }

  // Empty Cart State
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <div className="text-center py-16 max-w-md px-4">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 stroke-[1.5]" />
            <h1 className="font-serif text-3xl font-light mb-3">Your Cart is Empty</h1>
            <p className="text-sm text-muted-foreground mb-6">
              You don't have any items in your shopping cart to checkout.
            </p>
            <Button asChild className="rounded-none uppercase tracking-widest text-xs h-11 px-6">
              <Link href="/collections">Return to Shop</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Script to inject Flutterwave Popup Library directly into the browser */}
      <Script src="https://checkout.flutterwave.com/v3.js" strategy="lazyOnload" />

      <SiteHeader />

      <main className="flex-grow pt-24 pb-16">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Back to Cart link */}
          <div className="mb-8">
            <Link
              href="/cart"
              className="inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cart
            </Link>
          </div>

          <h1 className="font-serif text-4xl font-light text-foreground mb-8">Checkout</h1>

          {errorMessage && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-none">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handlePayWithFlutterwave} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Customer & Shipping Form (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              {/* Shipping Address Section */}
              <div className="space-y-4">
                <h2 className="font-serif text-2xl font-light text-foreground pb-2 border-b border-border">
                  1. Shipping Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name" className="text-xs uppercase tracking-wider">
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder="e.g. Jane Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="rounded-none bg-background h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-wider">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="rounded-none bg-background h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs uppercase tracking-wider">
                      Phone / Mobile Money No. *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="+256 700 000000"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="rounded-none bg-background h-11"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address" className="text-xs uppercase tracking-wider">
                      Street Address *
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      required
                      placeholder="Plot / Street / Delivery address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="rounded-none bg-background h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs uppercase tracking-wider">
                      City / Region *
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      required
                      placeholder="Kampala"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="rounded-none bg-background h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-xs uppercase tracking-wider">
                      Country
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="rounded-none bg-background h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Info Banner */}
              <div className="space-y-4">
                <h2 className="font-serif text-2xl font-light text-foreground pb-2 border-b border-border">
                  2. Payment Method
                </h2>

                <div className="p-4 border border-border bg-muted/20 flex items-start gap-4">
                  <CreditCard className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Flutterwave Gateway</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Supports Visa, Mastercard, Mobile Money (MTN, Airtel), and Bank Transfer via a secure overlay popup.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 rounded-none uppercase tracking-widest text-xs font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Preparing Payment...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Pay ${safeFormatNumber(cart?.total)} via Flutterwave
                  </span>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> 256-bit SSL Encrypted Payment
              </div>
            </div>

            {/* Order Items & Summary Sidebar (5 cols) */}
            <div className="lg:col-span-5">
              <div className="bg-muted/40 border border-border p-6 sm:p-8 sticky top-24 space-y-6">
                <h2 className="font-serif text-2xl font-light text-foreground border-b border-border pb-4">
                  Order Summary ({items.length})
                </h2>

                {/* Items List */}
                <div className="max-h-80 overflow-y-auto space-y-4 pr-1 divide-y divide-border/40">
                  {items.map((item) => {
                    const unitPrice =
                      parseFloat(String(item.product?.salePrice || item.product?.price || 0)) || 0
                    const imageSrc = getProductImage(item)

                    return (
                      <div key={item.productId} className="pt-4 first:pt-0 flex gap-4 text-sm">
                        <div className="relative w-16 h-16 bg-muted shrink-0 overflow-hidden border border-border">
                          <Image
                            src={imageSrc}
                            alt={item.product?.name || 'Product'}
                            fill
                            className="object-cover"
                            unoptimized={imageSrc.startsWith('http')}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {item.product?.name || 'Product'}
                          </p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>

                          {/* Selected Customization Summary */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.selectedColor && (
                              <span className="text-[10px] bg-background px-1.5 py-0.5 border border-border text-muted-foreground">
                                {typeof item.selectedColor === 'string'
                                  ? item.selectedColor
                                  : item.selectedColor.name}
                              </span>
                            )}
                            {item.customDimensions && (
                              <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 border border-gold/20 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                {item.customDimensions.width}″W × {item.customDimensions.height}″H
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right font-serif font-medium">
                          ${safeFormatNumber(unitPrice * item.quantity)}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Price Breakdown */}
                {cart && (
                  <div className="border-t border-border pt-4 space-y-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-serif text-foreground">
                        ${safeFormatNumber(cart.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Estimated Tax (10%)</span>
                      <span className="font-serif text-foreground">
                        ${safeFormatNumber(cart.tax)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span className="font-serif text-foreground">
                        ${safeFormatNumber(cart.shipping)}
                      </span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between font-serif text-xl font-medium">
                      <span>Total</span>
                      <span className="text-gold">${safeFormatNumber(cart.total)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
