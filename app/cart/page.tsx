'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCart } from '@/lib/context/cart-context'
import { 
  X, 
  Plus, 
  Minus, 
  MessageCircle, 
  Trash2, 
  Loader2, 
  ArrowRight, 
  Ruler, 
  ShieldCheck, 
  Truck, 
  Wrench, 
  FileText,
  ShoppingBag,
  Sparkles
} from 'lucide-react'

// Robust Currency Formatter
const formatPrice = (num: any, currencyCode = 'UGX'): string => {
  const val = typeof num === 'string' ? parseFloat(num) : Number(num)
  if (isNaN(val) || val === null || val === undefined) return `${currencyCode} 0`
  
  const isUgx = currencyCode.toUpperCase() === 'UGX'
  const formatted = val.toLocaleString('en-US', {
    minimumFractionDigits: isUgx ? 0 : 2,
    maximumFractionDigits: isUgx ? 0 : 2,
  })
  
  return `${currencyCode} ${formatted}`
}

// Calculate true unit price including all add-ons and variants
const getItemUnitPrice = (item: any): number => {
  // If item already has a pre-calculated unit price from custom dimensions
  if (item.calculatedUnitPrice !== undefined && item.calculatedUnitPrice > 0) {
    return Number(item.calculatedUnitPrice)
  }

  let price = parseFloat(String(item.product?.salePrice || item.product?.price || 0)) || 0

  // Add variant extra cost if applicable
  if (item.selectedVariant?.price) {
    price += parseFloat(String(item.selectedVariant.price)) || 0
  }

  // Add accessories extra cost
  if (Array.isArray(item.selectedAccessories)) {
    item.selectedAccessories.forEach((acc: any) => {
      if (acc.price) price += parseFloat(String(acc.price)) || 0
    })
  }

  return price
}

// Bulletproof Image Resolver
const getProductImage = (item: any): string => {
  if (item.selectedColor?.image) return item.selectedColor.image
  
  const product = item?.product
  if (!product) return '/placeholder.jpg'

  if (product.thumbnailImage) return product.thumbnailImage
  if (product.image) return product.image

  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstImg = product.images[0]
    if (typeof firstImg === 'string' && firstImg.length > 0) return firstImg
    if (typeof firstImg === 'object' && firstImg?.url) return firstImg.url
  }

  if (typeof product.images === 'string' && product.images.trim().length > 0) {
    try {
      const parsed = JSON.parse(product.images)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
    } catch {
      return product.images
    }
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

  // Project Notes & Services State
  const [projectNotes, setProjectNotes] = useState('')
  const [needInstallation, setNeedInstallation] = useState(false)
  const [needSiteVisit, setNeedSiteVisit] = useState(false)

  // Dynamic Related Products State
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)

  const activeCurrency = items[0]?.product?.currency || 'UGX'

  // Fetch Related Products matching cart items' category from DB
  useEffect(() => {
    if (items.length === 0) return

    const primaryCategory = items[0]?.product?.category || items[0]?.product?.categorySlug
    if (!primaryCategory) return

    async function fetchRelated() {
      setLoadingRelated(true)
      try {
        const res = await fetch(`/api/products?category=${encodeURIComponent(primaryCategory)}&limit=4`)
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          // Exclude items already in cart
          const cartIds = new Set(items.map(i => i.productId))
          const filtered = data.data.filter((p: any) => !cartIds.has(p.id))
          setRelatedProducts(filtered.slice(0, 3))
        }
      } catch (err) {
        console.error('Failed to fetch related products:', err)
      } finally {
        setLoadingRelated(false)
      }
    }

    fetchRelated()
  }, [items])

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
      pr: getItemUnitPrice(item),
      cur: item.product?.currency || 'UGX',
      img: getProductImage(item),
      s: item.product?.slug || ''
    }))

    const encodedCart = encodeURIComponent(btoa(JSON.stringify(compactPayload)))
    const cartShareLink = `${baseUrl}/cart?c=${encodedCart}&name=${encodeURIComponent(name)}`

    const formattedItems = items.map((item, idx) => {
      const unitPrice = getItemUnitPrice(item)
      const price = unitPrice * item.quantity
      const details: string[] = []

      if (item.selectedColor) details.push(`Color: ${item.selectedColor.name || item.selectedColor}`)
      if ((item as any).selectedMaterial) details.push(`Material: ${(item as any).selectedMaterial.name || (item as any).selectedMaterial}`)
      if (item.selectedVariant) details.push(`Variant: ${item.selectedVariant.name || item.selectedVariant}`)
      if (item.selectedAccessories?.length) {
        details.push(`Add-ons: ${item.selectedAccessories.map((a: any) => `${a.name || a}${a.price ? ` (+${formatPrice(a.price, activeCurrency)})` : ''}`).join(', ')}`)
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

    let extraServicesText = ''
    if (needInstallation) extraServicesText += '\n• Requested Professional Installation'
    if (needSiteVisit) extraServicesText += '\n• Requested On-Site Measurement Consultation'
    if (projectNotes.trim()) extraServicesText += `\n• *Project Notes:* ${projectNotes.trim()}`

    const message = ` *NEW STUDIO CART ENQUIRY*\n *Client:* ${name}\n\n${formattedItems}${extraServicesText ? `\n\n *Studio Services & Notes:*${extraServicesText}` : ''}\n\n------------------------------\n *ESTIMATED TOTAL:* ${formatPrice(cart?.total || 0, activeCurrency)}\n------------------------------\n\n🔗 *Review Cart Online:* \n${cartShareLink}`

    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, '') || '256700000000'
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
        <SiteHeader />
        <main className="flex-grow pt-32 pb-24 flex items-center justify-center">
          <div className="text-center py-20">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-800 mb-4" />
            <p className="text-xs uppercase tracking-widest text-neutral-500 font-sans">Retrieving your selection...</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
        <SiteHeader />
        <main className="flex-grow pt-32 pb-24">
          <div className="px-6 lg:px-12 max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#EFECE6] flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-neutral-600" />
            </div>
            
            <h1 className="font-serif text-3xl md:text-4xl font-normal text-neutral-900 mb-3">
              Your cart is currently empty
            </h1>
            <p className="max-w-md mx-auto text-neutral-600 font-light text-sm mb-10 leading-relaxed">
              Explore our curated collections of bespoke furniture, architectural decor, and custom wall coverings.
            </p>

            <Button asChild size="lg" className="bg-neutral-900 text-white hover:bg-neutral-800 px-10 py-6 font-sans uppercase tracking-widest text-xs rounded-none">
              <Link href="/collections">Explore Collections</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-neutral-900">
      <SiteHeader />

      <main className="flex-grow pt-28 md:pt-36 pb-24">
        <div className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
          
          {/* Header Bar */}
          <div className="flex items-baseline justify-between pb-6 mb-8 border-b border-neutral-300">
            <h1 className="font-serif text-3xl md:text-4xl font-normal text-neutral-900">
              Your Cart <span className="text-base font-sans font-light text-neutral-500">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
            </h1>
            <button 
              onClick={handleClearCart} 
              className="text-xs font-sans text-neutral-500 hover:text-neutral-900 underline underline-offset-4 transition-colors"
            >
              Clear Cart
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Items List + Replacement Project Service Card */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Cart Items */}
              <div className="space-y-6">
                {items.map((item) => {
                  const unitPrice = getItemUnitPrice(item)
                  const itemTotal = unitPrice * item.quantity
                  const imageSrc = getProductImage(item)

                  return (
                    <div 
                      key={item.productId} 
                      className="p-5 md:p-6 bg-[#F3EFEA] border border-neutral-200/80 rounded-none flex flex-col sm:flex-row gap-6 relative"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-full sm:w-32 h-40 sm:h-32 bg-[#EADFD4] flex-shrink-0 overflow-hidden">
                        <Image
                          src={imageSrc}
                          alt={item.product?.name || 'Product Image'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 128px"
                          unoptimized={imageSrc.startsWith('http')}
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-grow flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <Link href={`/collections/${item.product?.slug || ''}`}>
                              <h3 className="font-serif text-lg font-normal text-neutral-900 hover:underline">
                                {item.product?.name || 'Bespoke Item'}
                              </h3>
                            </Link>
                            
                            <button
                              onClick={() => handleRemoveItem(item.productId, item.product?.name)}
                              className="text-neutral-400 hover:text-neutral-800 transition-colors p-1"
                              aria-label="Remove item"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {/* Unit Base Price */}
                          <p className="text-xs text-neutral-500 mt-1">
                            Unit Price: {formatPrice(unitPrice, activeCurrency)}
                          </p>

                          {/* Customizations Badges */}
                          <div className="flex flex-wrap gap-2 mt-3 text-xs text-neutral-700">
                            {item.selectedColor && (
                              <span className="bg-[#E5DFD5] px-2 py-0.5 border border-neutral-300">
                                Color: {typeof item.selectedColor === 'string' ? item.selectedColor : item.selectedColor.name}
                              </span>
                            )}

                            {(item as any).selectedMaterial && (
                              <span className="bg-[#E5DFD5] px-2 py-0.5 border border-neutral-300">
                                Material: {typeof (item as any).selectedMaterial === 'string' ? (item as any).selectedMaterial : (item as any).selectedMaterial.name}
                              </span>
                            )}

                            {item.selectedVariant && (
                              <span className="bg-[#E5DFD5] px-2 py-0.5 border border-neutral-300">
                                Variant: {typeof item.selectedVariant === 'string' ? item.selectedVariant : item.selectedVariant.name}
                                {item.selectedVariant.price ? ` (+${formatPrice(item.selectedVariant.price, activeCurrency)})` : ''}
                              </span>
                            )}

                            {item.selectedAccessories && item.selectedAccessories.length > 0 && (
                              <span className="bg-[#E5DFD5] px-2 py-0.5 border border-neutral-300">
                                Add-ons: {item.selectedAccessories.map((a: any) => `${a.name || a}${a.price ? ` (+${formatPrice(a.price, activeCurrency)})` : ''}`).join(', ')}
                              </span>
                            )}

                            {item.customDimensions && (
                              <span className="bg-[#E8DCCB] text-neutral-900 px-2 py-0.5 border border-amber-800/20 flex items-center gap-1 font-medium">
                                <Ruler className="w-3 h-3 text-amber-800" />
                                Dims: {item.customDimensions.width ? `${item.customDimensions.width}″W` : ''}
                                {item.customDimensions.height ? ` × ${item.customDimensions.height}″H` : ''}
                                {item.customDimensions.depth ? ` × ${item.customDimensions.depth}″D` : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Controls & Price Row */}
                        <div className="flex items-center justify-between pt-3 border-t border-neutral-300/60">
                          {/* Minimalist Quantity Box */}
                          <div className="flex items-center border border-neutral-400 bg-white">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="px-2.5 py-1 text-neutral-600 hover:bg-neutral-100 transition-colors text-xs"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="px-3 py-1 font-sans text-xs font-medium border-x border-neutral-200">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="px-2.5 py-1 text-neutral-600 hover:bg-neutral-100 transition-colors text-xs"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          {/* Item Subtotal */}
                          <div className="text-right">
                            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">Subtotal</span>
                            <span className="font-serif text-base font-medium text-neutral-900">
                              {formatPrice(itemTotal, activeCurrency)}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  )
                })}
              </div>

              {/* REPLACEMENT CARD FOR THE CIRCLED AREA: Studio Services & Site Notes */}
              <div className="bg-[#F3EFEA] border border-neutral-300 p-6 space-y-5">
                <div className="flex items-center gap-2 border-b border-neutral-300 pb-3">
                  <Wrench className="w-4 h-4 text-neutral-700" />
                  <h3 className="font-serif text-base font-normal text-neutral-900">
                    Bespoke Installation & Site Notes
                  </h3>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={needInstallation} 
                      onChange={(e) => setNeedInstallation(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded-none border-neutral-400 text-neutral-900 focus:ring-0"
                    />
                    <span className="text-xs text-neutral-700 group-hover:text-neutral-900">
                      <strong>Request Professional Installation</strong> — Have our certified craftsmen install your wallpaper or position your furniture on delivery.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={needSiteVisit} 
                      onChange={(e) => setNeedSiteVisit(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded-none border-neutral-400 text-neutral-900 focus:ring-0"
                    />
                    <span className="text-xs text-neutral-700 group-hover:text-neutral-900">
                      <strong>Request On-Site Measurement Visit</strong> — Schedule a studio technician to confirm wall dimensions or room clearances before production.
                    </span>
                  </label>
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-1.5 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Project Notes / Special Site Instructions
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="e.g. Ceiling height is 3.1 meters, deliver to 2nd floor office, contact site manager..."
                    value={projectNotes}
                    onChange={(e) => setProjectNotes(e.target.value)}
                    className="bg-white border-neutral-300 text-xs rounded-none focus-visible:ring-0 focus-visible:border-neutral-900"
                  />
                </div>
              </div>

            </div>

            {/* Right Column: Order Summary */}
            {cart && (
              <div className="lg:col-span-5">
                <div className="bg-[#F3EFEA] border border-neutral-300 p-6 md:p-8 sticky top-28 space-y-6">
                  
                  <h2 className="font-serif text-2xl font-normal text-neutral-900 pb-4 border-b border-neutral-300">
                    Order Summary
                  </h2>

                  {/* Summary Rows */}
                  <div className="space-y-3.5 text-xs text-neutral-700 font-light">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-normal text-neutral-900">{formatPrice(cart.subtotal, activeCurrency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        Shipping <span className="text-[10px] text-neutral-500">(Studio Logistics)</span>
                      </span>
                      <span className="font-normal text-neutral-900">
                        {cart.shipping === 0 ? 'Calculated at Checkout' : formatPrice(cart.shipping, activeCurrency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Tax</span>
                      <span className="font-normal text-neutral-900">{formatPrice(cart.tax, activeCurrency)}</span>
                    </div>
                  </div>

                  {/* Total Row */}
                  <div className="pt-4 border-t border-neutral-300 flex justify-between items-baseline">
                    <span className="font-serif text-lg font-normal text-neutral-900">Estimated Total</span>
                    <span className="font-serif text-2xl font-normal text-neutral-900">
                      {formatPrice(cart.total, activeCurrency)}
                    </span>
                  </div>

                  {/* Customer Name */}
                  <div className="pt-2 space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-medium">
                      Your Name (for WhatsApp Order Enquiry)
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Arch. Sarah Namubiru"
                      value={customerName || ''}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="bg-white border-neutral-300 text-xs rounded-none focus-visible:ring-0 focus-visible:border-neutral-900"
                    />
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="space-y-3 pt-2">
                    <Button asChild size="lg" className="w-full bg-neutral-900 text-white hover:bg-neutral-800 py-6 font-sans text-xs uppercase tracking-widest rounded-none">
                      <Link href="/checkout">Proceed to Checkout</Link>
                    </Button>

                    <Button 
                      onClick={shareToWhatsApp} 
                      variant="outline" 
                      className="w-full border-emerald-700/40 bg-emerald-800/10 text-emerald-900 hover:bg-emerald-800/20 py-6 font-sans text-xs uppercase tracking-widest rounded-none gap-2"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-700" /> Send Cart to WhatsApp
                    </Button>
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* Dynamic "You May Also Like" Grid Fetched From DB */}
          <div className="mt-20 pt-12 border-t border-neutral-300">
            <h2 className="font-serif text-2xl font-normal text-neutral-900 mb-6 flex items-center justify-between">
              <span>You May Also Like</span>
              <Link href="/collections" className="text-xs font-sans text-neutral-600 hover:text-neutral-900 flex items-center gap-1 font-light">
                View All Collections <ArrowRight className="w-3 h-3" />
              </Link>
            </h2>

            {loadingRelated ? (
              <div className="py-12 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Fetching matching studio items...
              </div>
            ) : relatedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {relatedProducts.map((rec) => {
                  const recPrice = parseFloat(String(rec.salePrice || rec.price || 0))
                  const recImg = rec.thumbnailImage || rec.image || (Array.isArray(rec.images) ? rec.images[0] : '/placeholder.jpg')

                  return (
                    <div key={rec.id} className="bg-[#F3EFEA] border border-neutral-300 p-4 group flex flex-col justify-between">
                      <div>
                        <div className="relative w-full h-48 bg-[#EADFD4] mb-4 overflow-hidden">
                          <Image 
                            src={recImg} 
                            alt={rec.name || 'Product'} 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-500" 
                            unoptimized={typeof recImg === 'string' && recImg.startsWith('http')}
                          />
                        </div>
                        {rec.category && (
                          <span className="text-[10px] uppercase tracking-widest text-amber-800 font-medium block mb-1">
                            {rec.category}
                          </span>
                        )}
                        <h4 className="font-serif text-base text-neutral-900 group-hover:underline">
                          {rec.name}
                        </h4>
                      </div>
                      <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-800">
                          {formatPrice(recPrice, rec.currency || activeCurrency)}
                        </span>
                        <Link 
                          href={`/collections/${rec.slug}`}
                          className="text-xs text-neutral-900 font-medium underline underline-offset-4 hover:text-amber-800"
                        >
                          View Item
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic">Explore our collections for more matching items.</p>
            )}
          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
