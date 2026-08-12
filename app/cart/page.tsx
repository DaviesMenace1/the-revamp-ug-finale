'use client'

import React from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/context/cart-context'
import { X, Plus, Minus, MessageCircle, Trash2, Loader2, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Safe number formatter
const safeFormatNumber = (num: any): string => {
  const val = typeof num === 'string' ? parseFloat(num) : Number(num)
  if (isNaN(val) || val === null || val === undefined) return '0.00'
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Bulletproof image resolver
const getProductImage = (item: any): string => {
  const product = item?.product
  if (!product) return '/placeholder.jpg'

  // 1. Direct item image or thumbnail
  if (item.selectedColor?.image) return item.selectedColor.image
  if (product.thumbnailImage) return product.thumbnailImage

  // 2. Array of images
  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstImg = product.images[0]
    if (typeof firstImg === 'string' && firstImg.length > 0) return firstImg
    if (typeof firstImg === 'object' && firstImg?.url) return firstImg.url
  }

  // 3. String image property
  if (typeof product.images === 'string' && product.images.trim().length > 0) {
    return product.images
  }

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

  // Prompt confirmation before removing an item
  const handleRemoveItem = (productId: string, productName?: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${productName || 'this item'}" from your cart?`
    )
    if (confirmed) {
      removeFromCart(productId)
    }
  }

  // Prompt confirmation before clearing entire cart
  const handleClearCart = () => {
    const confirmed = window.confirm('Are you sure you want to clear your entire cart?')
    if (confirmed) {
      clearCart()
    }
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
      m: (item as any).selectedMaterial?.name || (item as any).selectedMaterial,
      a: item.selectedAccessories?.map((acc: any) => acc.name || acc),
      d: item.customDimensions,
      n: item.product?.name || 'Product',
      pr: item.product?.salePrice || item.product?.price || 0,
      cur: item.product?.currency || '$',
      img: getProductImage(item),
      s: item.product?.slug || ''
    }))

    const encodedCart = encodeURIComponent(btoa(JSON.stringify(compactPayload)))
    const cartShareLink = `${baseUrl}/cart?c=${encodedCart}&name=${encodeURIComponent(name)}`

    const formattedItems = items.map((item, idx) => {
      const unitPrice = parseFloat(String(item.product?.salePrice || item.product?.price || 0)) || 0
      const price = unitPrice * item.quantity
      const details: string[] = []

      if (item.selectedColor) details.push(`Color: ${item.selectedColor.name || item.selectedColor}`)
      if ((item as any).selectedMaterial) details.push(`Material: ${(item as any).selectedMaterial.name || (item as any).selectedMaterial}`)
      if (item.selectedVariant) details.push(`Variant: ${item.selectedVariant.name || item.selectedVariant}`)
      if (item.selectedAccessories?.length) {
        details.push(`Accessories: ${item.selectedAccessories.map((a: any) => a.name || a).join(', ')}`)
      }
      if (item.customDimensions) {
        const { width, height, depth } = item.customDimensions
        if (width || height || depth) {
          details.push(`Dims: ${width ? `${width}″W` : ''}${height ? ` × ${height}″H` : ''}${depth ? ` × ${depth}″D` : ''}`)
        }
      }

      const detailText = details.length > 0 ? `\n (${details.join(' | ')})` : ''
      return `${idx + 1}. *${item.product?.name || 'Product'}* × ${item.quantity}${detailText}\n *Subtotal:* ${item.product?.currency || '$'} ${safeFormatNumber(price)}`
    }).join('\n\n')

    const message = `🛍️ *NEW CART ENQUIRY*\n👤 *Customer:* ${name}\n\n${formattedItems}\n\n------------------------------\n💰 *TOTAL:* ${items[0]?.product?.currency || '$'} ${safeFormatNumber(cart?.total)}\n------------------------------\n\n🔗 *View Cart & Images:* \n${cartShareLink}`

    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${phone || ''}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground font-sans">Loading your shopping cart...</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-grow pt-24 pb-16">
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <h1 className="font-serif text-4xl font-light text-foreground mb-8">Shopping Cart</h1>
            <div className="text-center py-16 border border-border bg-card rounded-lg">
              <p className="text-xl text-muted-foreground mb-6 font-sans">Your cart is empty</p>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
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
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-grow pt-24 pb-16">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h1 className="font-serif text-4xl font-light text-foreground mb-8">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items List */}
            <div className="lg:col-span-2">
              <div className="space-y-4 mb-6 pb-4 border-b border-border">
                <p className="text-sm font-sans text-muted-foreground">
                  {items.length} item{items.length !== 1 ? 's' : ''} in cart
                </p>
              </div>

              <div className="space-y-6">
                {items.map((item) => {
                  const unitPrice = parseFloat(String(item.product?.salePrice || item.product?.price || 0)) || 0
                  const itemTotal = unitPrice * item.quantity
                  const imageSrc = getProductImage(item)

                  return (
                    <div key={item.productId} className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-border">
                      {/* Product Image Container */}
                      <div className="relative w-full sm:w-32 h-40 sm:h-32 bg-muted rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={imageSrc}
                          alt={item.product?.name || 'Product Image'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 128px"
                          unoptimized={imageSrc.startsWith('http')}
                        />
                      </div>

                      {/* Product Details & Selection Badges */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <Link href={`/collections/${item.product?.slug || ''}`}>
                            <h3 className="font-serif text-xl font-medium text-foreground hover:text-gold transition-colors">
                              {item.product?.name || 'Product'}
                            </h3>
                          </Link>

                          {/* Selected Customizations Badges */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {/* Selected Color */}
                            {item.selectedColor && (
                              <span className="inline-flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1 rounded text-foreground border border-border">
                                <span className="font-medium text-muted-foreground">Color:</span>
                                {typeof item.selectedColor === 'string' 
                                  ? item.selectedColor 
                                  : item.selectedColor.name}
                              </span>
                            )}

                            {/* Selected Material */}
                            {(item as any).selectedMaterial && (
                              <span className="inline-flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1 rounded text-foreground border border-border">
                                <span className="font-medium text-muted-foreground">Material:</span>
                                {typeof (item as any).selectedMaterial === 'string'
                                  ? (item as any).selectedMaterial
                                  : (item as any).selectedMaterial.name}
                              </span>
                            )}

                            {/* Selected Variant */}
                            {item.selectedVariant && (
                              <span className="inline-flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1 rounded text-foreground border border-border">
                                <span className="font-medium text-muted-foreground">Variant:</span>
                                {typeof item.selectedVariant === 'string'
                                  ? item.selectedVariant
                                  : item.selectedVariant.name}
                              </span>
                            )}

                            {/* Selected Accessories */}
                            {item.selectedAccessories && item.selectedAccessories.length > 0 && (
                              <span className="inline-flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1 rounded text-foreground border border-border">
                                <span className="font-medium text-muted-foreground">Add-ons:</span>
                                {item.selectedAccessories.map((a: any) => typeof a === 'string' ? a : a.name).join(', ')}
                              </span>
                            )}

                            {/* Custom Dimensions */}
                            {item.customDimensions && (
                              <span className="inline-flex items-center gap-1.5 text-xs bg-gold/10 text-gold px-2.5 py-1 rounded border border-gold/30">
                                <Sparkles className="w-3 h-3" />
                                Custom Dims: {item.customDimensions.width ? `${item.customDimensions.width}″W` : ''}
                                {item.customDimensions.height ? ` × ${item.customDimensions.height}″H` : ''}
                                {item.customDimensions.depth ? ` × ${item.customDimensions.depth}″D` : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="font-serif text-lg font-medium text-foreground mt-3 sm:mt-0">
                          ${safeFormatNumber(unitPrice)}
                        </p>
                      </div>

                      {/* Quantity Selector & Remove Button */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-4">
                        <div className="flex items-center border border-border rounded">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1.5 hover:bg-muted transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3 py-1 font-sans text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1.5 hover:bg-muted transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Confirmed Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.productId, item.product?.name)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-2"
                          title="Remove item from cart"
                          aria-label="Remove item"
                        >
                          <X size={18} />
                        </button>

                        <div className="text-right">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Subtotal</p>
                          <p className="font-serif text-lg font-medium text-foreground">
                            ${safeFormatNumber(itemTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            {cart && (
              <div className="lg:col-span-1">
                <div className="bg-muted/50 border border-border rounded-lg p-6 sm:p-8 sticky top-24">
                  <h2 className="font-serif text-2xl font-light text-foreground mb-6">
                    Order Summary
                  </h2>

                  <div className="space-y-4 mb-6 pb-6 border-b border-border">
                    <div className="flex justify-between text-sm text-foreground">
                      <span>Subtotal</span>
                      <span>${safeFormatNumber(cart.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-foreground">
                      <span>Tax (10%)</span>
                      <span>${safeFormatNumber(cart.tax)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-foreground">
                      <span>Shipping</span>
                      <span>${safeFormatNumber(cart.shipping)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between mb-8">
                    <span className="font-serif text-xl font-medium text-foreground">Total</span>
                    <span className="font-serif text-2xl font-medium text-gold">
                      ${safeFormatNumber(cart.total)}
                    </span>
                  </div>

                  {/* Customer Name Input */}
                  <div className="mb-6">
                    <label className="block text-xs font-sans text-muted-foreground uppercase tracking-wider mb-2">
                      Your Name (for WhatsApp Order)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={customerName || ''}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>

                  <div className="space-y-3">
                    <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 font-sans tracking-wide">
                      <Link href="/checkout">Proceed to Checkout</Link>
                    </Button>

                    <Button onClick={shareToWhatsApp} variant="outline" className="w-full border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 py-6 font-sans">
                      <MessageCircle className="mr-2 h-4 w-4" /> Send Cart to WhatsApp
                    </Button>

                    <Button onClick={handleClearCart} variant="ghost" className="w-full text-muted-foreground hover:text-destructive">
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
