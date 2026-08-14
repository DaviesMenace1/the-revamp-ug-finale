'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/lib/context/cart-context'
import { 
  X, 
  Plus, 
  Minus, 
  MessageCircle, 
  Trash2, 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Ruler, 
  ShoppingBag 
} from 'lucide-react'

// Dynamic Currency & Number Formatter
const formatPrice = (num: any, currencyCode = 'UGX'): string => {
  const val = typeof num === 'string' ? parseFloat(num) : Number(num)
  if (isNaN(val) || val === null || val === undefined) return '0.00'
  
  const isUgx = currencyCode.toUpperCase() === 'UGX'
  const formatted = val.toLocaleString('en-US', {
    minimumFractionDigits: isUgx ? 0 : 2,
    maximumFractionDigits: isUgx ? 0 : 2,
  })
  
  return `${currencyCode} ${formatted}`
}

// Bulletproof Image Resolver
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

  const [promoCode, setPromoCode] = useState('')

  const activeCurrency = items[0]?.product?.currency || 'UGX'

  const handleRemoveItem = (productId: string, productName?: string) => {
    if (window.confirm(`Remove "${productName || 'this item'}" from your cart?`)) {
      removeFromCart(productId)
    }
  }

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
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
      cur: item.product?.currency || 'UGX',
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

      const detailText = details.length > 0 ? `\n   └ _${details.join(' | ')}_` : ''
      return `${idx + 1}. *${item.product?.name || 'Product'}* × ${item.quantity}${detailText}\n   *Subtotal:* ${formatPrice(price, activeCurrency)}`
    }).join('\n\n')

    const message = `🛍️ *NEW LUXURY ORDER ENQUIRY*\n👤 *Client:* ${name}\n\n${formattedItems}\n\n━━━━━━━━━━━━━━━━━━━━━━━\n💰 *ESTIMATED TOTAL:* ${formatPrice(cart?.total || 0, activeCurrency)}\n━━━━━━━━━━━━━━━━━━━━━━━\n\n🔗 *Review Order & Specs:* \n${cartShareLink}`

    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, '') || '256700000000'
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-grow pt-32 pb-24 flex items-center justify-center">
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold mb-4" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-sans">Retrieving your selection...</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // Empty State Component
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-grow pt-32 pb-24">
          <div className="px-6 lg:px-12 max-w-5xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/40 flex items-center justify-center border border-border/60">
              <ShoppingBag className="w-8 h-8 text-muted-foreground/60" />
            </div>
            
            <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-4">
              Your Cart is Empty
            </h1>
            <p className="max-w-md mx-auto text-muted-foreground font-light text-sm md:text-base mb-10 leading-relaxed">
              Explore our curated collections of bespoke furniture, architectural decor, and luxury interior concepts.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button asChild size="lg" className="bg-gold text-black hover:bg-gold/90 px-8 font-sans uppercase tracking-widest text-xs">
                <Link href="/collections">Explore Collections</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-border text-foreground hover:bg-muted/30 px-8 font-sans uppercase tracking-widest text-xs">
                <Link href="/services">Design Consultation</Link>
              </Button>
            </div>

            {/* Quick Navigation Category Grid */}
            <div className="pt-12 border-t border-border/40 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'Living Room', href: '/collections?category=Living+Room' },
                { title: 'Custom Furniture', href: '/collections?category=Furniture' },
                { title: 'Lighting & Decor', href: '/collections?category=Lighting' },
                { title: 'Architecture', href: '/collections?category=Architecture' },
              ].map((cat) => (
                <Link key={cat.title} href={cat.href} className="group p-4 rounded-lg border border-border/30 bg-card hover:border-gold/40 transition-all text-left">
                  <span className="text-xs font-serif text-foreground group-hover:text-gold transition-colors flex items-center justify-between">
                    {cat.title} <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </Link>
              ))}
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

      <main className="flex-grow pt-28 md:pt-36 pb-24">
        <div className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 mb-8 border-b border-border/60">
            <div>
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-gold font-medium">Bespoke Selection</span>
              <h1 className="font-serif text-3xl md:text-5xl font-light text-foreground mt-1">Shopping Cart</h1>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4 text-xs text-muted-foreground">
              <span>{items.length} {items.length === 1 ? 'Item' : 'Items'}</span>
              <span>•</span>
              <button onClick={handleClearCart} className="hover:text-destructive transition-colors flex items-center gap-1">
                <Trash2 size={12} /> Clear Selection
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Cart Items Column */}
            <div className="lg:col-span-7 space-y-8">
              <div className="divide-y divide-border/40">
                {items.map((item) => {
                  const unitPrice = parseFloat(String(item.product?.salePrice || item.product?.price || 0)) || 0
                  const itemTotal = unitPrice * item.quantity
                  const imageSrc = getProductImage(item)

                  return (
                    <div key={item.productId} className="py-8 first:pt-0 flex flex-col sm:flex-row gap-6 group">
                      
                      {/* Product Thumbnail */}
                      <div className="relative w-full sm:w-36 h-48 sm:h-36 bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-border/40">
                        <Image
                          src={imageSrc}
                          alt={item.product?.name || 'Product Image'}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, 144px"
                          unoptimized={imageSrc.startsWith('http')}
                        />
                      </div>

                      {/* Product Metadata & Customization Specs */}
                      <div className="flex-grow flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <Link href={`/collections/${item.product?.slug || ''}`}>
                              <h3 className="font-serif text-lg md:text-xl font-normal text-foreground hover:text-gold transition-colors">
                                {item.product?.name || 'Bespoke Item'}
                              </h3>
                            </Link>
                            <button
                              onClick={() => handleRemoveItem(item.productId, item.product?.name)}
                              className="text-muted-foreground/60 hover:text-destructive transition-colors p-1"
                              aria-label="Remove item"
                              title="Remove item"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {/* Price Tag */}
                          <p className="text-sm font-sans font-medium text-foreground/80 mt-1">
                            {formatPrice(unitPrice, activeCurrency)}
                          </p>

                          {/* Customizations Metadata Grid */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {item.selectedColor && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] bg-muted/60 px-2.5 py-1 rounded text-foreground/80 border border-border/40">
                                <span className="text-muted-foreground">Color:</span>
                                {typeof item.selectedColor === 'string' ? item.selectedColor : item.selectedColor.name}
                              </span>
                            )}

                            {(item as any).selectedMaterial && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] bg-muted/60 px-2.5 py-1 rounded text-foreground/80 border border-border/40">
                                <span className="text-muted-foreground">Material:</span>
                                {typeof (item as any).selectedMaterial === 'string' ? (item as any).selectedMaterial : (item as any).selectedMaterial.name}
                              </span>
                            )}

                            {item.selectedVariant && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] bg-muted/60 px-2.5 py-1 rounded text-foreground/80 border border-border/40">
                                <span className="text-muted-foreground">Variant:</span>
                                {typeof item.selectedVariant === 'string' ? item.selectedVariant : item.selectedVariant.name}
                              </span>
                            )}

                            {item.selectedAccessories && item.selectedAccessories.length > 0 && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] bg-muted/60 px-2.5 py-1 rounded text-foreground/80 border border-border/40">
                                <span className="text-muted-foreground">Add-ons:</span>
                                {item.selectedAccessories.map((a: any) => typeof a === 'string' ? a : a.name).join(', ')}
                              </span>
                            )}

                            {item.customDimensions && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] bg-gold/10 text-gold px-2.5 py-1 rounded border border-gold/30">
                                <Ruler className="w-3 h-3" />
                                Custom Dims: {item.customDimensions.width ? `${item.customDimensions.width}″W` : ''}
                                {item.customDimensions.height ? ` × ${item.customDimensions.height}″H` : ''}
                                {item.customDimensions.depth ? ` × ${item.customDimensions.depth}″D` : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Adjuster & Subtotal */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/20">
                          <div className="flex items-center border border-border/60 rounded bg-background">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-3 text-xs font-sans font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Subtotal</span>
                            <span className="font-serif text-base font-medium text-foreground">
                              {formatPrice(itemTotal, activeCurrency)}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Guarantees / Service Callout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-border/40">
                <div className="p-4 rounded-lg bg-card border border-border/40 flex items-start gap-3">
                  <Truck className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-foreground">White-Glove Delivery</h4>
                    <p className="text-xs text-muted-foreground font-light mt-1">Handled directly by our studio logistics for total peace of mind.</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border/40 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-foreground">Studio Guarantee</h4>
                    <p className="text-xs text-muted-foreground font-light mt-1">Crafted with luxury materials & precision engineering.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar Summary & Checkout */}
            {cart && (
              <div className="lg:col-span-5">
                <div className="bg-card border border-border/60 rounded-xl p-6 md:p-8 sticky top-28 space-y-6">
                  
                  <h2 className="font-serif text-2xl font-light text-foreground pb-4 border-b border-border/40">
                    Order Summary
                  </h2>

                  {/* Pricing Breakdown */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-muted-foreground font-light">
                      <span>Items Subtotal</span>
                      <span className="text-foreground font-normal">{formatPrice(cart.subtotal, activeCurrency)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground font-light">
                      <span>Estimated Tax</span>
                      <span className="text-foreground font-normal">{formatPrice(cart.tax, activeCurrency)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground font-light">
                      <span>Delivery & Logistics</span>
                      <span className="text-foreground font-normal">
                        {cart.shipping > 0 ? formatPrice(cart.shipping, activeCurrency) : 'Calculated at Checkout'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/40 flex justify-between items-baseline">
                    <span className="font-serif text-lg font-normal text-foreground">Total Estimate</span>
                    <span className="font-serif text-2xl font-medium text-gold">
                      {formatPrice(cart.total, activeCurrency)}
                    </span>
                  </div>

                  {/* WhatsApp Quick Order Section */}
                  <div className="p-4 bg-muted/20 border border-border/40 rounded-lg space-y-3">
                    <label className="block text-[10px] font-sans text-muted-foreground uppercase tracking-widest">
                      Your Name (Required for Direct Consultation)
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Arch. Julian Vance"
                      value={customerName || ''}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="bg-background text-sm border-border focus:border-gold"
                    />
                    <Button 
                      onClick={shareToWhatsApp} 
                      variant="outline" 
                      className="w-full border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 py-5 font-sans text-xs uppercase tracking-wider gap-2"
                    >
                      <MessageCircle className="h-4 w-4" /> Send Cart to WhatsApp
                    </Button>
                  </div>

                  {/* Standard Checkout CTA */}
                  <div className="space-y-3">
                    <Button asChild size="lg" className="w-full bg-gold text-black hover:bg-gold/90 py-6 font-sans text-xs uppercase tracking-widest font-medium">
                      <Link href="/checkout" className="flex items-center justify-center gap-2">
                        Proceed to Checkout <ArrowRight size={14} />
                      </Link>
                    </Button>

                    <Button asChild variant="ghost" className="w-full text-xs text-muted-foreground hover:text-foreground">
                      <Link href="/collections">← Continue Shopping</Link>
                    </Button>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Action Bar */}
      {cart && items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border p-4 shadow-2xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase text-muted-foreground block">Total</span>
            <span className="font-serif text-lg font-medium text-gold">
              {formatPrice(cart.total, activeCurrency)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button onClick={shareToWhatsApp} variant="outline" size="sm" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
              <MessageCircle size={16} />
            </Button>
            <Button asChild size="sm" className="bg-gold text-black hover:bg-gold/90 uppercase tracking-wider text-[10px] px-6">
              <Link href="/checkout">Checkout</Link>
            </Button>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  )
}



// 'use client'

// import React from 'react'
// import { SiteHeader } from '@/components/site-header'
// import { SiteFooter } from '@/components/site-footer'
// import { Button } from '@/components/ui/button'
// import { useCart } from '@/lib/context/cart-context'
// import { X, Plus, Minus, MessageCircle, Trash2, Loader2, Sparkles } from 'lucide-react'
// import Image from 'next/image'
// import Link from 'next/link'

// // Safe number formatter
// const safeFormatNumber = (num: any): string => {
//   const val = typeof num === 'string' ? parseFloat(num) : Number(num)
//   if (isNaN(val) || val === null || val === undefined) return '0.00'
//   return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
// }

// // Bulletproof image resolver
// const getProductImage = (item: any): string => {
//   const product = item?.product
//   if (!product) return '/placeholder.jpg'

//   // 1. Direct item image or thumbnail
//   if (item.selectedColor?.image) return item.selectedColor.image
//   if (product.thumbnailImage) return product.thumbnailImage

//   // 2. Array of images
//   if (Array.isArray(product.images) && product.images.length > 0) {
//     const firstImg = product.images[0]
//     if (typeof firstImg === 'string' && firstImg.length > 0) return firstImg
//     if (typeof firstImg === 'object' && firstImg?.url) return firstImg.url
//   }

//   // 3. String image property
//   if (typeof product.images === 'string' && product.images.trim().length > 0) {
//     return product.images
//   }

//   return '/placeholder.jpg'
// }

// export default function CartPage() {
//   const { 
//     items = [], 
//     cart, 
//     customerName, 
//     setCustomerName, 
//     removeFromCart, 
//     updateQuantity, 
//     clearCart,
//     isLoaded 
//   } = useCart()

//   // Prompt confirmation before removing an item
//   const handleRemoveItem = (productId: string, productName?: string) => {
//     const confirmed = window.confirm(
//       `Are you sure you want to remove "${productName || 'this item'}" from your cart?`
//     )
//     if (confirmed) {
//       removeFromCart(productId)
//     }
//   }

//   // Prompt confirmation before clearing entire cart
//   const handleClearCart = () => {
//     const confirmed = window.confirm('Are you sure you want to clear your entire cart?')
//     if (confirmed) {
//       clearCart()
//     }
//   }

//   const shareToWhatsApp = () => {
//     let name = customerName
//     if (!name || name.trim() === '') {
//       const inputName = window.prompt("Please enter your name for the order enquiry:")
//       if (!inputName) return
//       name = inputName.trim()
//       setCustomerName(name)
//     }

//     const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')

//     const compactPayload = items.map((item) => ({
//       i: item.productId,
//       q: item.quantity,
//       c: item.selectedColor?.name || item.selectedColor,
//       v: item.selectedVariant?.name || item.selectedVariant,
//       m: (item as any).selectedMaterial?.name || (item as any).selectedMaterial,
//       a: item.selectedAccessories?.map((acc: any) => acc.name || acc),
//       d: item.customDimensions,
//       n: item.product?.name || 'Product',
//       pr: item.product?.salePrice || item.product?.price || 0,
//       cur: item.product?.currency || '$',
//       img: getProductImage(item),
//       s: item.product?.slug || ''
//     }))

//     const encodedCart = encodeURIComponent(btoa(JSON.stringify(compactPayload)))
//     const cartShareLink = `${baseUrl}/cart?c=${encodedCart}&name=${encodeURIComponent(name)}`

//     const formattedItems = items.map((item, idx) => {
//       const unitPrice = parseFloat(String(item.product?.salePrice || item.product?.price || 0)) || 0
//       const price = unitPrice * item.quantity
//       const details: string[] = []

//       if (item.selectedColor) details.push(`Color: ${item.selectedColor.name || item.selectedColor}`)
//       if ((item as any).selectedMaterial) details.push(`Material: ${(item as any).selectedMaterial.name || (item as any).selectedMaterial}`)
//       if (item.selectedVariant) details.push(`Variant: ${item.selectedVariant.name || item.selectedVariant}`)
//       if (item.selectedAccessories?.length) {
//         details.push(`Accessories: ${item.selectedAccessories.map((a: any) => a.name || a).join(', ')}`)
//       }
//       if (item.customDimensions) {
//         const { width, height, depth } = item.customDimensions
//         if (width || height || depth) {
//           details.push(`Dims: ${width ? `${width}″W` : ''}${height ? ` × ${height}″H` : ''}${depth ? ` × ${depth}″D` : ''}`)
//         }
//       }

//       const detailText = details.length > 0 ? `\n (${details.join(' | ')})` : ''
//       return `${idx + 1}. *${item.product?.name || 'Product'}* × ${item.quantity}${detailText}\n *Subtotal:* ${item.product?.currency || '$'} ${safeFormatNumber(price)}`
//     }).join('\n\n')

//     const message = `🛍️ *NEW CART ENQUIRY*\n👤 *Customer:* ${name}\n\n${formattedItems}\n\n------------------------------\n💰 *TOTAL:* ${items[0]?.product?.currency || '$'} ${safeFormatNumber(cart?.total)}\n------------------------------\n\n🔗 *View Cart & Images:* \n${cartShareLink}`

//     const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, '')
//     window.open(`https://wa.me/${phone || ''}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
//   }

//   if (!isLoaded) {
//     return (
//       <div className="min-h-screen flex flex-col bg-background">
//         <SiteHeader />
//         <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
//           <div className="text-center py-16">
//             <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-4" />
//             <p className="text-sm text-muted-foreground font-sans">Loading your shopping cart...</p>
//           </div>
//         </main>
//         <SiteFooter />
//       </div>
//     )
//   }

//   if (items.length === 0) {
//     return (
//       <div className="min-h-screen flex flex-col bg-background">
//         <SiteHeader />
//         <main className="flex-grow pt-24 pb-16">
//           <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
//             <h1 className="font-serif text-4xl font-light text-foreground mb-8">Shopping Cart</h1>
//             <div className="text-center py-16 border border-border bg-card rounded-lg">
//               <p className="text-xl text-muted-foreground mb-6 font-sans">Your cart is empty</p>
//               <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
//                 <Link href="/collections">Continue Shopping</Link>
//               </Button>
//             </div>
//           </div>
//         </main>
//         <SiteFooter />
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen flex flex-col bg-background">
//       <SiteHeader />

//       <main className="flex-grow pt-24 pb-16">
//         <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
//           <h1 className="font-serif text-4xl font-light text-foreground mb-8">Shopping Cart</h1>

//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
//             {/* Cart Items List */}
//             <div className="lg:col-span-2">
//               <div className="space-y-4 mb-6 pb-4 border-b border-border">
//                 <p className="text-sm font-sans text-muted-foreground">
//                   {items.length} item{items.length !== 1 ? 's' : ''} in cart
//                 </p>
//               </div>

//               <div className="space-y-6">
//                 {items.map((item) => {
//                   const unitPrice = parseFloat(String(item.product?.salePrice || item.product?.price || 0)) || 0
//                   const itemTotal = unitPrice * item.quantity
//                   const imageSrc = getProductImage(item)

//                   return (
//                     <div key={item.productId} className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-border">
//                       {/* Product Image Container */}
//                       <div className="relative w-full sm:w-32 h-40 sm:h-32 bg-muted rounded overflow-hidden flex-shrink-0">
//                         <Image
//                           src={imageSrc}
//                           alt={item.product?.name || 'Product Image'}
//                           fill
//                           className="object-cover"
//                           sizes="(max-width: 640px) 100vw, 128px"
//                           unoptimized={imageSrc.startsWith('http')}
//                         />
//                       </div>

//                       {/* Product Details & Selection Badges */}
//                       <div className="flex-grow flex flex-col justify-between">
//                         <div>
//                           <Link href={`/collections/${item.product?.slug || ''}`}>
//                             <h3 className="font-serif text-xl font-medium text-foreground hover:text-gold transition-colors">
//                               {item.product?.name || 'Product'}
//                             </h3>
//                           </Link>

//                           {/* Selected Customizations Badges */}
//                           <div className="flex flex-wrap gap-2 mt-3">
//                             {/* Selected Color */}
//                             {item.selectedColor && (
//                               <span className="inline-flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1 rounded text-foreground border border-border">
//                                 <span className="font-medium text-muted-foreground">Color:</span>
//                                 {typeof item.selectedColor === 'string' 
//                                   ? item.selectedColor 
//                                   : item.selectedColor.name}
//                               </span>
//                             )}

//                             {/* Selected Material */}
//                             {(item as any).selectedMaterial && (
//                               <span className="inline-flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1 rounded text-foreground border border-border">
//                                 <span className="font-medium text-muted-foreground">Material:</span>
//                                 {typeof (item as any).selectedMaterial === 'string'
//                                   ? (item as any).selectedMaterial
//                                   : (item as any).selectedMaterial.name}
//                               </span>
//                             )}

//                             {/* Selected Variant */}
//                             {item.selectedVariant && (
//                               <span className="inline-flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1 rounded text-foreground border border-border">
//                                 <span className="font-medium text-muted-foreground">Variant:</span>
//                                 {typeof item.selectedVariant === 'string'
//                                   ? item.selectedVariant
//                                   : item.selectedVariant.name}
//                               </span>
//                             )}

//                             {/* Selected Accessories */}
//                             {item.selectedAccessories && item.selectedAccessories.length > 0 && (
//                               <span className="inline-flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1 rounded text-foreground border border-border">
//                                 <span className="font-medium text-muted-foreground">Add-ons:</span>
//                                 {item.selectedAccessories.map((a: any) => typeof a === 'string' ? a : a.name).join(', ')}
//                               </span>
//                             )}

//                             {/* Custom Dimensions */}
//                             {item.customDimensions && (
//                               <span className="inline-flex items-center gap-1.5 text-xs bg-gold/10 text-gold px-2.5 py-1 rounded border border-gold/30">
//                                 <Sparkles className="w-3 h-3" />
//                                 Custom Dims: {item.customDimensions.width ? `${item.customDimensions.width}″W` : ''}
//                                 {item.customDimensions.height ? ` × ${item.customDimensions.height}″H` : ''}
//                                 {item.customDimensions.depth ? ` × ${item.customDimensions.depth}″D` : ''}
//                               </span>
//                             )}
//                           </div>
//                         </div>

//                         <p className="font-serif text-lg font-medium text-foreground mt-3 sm:mt-0">
//                           ${safeFormatNumber(unitPrice)}
//                         </p>
//                       </div>

//                       {/* Quantity Selector & Remove Button */}
//                       <div className="flex sm:flex-col items-center sm:items-end justify-between gap-4">
//                         <div className="flex items-center border border-border rounded">
//                           <button
//                             onClick={() => updateQuantity(item.productId, item.quantity - 1)}
//                             className="p-1.5 hover:bg-muted transition-colors"
//                             aria-label="Decrease quantity"
//                           >
//                             <Minus size={14} />
//                           </button>
//                           <span className="px-3 py-1 font-sans text-sm font-medium">{item.quantity}</span>
//                           <button
//                             onClick={() => updateQuantity(item.productId, item.quantity + 1)}
//                             className="p-1.5 hover:bg-muted transition-colors"
//                             aria-label="Increase quantity"
//                           >
//                             <Plus size={14} />
//                           </button>
//                         </div>

//                         {/* Confirmed Remove Button */}
//                         <button
//                           onClick={() => handleRemoveItem(item.productId, item.product?.name)}
//                           className="text-muted-foreground hover:text-destructive transition-colors p-2"
//                           title="Remove item from cart"
//                           aria-label="Remove item"
//                         >
//                           <X size={18} />
//                         </button>

//                         <div className="text-right">
//                           <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Subtotal</p>
//                           <p className="font-serif text-lg font-medium text-foreground">
//                             ${safeFormatNumber(itemTotal)}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             </div>

//             {/* Order Summary Sidebar */}
//             {cart && (
//               <div className="lg:col-span-1">
//                 <div className="bg-muted/50 border border-border rounded-lg p-6 sm:p-8 sticky top-24">
//                   <h2 className="font-serif text-2xl font-light text-foreground mb-6">
//                     Order Summary
//                   </h2>

//                   <div className="space-y-4 mb-6 pb-6 border-b border-border">
//                     <div className="flex justify-between text-sm text-foreground">
//                       <span>Subtotal</span>
//                       <span>${safeFormatNumber(cart.subtotal)}</span>
//                     </div>
//                     <div className="flex justify-between text-sm text-foreground">
//                       <span>Tax (10%)</span>
//                       <span>${safeFormatNumber(cart.tax)}</span>
//                     </div>
//                     <div className="flex justify-between text-sm text-foreground">
//                       <span>Shipping</span>
//                       <span>${safeFormatNumber(cart.shipping)}</span>
//                     </div>
//                   </div>

//                   <div className="flex justify-between mb-8">
//                     <span className="font-serif text-xl font-medium text-foreground">Total</span>
//                     <span className="font-serif text-2xl font-medium text-gold">
//                       ${safeFormatNumber(cart.total)}
//                     </span>
//                   </div>

//                   {/* Customer Name Input */}
//                   <div className="mb-6">
//                     <label className="block text-xs font-sans text-muted-foreground uppercase tracking-wider mb-2">
//                       Your Name (for WhatsApp Order)
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="e.g. John Doe"
//                       value={customerName || ''}
//                       onChange={(e) => setCustomerName(e.target.value)}
//                       className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
//                     />
//                   </div>

//                   <div className="space-y-3">
//                     <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 font-sans tracking-wide">
//                       <Link href="/checkout">Proceed to Checkout</Link>
//                     </Button>

//                     <Button onClick={shareToWhatsApp} variant="outline" className="w-full border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 py-6 font-sans">
//                       <MessageCircle className="mr-2 h-4 w-4" /> Send Cart to WhatsApp
//                     </Button>

//                     <Button onClick={handleClearCart} variant="ghost" className="w-full text-muted-foreground hover:text-destructive">
//                       <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
//                     </Button>

//                     <Button asChild variant="outline" className="w-full border-border">
//                       <Link href="/collections">Continue Shopping</Link>
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </main>

//       <SiteFooter />
//     </div>
//   )
// }
