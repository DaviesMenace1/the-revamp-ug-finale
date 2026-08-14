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
  ChevronDown,
  ChevronUp,
  Gift,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Bookmark,
  ShoppingBag,
  Ruler
} from 'lucide-react'

// Dynamic Currency & Precision Formatter
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

// Mock Recommended Products for "You May Also Like"
const RECOMMENDED_PRODUCTS = [
  {
    id: 'rec-1',
    name: 'Teak Wood Care Kit & Wax',
    tag: 'Essential Maintenance',
    price: 45000,
    currency: 'UGX',
    image: '/placeholder.jpg',
    slug: 'teak-wood-care-kit'
  },
  {
    id: 'rec-2',
    name: 'Italian Leather Cleaning Balm',
    tag: 'Studio Favorite',
    price: 65000,
    currency: 'UGX',
    image: '/placeholder.jpg',
    slug: 'leather-cleaning-balm'
  },
  {
    id: 'rec-3',
    name: 'Bespoke Brass Coaster Set (4pcs)',
    tag: 'Beloved Craft',
    price: 120000,
    currency: 'UGX',
    image: '/placeholder.jpg',
    slug: 'brass-coaster-set'
  }
]

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

  // Accordion Toggles (Aesop Style)
  const [openSamples, setOpenSamples] = useState(false)
  const [openGift, setOpenGift] = useState(false)
  const [openPromo, setOpenPromo] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [selectedSamples, setSelectedSamples] = useState<string[]>([])

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

  const toggleSample = (sampleName: string) => {
    if (selectedSamples.includes(sampleName)) {
      setSelectedSamples(selectedSamples.filter(s => s !== sampleName))
    } else if (selectedSamples.length < 3) {
      setSelectedSamples([...selectedSamples, sampleName])
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
        details.push(`Add-ons: ${item.selectedAccessories.map((a: any) => a.name || a).join(', ')}`)
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

    const message = `🛍️ *NEW CART ENQUIRY*\n👤 *Customer:* ${name}\n\n${formattedItems}${selectedSamples.length > 0 ? `\n\n🎨 *Selected Swatches:* ${selectedSamples.join(', ')}` : ''}\n\n------------------------------\n💰 *ESTIMATED TOTAL:* ${formatPrice(cart?.total || 0, activeCurrency)}\n------------------------------\n\n🔗 *View & Verify Cart:* \n${cartShareLink}`

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

  // Empty State (Aesop Inspired Minimalist)
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
              Discover our handcrafted bespoke furniture, architectural components, and luxury interior products.
            </p>

            <Button asChild size="lg" className="bg-neutral-900 text-white hover:bg-neutral-800 px-10 py-6 font-sans uppercase tracking-widest text-xs rounded-none">
              <Link href="/collections">Explore Collections</Link>
            </Button>

            {/* Quick Links */}
            <div className="mt-16 pt-12 border-t border-neutral-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              {[
                { title: 'Living Room', href: '/collections?category=Living+Room' },
                { title: 'Bespoke Sofas', href: '/collections?category=Sofas' },
                { title: 'Architectural Lighting', href: '/collections?category=Lighting' },
                { title: 'Material Swatches', href: '/collections?category=Swatches' },
              ].map((cat) => (
                <Link key={cat.title} href={cat.href} className="group p-4 bg-[#F3EFEA] hover:bg-[#EAE4DC] transition-colors rounded-none">
                  <span className="text-xs font-sans text-neutral-800 group-hover:text-black flex items-center justify-between">
                    {cat.title} <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-1 transition-transform" />
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
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-neutral-900">
      <SiteHeader />

      {/* Announcement Bar (Aesop Style) */}
      <div className="bg-[#EFECE6] text-neutral-800 text-center py-2.5 px-4 text-xs tracking-wide font-light border-b border-neutral-200/60 mt-16 md:mt-20">
        <p>✨ Enjoy complimentary delivery on managed studio orders over UGX 2,000,000.</p>
      </div>

      <main className="flex-grow pt-8 pb-24">
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
            
            {/* Left Column: Cart Items & Aesop Accordions */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Cart Items List */}
              <div className="space-y-6">
                {items.map((item) => {
                  const unitPrice = parseFloat(String(item.product?.salePrice || item.product?.price || 0)) || 0
                  const originalPrice = item.product?.price && item.product?.salePrice ? parseFloat(String(item.product.price)) : null
                  const itemTotal = unitPrice * item.quantity
                  const imageSrc = getProductImage(item)
                  
                  // Discount percentage calculation
                  const discountPercent = originalPrice && originalPrice > unitPrice 
                    ? Math.round(((originalPrice - unitPrice) / originalPrice) * 100)
                    : null

                  return (
                    <div 
                      key={item.productId} 
                      className="p-5 md:p-6 bg-[#F3EFEA] border border-neutral-200/80 rounded-none transition-all flex flex-col sm:flex-row gap-6 relative"
                    >
                      {/* Product Thumbnail */}
                      <div className="relative w-full sm:w-32 h-40 sm:h-32 bg-[#EADFD4] flex-shrink-0 overflow-hidden">
                        <Image
                          src={imageSrc}
                          alt={item.product?.name || 'Product Image'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 128px"
                          unoptimized={imageSrc.startsWith('http')}
                        />
                        {discountPercent && (
                          <span className="absolute top-2 left-2 bg-amber-700 text-white text-[10px] font-semibold px-1.5 py-0.5 tracking-wider">
                            -{discountPercent}%
                          </span>
                        )}
                      </div>

                      {/* Product Details */}
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

                          {/* Urgency Stock Tag */}
                          <p className="text-[11px] text-amber-800 font-medium mt-1 flex items-center gap-1">
                            <span>⚡</span> Few units left in stock
                          </p>

                          {/* Customizations Badges */}
                          <div className="flex flex-wrap gap-2 mt-3 text-xs text-neutral-600">
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
                              </span>
                            )}

                            {item.customDimensions && (
                              <span className="bg-[#E8DCCB] text-neutral-900 px-2 py-0.5 border border-amber-800/20 flex items-center gap-1">
                                <Ruler className="w-3 h-3 text-amber-800" />
                                {item.customDimensions.width ? `${item.customDimensions.width}″W` : ''}
                                {item.customDimensions.height ? ` × ${item.customDimensions.height}″H` : ''}
                                {item.customDimensions.depth ? ` × ${item.customDimensions.depth}″D` : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Controls & Price Row */}
                        <div className="flex items-center justify-between pt-3 border-t border-neutral-300/60">
                          {/* Minimalist Quantity Selector (Aesop Box) */}
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

                          {/* Price Tag */}
                          <div className="text-right">
                            {originalPrice && originalPrice > unitPrice && (
                              <span className="text-xs text-neutral-400 line-through mr-2">
                                {formatPrice(originalPrice * item.quantity, activeCurrency)}
                              </span>
                            )}
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

              {/* Aesop Style Collapsible Accordions */}
              <div className="space-y-3 pt-4 border-t border-neutral-300">
                
                {/* Accordion 1: Material Swatch Samples */}
                <div className="border border-neutral-300 bg-[#F3EFEA]">
                  <button 
                    onClick={() => setOpenSamples(!openSamples)}
                    className="w-full p-4 text-left font-serif text-sm flex justify-between items-center text-neutral-800 hover:text-black"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-neutral-600" />
                      Add complimentary material swatches (Select up to 3)
                    </span>
                    {openSamples ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openSamples && (
                    <div className="p-4 pt-0 text-xs text-neutral-600 space-y-3 border-t border-neutral-200/60 mt-2">
                      <p className="font-light">We offer complimentary fabric and wood swatches with every order enquiry.</p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {['Italian Cognac Leather', 'Ugandan Hardwood Oak', 'Brushed Brass Accent', 'Velvet Emerald Fabric'].map((swatch) => (
                          <button
                            key={swatch}
                            onClick={() => toggleSample(swatch)}
                            className={`p-2.5 text-left border text-xs flex items-center justify-between transition-colors ${
                              selectedSamples.includes(swatch)
                                ? 'border-neutral-900 bg-neutral-900 text-white'
                                : 'border-neutral-300 bg-white hover:border-neutral-500 text-neutral-800'
                            }`}
                          >
                            <span>{swatch}</span>
                            {selectedSamples.includes(swatch) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 2: Gift & Consultation Options */}
                <div className="border border-neutral-300 bg-[#F3EFEA]">
                  <button 
                    onClick={() => setOpenGift(!openGift)}
                    className="w-full p-4 text-left font-serif text-sm flex justify-between items-center text-neutral-800 hover:text-black"
                  >
                    <span className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-neutral-600" />
                      Add gift options or custom studio packaging
                    </span>
                    {openGift ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openGift && (
                    <div className="p-4 pt-0 text-xs text-neutral-600 space-y-3 border-t border-neutral-200/60 mt-2">
                      <p className="font-light">Includes high-grade protective wrapping and an embossed handwritten studio note.</p>
                      <textarea 
                        rows={3} 
                        placeholder="Type your gift message or custom instructions here..." 
                        className="w-full p-2.5 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                  )}
                </div>

                {/* Accordion 3: Promo Code */}
                <div className="border border-neutral-300 bg-[#F3EFEA]">
                  <button 
                    onClick={() => setOpenPromo(!openPromo)}
                    className="w-full p-4 text-left font-serif text-sm flex justify-between items-center text-neutral-800 hover:text-black"
                  >
                    <span className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-neutral-600" />
                      Add a promo code or trade voucher
                    </span>
                    {openPromo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openPromo && (
                    <div className="p-4 pt-0 text-xs text-neutral-600 space-y-3 border-t border-neutral-200/60 mt-2">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Enter voucher code" 
                          value={promoCode} 
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="bg-white border-neutral-300 text-xs rounded-none focus-visible:ring-0 focus-visible:border-neutral-900"
                        />
                        <Button className="bg-neutral-900 text-white hover:bg-neutral-800 text-xs rounded-none px-6">
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Right Column: Order Summary (Aesop Style Clean Box) */}
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
                        {cart.shipping === 0 ? 'Complimentary' : formatPrice(cart.shipping, activeCurrency)}
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

                  {/* Customer Name for WhatsApp Enquiry */}
                  <div className="pt-2 space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-medium">
                      Your Name (for WhatsApp Order Enquiry)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Architect Sarah Namubiru"
                      value={customerName || ''}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-2.5 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-neutral-900 rounded-none"
                    />
                  </div>

                  {/* Primary CTAs */}
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

                  {/* Secure Payment Badges (Aesop Style) */}
                  <div className="pt-6 border-t border-neutral-300 text-center space-y-3">
                    <p className="text-[11px] text-neutral-500 uppercase tracking-widest font-medium">Secure Payments</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-neutral-600">
                      <span className="px-2 py-1 bg-white border border-neutral-200">VISA</span>
                      <span className="px-2 py-1 bg-white border border-neutral-200">Mastercard</span>
                      <span className="px-2 py-1 bg-white border border-neutral-200">MTN MoMo</span>
                      <span className="px-2 py-1 bg-white border border-neutral-200">Airtel Money</span>
                      <span className="px-2 py-1 bg-white border border-neutral-200">PayPal</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* Integrated "You May Also Like" Recommendation Grid (Aesop Style Carousel) */}
          <div className="mt-20 pt-12 border-t border-neutral-300">
            <h2 className="font-serif text-2xl font-normal text-neutral-900 mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {RECOMMENDED_PRODUCTS.map((rec) => (
                <div key={rec.id} className="bg-[#F3EFEA] border border-neutral-300 p-4 group flex flex-col justify-between">
                  <div>
                    <div className="relative w-full h-48 bg-[#EADFD4] mb-4 overflow-hidden">
                      <Image 
                        src={rec.image} 
                        alt={rec.name} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-amber-800 font-medium block mb-1">
                      {rec.tag}
                    </span>
                    <h4 className="font-serif text-base text-neutral-900 group-hover:underline">
                      {rec.name}
                    </h4>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-800">
                      {formatPrice(rec.price, rec.currency)}
                    </span>
                    <Link 
                      href={`/collections/${rec.slug}`}
                      className="text-xs text-neutral-900 font-medium underline underline-offset-4 hover:text-amber-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Mobile Sticky Checkout CTA (Jumia Style) */}
      {cart && items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F3EFEA] border-t border-neutral-300 p-3 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex-grow">
            <Button asChild size="lg" className="w-full bg-neutral-900 text-white hover:bg-neutral-800 py-4 font-sans text-xs uppercase tracking-wider rounded-none">
              <Link href="/checkout">
                Checkout ({formatPrice(cart.total, activeCurrency)})
              </Link>
            </Button>
          </div>
          <Button onClick={shareToWhatsApp} variant="outline" size="lg" className="border-emerald-700/40 bg-emerald-800/10 text-emerald-800 p-3 rounded-none">
            <MessageCircle className="w-5 h-5" />
          </Button>
        </div>
      )}

      <SiteFooter />
    </div>
  )
}



// 'use client'

// import React, { useState } from 'react'
// import Image from 'next/image'
// import Link from 'next/link'
// import { SiteHeader } from '@/components/site-header'
// import { SiteFooter } from '@/components/site-footer'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { useCart } from '@/lib/context/cart-context'
// import { 
//   X, 
//   Plus, 
//   Minus, 
//   MessageCircle, 
//   Trash2, 
//   Loader2, 
//   Sparkles, 
//   ArrowRight, 
//   ShieldCheck, 
//   Truck, 
//   Ruler, 
//   ShoppingBag 
// } from 'lucide-react'

// // Dynamic Currency & Number Formatter
// const formatPrice = (num: any, currencyCode = 'UGX'): string => {
//   const val = typeof num === 'string' ? parseFloat(num) : Number(num)
//   if (isNaN(val) || val === null || val === undefined) return '0.00'
  
//   const isUgx = currencyCode.toUpperCase() === 'UGX'
//   const formatted = val.toLocaleString('en-US', {
//     minimumFractionDigits: isUgx ? 0 : 2,
//     maximumFractionDigits: isUgx ? 0 : 2,
//   })
  
//   return `${currencyCode} ${formatted}`
// }

// // Bulletproof Image Resolver
// const getProductImage = (item: any): string => {
//   const product = item?.product
//   if (!product) return '/placeholder.jpg'

//   if (item.selectedColor?.image) return item.selectedColor.image
//   if (product.thumbnailImage) return product.thumbnailImage

//   if (Array.isArray(product.images) && product.images.length > 0) {
//     const firstImg = product.images[0]
//     if (typeof firstImg === 'string' && firstImg.length > 0) return firstImg
//     if (typeof firstImg === 'object' && firstImg?.url) return firstImg.url
//   }

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

//   const [promoCode, setPromoCode] = useState('')

//   const activeCurrency = items[0]?.product?.currency || 'UGX'

//   const handleRemoveItem = (productId: string, productName?: string) => {
//     if (window.confirm(`Remove "${productName || 'this item'}" from your cart?`)) {
//       removeFromCart(productId)
//     }
//   }

//   const handleClearCart = () => {
//     if (window.confirm('Are you sure you want to clear your entire cart?')) {
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
//       cur: item.product?.currency || 'UGX',
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

//       const detailText = details.length > 0 ? `\n   └ _${details.join(' | ')}_` : ''
//       return `${idx + 1}. *${item.product?.name || 'Product'}* × ${item.quantity}${detailText}\n   *Subtotal:* ${formatPrice(price, activeCurrency)}`
//     }).join('\n\n')

//     const message = `🛍️ *NEW LUXURY ORDER ENQUIRY*\n👤 *Client:* ${name}\n\n${formattedItems}\n\n━━━━━━━━━━━━━━━━━━━━━━━\n💰 *ESTIMATED TOTAL:* ${formatPrice(cart?.total || 0, activeCurrency)}\n━━━━━━━━━━━━━━━━━━━━━━━\n\n🔗 *Review Order & Specs:* \n${cartShareLink}`

//     const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, '') || '256700000000'
//     window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
//   }

//   if (!isLoaded) {
//     return (
//       <div className="min-h-screen flex flex-col bg-background">
//         <SiteHeader />
//         <main className="flex-grow pt-32 pb-24 flex items-center justify-center">
//           <div className="text-center py-20">
//             <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold mb-4" />
//             <p className="text-xs uppercase tracking-widest text-muted-foreground font-sans">Retrieving your selection...</p>
//           </div>
//         </main>
//         <SiteFooter />
//       </div>
//     )
//   }

//   // Empty State Component
//   if (items.length === 0) {
//     return (
//       <div className="min-h-screen flex flex-col bg-background">
//         <SiteHeader />
//         <main className="flex-grow pt-32 pb-24">
//           <div className="px-6 lg:px-12 max-w-5xl mx-auto text-center">
//             <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/40 flex items-center justify-center border border-border/60">
//               <ShoppingBag className="w-8 h-8 text-muted-foreground/60" />
//             </div>
            
//             <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-4">
//               Your Cart is Empty
//             </h1>
//             <p className="max-w-md mx-auto text-muted-foreground font-light text-sm md:text-base mb-10 leading-relaxed">
//               Explore our curated collections of bespoke furniture, architectural decor, and luxury interior concepts.
//             </p>

//             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
//               <Button asChild size="lg" className="bg-gold text-black hover:bg-gold/90 px-8 font-sans uppercase tracking-widest text-xs">
//                 <Link href="/collections">Explore Collections</Link>
//               </Button>
//               <Button asChild variant="outline" size="lg" className="border-border text-foreground hover:bg-muted/30 px-8 font-sans uppercase tracking-widest text-xs">
//                 <Link href="/services">Design Consultation</Link>
//               </Button>
//             </div>

//             {/* Quick Navigation Category Grid */}
//             <div className="pt-12 border-t border-border/40 grid grid-cols-2 md:grid-cols-4 gap-4">
//               {[
//                 { title: 'Living Room', href: '/collections?category=Living+Room' },
//                 { title: 'Custom Furniture', href: '/collections?category=Furniture' },
//                 { title: 'Lighting & Decor', href: '/collections?category=Lighting' },
//                 { title: 'Architecture', href: '/collections?category=Architecture' },
//               ].map((cat) => (
//                 <Link key={cat.title} href={cat.href} className="group p-4 rounded-lg border border-border/30 bg-card hover:border-gold/40 transition-all text-left">
//                   <span className="text-xs font-serif text-foreground group-hover:text-gold transition-colors flex items-center justify-between">
//                     {cat.title} <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
//                   </span>
//                 </Link>
//               ))}
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

//       <main className="flex-grow pt-28 md:pt-36 pb-24">
//         <div className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
          
//           {/* Header Banner */}
//           <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 mb-8 border-b border-border/60">
//             <div>
//               <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-gold font-medium">Bespoke Selection</span>
//               <h1 className="font-serif text-3xl md:text-5xl font-light text-foreground mt-1">Shopping Cart</h1>
//             </div>
//             <div className="mt-4 md:mt-0 flex items-center gap-4 text-xs text-muted-foreground">
//               <span>{items.length} {items.length === 1 ? 'Item' : 'Items'}</span>
//               <span>•</span>
//               <button onClick={handleClearCart} className="hover:text-destructive transition-colors flex items-center gap-1">
//                 <Trash2 size={12} /> Clear Selection
//               </button>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
//             {/* Cart Items Column */}
//             <div className="lg:col-span-7 space-y-8">
//               <div className="divide-y divide-border/40">
//                 {items.map((item) => {
//                   const unitPrice = parseFloat(String(item.product?.salePrice || item.product?.price || 0)) || 0
//                   const itemTotal = unitPrice * item.quantity
//                   const imageSrc = getProductImage(item)

//                   return (
//                     <div key={item.productId} className="py-8 first:pt-0 flex flex-col sm:flex-row gap-6 group">
                      
//                       {/* Product Thumbnail */}
//                       <div className="relative w-full sm:w-36 h-48 sm:h-36 bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-border/40">
//                         <Image
//                           src={imageSrc}
//                           alt={item.product?.name || 'Product Image'}
//                           fill
//                           className="object-cover group-hover:scale-105 transition-transform duration-500"
//                           sizes="(max-width: 640px) 100vw, 144px"
//                           unoptimized={imageSrc.startsWith('http')}
//                         />
//                       </div>

//                       {/* Product Metadata & Customization Specs */}
//                       <div className="flex-grow flex flex-col justify-between space-y-4">
//                         <div>
//                           <div className="flex justify-between items-start gap-4">
//                             <Link href={`/collections/${item.product?.slug || ''}`}>
//                               <h3 className="font-serif text-lg md:text-xl font-normal text-foreground hover:text-gold transition-colors">
//                                 {item.product?.name || 'Bespoke Item'}
//                               </h3>
//                             </Link>
//                             <button
//                               onClick={() => handleRemoveItem(item.productId, item.product?.name)}
//                               className="text-muted-foreground/60 hover:text-destructive transition-colors p-1"
//                               aria-label="Remove item"
//                               title="Remove item"
//                             >
//                               <X size={16} />
//                             </button>
//                           </div>

//                           {/* Price Tag */}
//                           <p className="text-sm font-sans font-medium text-foreground/80 mt-1">
//                             {formatPrice(unitPrice, activeCurrency)}
//                           </p>

//                           {/* Customizations Metadata Grid */}
//                           <div className="flex flex-wrap gap-2 mt-3">
//                             {item.selectedColor && (
//                               <span className="inline-flex items-center gap-1.5 text-[11px] bg-muted/60 px-2.5 py-1 rounded text-foreground/80 border border-border/40">
//                                 <span className="text-muted-foreground">Color:</span>
//                                 {typeof item.selectedColor === 'string' ? item.selectedColor : item.selectedColor.name}
//                               </span>
//                             )}

//                             {(item as any).selectedMaterial && (
//                               <span className="inline-flex items-center gap-1.5 text-[11px] bg-muted/60 px-2.5 py-1 rounded text-foreground/80 border border-border/40">
//                                 <span className="text-muted-foreground">Material:</span>
//                                 {typeof (item as any).selectedMaterial === 'string' ? (item as any).selectedMaterial : (item as any).selectedMaterial.name}
//                               </span>
//                             )}

//                             {item.selectedVariant && (
//                               <span className="inline-flex items-center gap-1.5 text-[11px] bg-muted/60 px-2.5 py-1 rounded text-foreground/80 border border-border/40">
//                                 <span className="text-muted-foreground">Variant:</span>
//                                 {typeof item.selectedVariant === 'string' ? item.selectedVariant : item.selectedVariant.name}
//                               </span>
//                             )}

//                             {item.selectedAccessories && item.selectedAccessories.length > 0 && (
//                               <span className="inline-flex items-center gap-1.5 text-[11px] bg-muted/60 px-2.5 py-1 rounded text-foreground/80 border border-border/40">
//                                 <span className="text-muted-foreground">Add-ons:</span>
//                                 {item.selectedAccessories.map((a: any) => typeof a === 'string' ? a : a.name).join(', ')}
//                               </span>
//                             )}

//                             {item.customDimensions && (
//                               <span className="inline-flex items-center gap-1.5 text-[11px] bg-gold/10 text-gold px-2.5 py-1 rounded border border-gold/30">
//                                 <Ruler className="w-3 h-3" />
//                                 Custom Dims: {item.customDimensions.width ? `${item.customDimensions.width}″W` : ''}
//                                 {item.customDimensions.height ? ` × ${item.customDimensions.height}″H` : ''}
//                                 {item.customDimensions.depth ? ` × ${item.customDimensions.depth}″D` : ''}
//                               </span>
//                             )}
//                           </div>
//                         </div>

//                         {/* Quantity Adjuster & Subtotal */}
//                         <div className="flex items-center justify-between pt-2 border-t border-border/20">
//                           <div className="flex items-center border border-border/60 rounded bg-background">
//                             <button
//                               onClick={() => updateQuantity(item.productId, item.quantity - 1)}
//                               className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
//                               aria-label="Decrease quantity"
//                             >
//                               <Minus size={12} />
//                             </button>
//                             <span className="px-3 text-xs font-sans font-medium">{item.quantity}</span>
//                             <button
//                               onClick={() => updateQuantity(item.productId, item.quantity + 1)}
//                               className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
//                               aria-label="Increase quantity"
//                             >
//                               <Plus size={12} />
//                             </button>
//                           </div>

//                           <div className="text-right">
//                             <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Subtotal</span>
//                             <span className="font-serif text-base font-medium text-foreground">
//                               {formatPrice(itemTotal, activeCurrency)}
//                             </span>
//                           </div>
//                         </div>

//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>

//               {/* Guarantees / Service Callout */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-border/40">
//                 <div className="p-4 rounded-lg bg-card border border-border/40 flex items-start gap-3">
//                   <Truck className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
//                   <div>
//                     <h4 className="text-xs font-medium uppercase tracking-wider text-foreground">White-Glove Delivery</h4>
//                     <p className="text-xs text-muted-foreground font-light mt-1">Handled directly by our studio logistics for total peace of mind.</p>
//                   </div>
//                 </div>
//                 <div className="p-4 rounded-lg bg-card border border-border/40 flex items-start gap-3">
//                   <ShieldCheck className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
//                   <div>
//                     <h4 className="text-xs font-medium uppercase tracking-wider text-foreground">Studio Guarantee</h4>
//                     <p className="text-xs text-muted-foreground font-light mt-1">Crafted with luxury materials & precision engineering.</p>
//                   </div>
//                 </div>
//               </div>

//             </div>

//             {/* Sidebar Summary & Checkout */}
//             {cart && (
//               <div className="lg:col-span-5">
//                 <div className="bg-card border border-border/60 rounded-xl p-6 md:p-8 sticky top-28 space-y-6">
                  
//                   <h2 className="font-serif text-2xl font-light text-foreground pb-4 border-b border-border/40">
//                     Order Summary
//                   </h2>

//                   {/* Pricing Breakdown */}
//                   <div className="space-y-3 text-sm">
//                     <div className="flex justify-between text-muted-foreground font-light">
//                       <span>Items Subtotal</span>
//                       <span className="text-foreground font-normal">{formatPrice(cart.subtotal, activeCurrency)}</span>
//                     </div>
//                     <div className="flex justify-between text-muted-foreground font-light">
//                       <span>Estimated Tax</span>
//                       <span className="text-foreground font-normal">{formatPrice(cart.tax, activeCurrency)}</span>
//                     </div>
//                     <div className="flex justify-between text-muted-foreground font-light">
//                       <span>Delivery & Logistics</span>
//                       <span className="text-foreground font-normal">
//                         {cart.shipping > 0 ? formatPrice(cart.shipping, activeCurrency) : 'Calculated at Checkout'}
//                       </span>
//                     </div>
//                   </div>

//                   <div className="pt-4 border-t border-border/40 flex justify-between items-baseline">
//                     <span className="font-serif text-lg font-normal text-foreground">Total Estimate</span>
//                     <span className="font-serif text-2xl font-medium text-gold">
//                       {formatPrice(cart.total, activeCurrency)}
//                     </span>
//                   </div>

//                   {/* WhatsApp Quick Order Section */}
//                   <div className="p-4 bg-muted/20 border border-border/40 rounded-lg space-y-3">
//                     <label className="block text-[10px] font-sans text-muted-foreground uppercase tracking-widest">
//                       Your Name (Required for Direct Consultation)
//                     </label>
//                     <Input
//                       type="text"
//                       placeholder="e.g. Arch. Julian Vance"
//                       value={customerName || ''}
//                       onChange={(e) => setCustomerName(e.target.value)}
//                       className="bg-background text-sm border-border focus:border-gold"
//                     />
//                     <Button 
//                       onClick={shareToWhatsApp} 
//                       variant="outline" 
//                       className="w-full border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 py-5 font-sans text-xs uppercase tracking-wider gap-2"
//                     >
//                       <MessageCircle className="h-4 w-4" /> Send Cart to WhatsApp
//                     </Button>
//                   </div>

//                   {/* Standard Checkout CTA */}
//                   <div className="space-y-3">
//                     <Button asChild size="lg" className="w-full bg-gold text-black hover:bg-gold/90 py-6 font-sans text-xs uppercase tracking-widest font-medium">
//                       <Link href="/checkout" className="flex items-center justify-center gap-2">
//                         Proceed to Checkout <ArrowRight size={14} />
//                       </Link>
//                     </Button>

//                     <Button asChild variant="ghost" className="w-full text-xs text-muted-foreground hover:text-foreground">
//                       <Link href="/collections">← Continue Shopping</Link>
//                     </Button>
//                   </div>

//                 </div>
//               </div>
//             )}

//           </div>
//         </div>
//       </main>

//       {/* Mobile Sticky Bottom Action Bar */}
//       {cart && items.length > 0 && (
//         <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border p-4 shadow-2xl flex items-center justify-between gap-4">
//           <div>
//             <span className="text-[10px] uppercase text-muted-foreground block">Total</span>
//             <span className="font-serif text-lg font-medium text-gold">
//               {formatPrice(cart.total, activeCurrency)}
//             </span>
//           </div>
//           <div className="flex gap-2">
//             <Button onClick={shareToWhatsApp} variant="outline" size="sm" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
//               <MessageCircle size={16} />
//             </Button>
//             <Button asChild size="sm" className="bg-gold text-black hover:bg-gold/90 uppercase tracking-wider text-[10px] px-6">
//               <Link href="/checkout">Checkout</Link>
//             </Button>
//           </div>
//         </div>
//       )}

//       <SiteFooter />
//     </div>
//   )
// }



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
