'use client'

import React from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/context/cart-context'
import { X, Plus, Minus, MessageCircle, Trash2, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Helper to safely format numbers without crashing on strings or NaN
const safeFormatNumber = (num: any): string => {
  const val = typeof num === 'string' ? parseFloat(num) : Number(num)
  if (isNaN(val) || val === null || val === undefined) return '0.00'
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Helper to safely extract image URL
const getProductImage = (product: any): string => {
  if (!product) return '/placeholder.jpg'
  if (product.thumbnailImage) return product.thumbnailImage
  if (Array.isArray(product.images) && product.images.length > 0) return product.images[0]
  if (typeof product.images === 'string' && product.images.startsWith('http')) return product.images
  return '/placeholder.jpg'
}

export default function CartPage() {
  const { 
    items = [], 
    cart, 
    customerName, 
    setCustomerName, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    isLoaded 
  } = useCart()

  // 1. Show smooth loader until CartContext finishes reading local storage/DB
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Loading your shopping cart...</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const shareToWhatsApp = () => {
    let name = customerName
    if (!name || name.trim() === '') {
      const inputName = window.prompt("Please enter your name for the order enquiry:")
      if (!inputName) return
      name = inputName.trim()
      setCustomerName(name)
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')

    const compactPayload = items.map((item) => ({
      i: item.productId,
      q: item.quantity,
      c: item.selectedColor?.name || item.selectedColor,
      v: item.selectedVariant?.name || item.selectedVariant,
      a: item.selectedAccessories?.map((acc: any) => acc.name || acc),
      d: item.customDimensions,
      n: item.product?.name || 'Product',
      pr: item.product?.salePrice || item.product?.price || 0,
      cur: item.product?.currency || '$',
      img: getProductImage(item.product),
      s: item.product?.slug || ''
    }))

    const encodedCart = encodeURIComponent(btoa(JSON.stringify(compactPayload)))
    const cartShareLink = `${baseUrl}/cart?c=${encodedCart}&name=${encodeURIComponent(name)}`

    const formattedItems = items.map((item, idx) => {
      const unitPrice = parseFloat(String(item.product?.salePrice || item.product?.price || 0)) || 0
      const price = unitPrice * item.quantity
      const details: string[] = []

      if (item.selectedColor) details.push(`Color: ${item.selectedColor.name || item.selectedColor}`)
      if (item.selectedVariant) details.push(`Variant: ${item.selectedVariant.name || item.selectedVariant}`)
      if (item.selectedAccessories?.length) {
        details.push(`Accessories: ${item.selectedAccessories.map((a: any) => a.name || a).join(', ')}`)
      }
      if (item.customDimensions) {
        const { width, depth } = item.customDimensions
        if (width || depth) details.push(`Dims: ${width ? `${width}″W` : ''}${depth ? `×${depth}″D` : ''}`)
      }

      const detailText = details.length > 0 ? `\n (${details.join(' | ')})` : ''
      return `${idx + 1}. *${item.product?.name || 'Product'}* × ${item.quantity}${detailText}\n *Subtotal:* ${item.product?.currency || '$'} ${safeFormatNumber(price)}`
    }).join('\n\n')

    const message = `🛍️ *NEW CART ENQUIRY*\n👤 *Customer:* ${name}\n\n${formattedItems}\n\n------------------------------\n💰 *TOTAL:* ${items[0]?.product?.currency || '$'} ${safeFormatNumber(cart?.total)}\n------------------------------\n\n🔗 *View Cart & Images:* \n${cartShareLink}`

    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${phone || ''}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  // 2. Empty Cart View
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-grow pt-24 pb-16">
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Shopping Cart</h1>
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-6">Your cart is empty</p>
              <Button asChild className="bg-primary text-primary-foreground">
                <Link href="/collections">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-grow pt-24 pb-16">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4 mb-8 pb-8 border-b border-border">
                <p className="text-sm text-muted-foreground">
                  {items.length} item{items.length !== 1 ? 's' : ''} in cart
                </p>
              </div>

              <div className="space-y-6">
                {items.map((item) => {
                  const unitPrice = parseFloat(String(item.product?.salePrice || item.product?.price || 0)) || 0
                  const itemTotal = unitPrice * item.quantity
                  const imageSrc = getProductImage(item.product)

                  return (
                    <div key={item.productId} className="flex gap-6 pb-6 border-b border-border">
                      {/* Image */}
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                        <Image
                          src={imageSrc}
                          alt={item.product?.name || 'Product'}
                          fill
                          className="object-cover"
                          sizes="150px"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <Link href={`/collections/${item.product?.slug || ''}`}>
                            <h3 className="font-serif text-lg font-semibold text-foreground hover:text-accent transition-colors">
                              {item.product?.name || 'Product'}
                            </h3>
                          </Link>

                          {/* Options */}
                          <div className="text-sm text-muted-foreground mt-2 space-y-1">
                            {item.selectedColor && (
                              <p>Color: {typeof item.selectedColor === 'string' ? item.selectedColor : item.selectedColor.name}</p>
                            )}
                            {item.selectedVariant && (
                              <p>Variant: {typeof item.selectedVariant === 'string' ? item.selectedVariant : item.selectedVariant.name}</p>
                            )}
                            {item.selectedAccessories && item.selectedAccessories.length > 0 && (
                              <p>
                                Accessories: {item.selectedAccessories.map((a: any) => typeof a === 'string' ? a : a.name).join(', ')}
                              </p>
                            )}
                            {item.customDimensions && (
                              <p>
                                Dimensions: {item.customDimensions.width}″ W {item.customDimensions.depth && `× ${item.customDimensions.depth}″ D`}
                              </p>
                            )}
                          </div>
                        </div>

                        <p className="font-serif text-lg font-bold text-foreground">
                          ${safeFormatNumber(unitPrice)}
                        </p>
                      </div>

                      {/* Quantity & Actions */}
                      <div className="flex flex-col items-end justify-between">
                        <div className="flex items-center border border-border rounded">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 hover:bg-muted"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="px-3 py-1 font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 hover:bg-muted"
                            aria-label="Increase quantity"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-destructive hover:text-destructive/80 transition-colors p-2"
                          aria-label="Remove item"
                        >
                          <X size={20} />
                        </button>

                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Subtotal</p>
                          <p className="font-serif text-lg font-bold text-foreground">
                            ${safeFormatNumber(itemTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Summary */}
            {cart && (
              <div className="lg:col-span-1">
                <div className="bg-muted rounded-lg p-8 sticky top-24">
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
                    Order Summary
                  </h2>

                  <div className="space-y-4 mb-8 pb-8 border-b border-border">
                    <div className="flex justify-between text-foreground">
                      <span>Subtotal</span>
                      <span>${safeFormatNumber(cart.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-foreground">
                      <span>Tax (10%)</span>
                      <span>${safeFormatNumber(cart.tax)}</span>
                    </div>
                    <div className="flex justify-between text-foreground">
                      <span>Shipping</span>
                      <span>${safeFormatNumber(cart.shipping)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between mb-8">
                    <span className="font-serif text-xl font-bold text-foreground">Total</span>
                    <span className="font-serif text-2xl font-bold text-accent">
                      ${safeFormatNumber(cart.total)}
                    </span>
                  </div>

                  {/* Customer Name Input */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Your Name (for WhatsApp Enquiry)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={customerName || ''}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-3">
                    <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-opacity-90 py-6">
                      <Link href="/checkout">Proceed to Checkout</Link>
                    </Button>

                    <Button onClick={shareToWhatsApp} variant="outline" className="w-full border-border bg-green-500/10 text-green-600 hover:bg-green-500/20">
                      <MessageCircle className="mr-2 h-4 w-4" /> Send Cart to WhatsApp
                    </Button>

                    <Button onClick={clearCart} variant="ghost" className="w-full text-muted-foreground hover:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
                    </Button>

                    <Button asChild variant="outline" className="w-full border-border">
                      <Link href="/collections">Continue Shopping</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
