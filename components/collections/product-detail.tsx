'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Star,
  Heart,
  ShoppingBag,
  Check,
  Ruler,
  ChevronDown,
  ShieldCheck,
  Truck,
  Sparkle,
  Share2,
  Copy,
  MessageCircle,
  X,
  Send
} from 'lucide-react'
import { useCart } from '@/lib/context/cart-context'
import { useRouter } from 'next/navigation' 

const DEFAULT_IMAGE = '/images/placeholder.jpg'
const WISHLIST_STORAGE_KEY = 'revamp:wishlist'

// Localized Currency Formatter
const formatUGX = (amount: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

const formatUSD = (amount: number, exchangeRate = 3700) => {
  const usdValue = (amount || 0) / exchangeRate
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(usdValue)
}

// Helper component for Accordions
function AccordionItem({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-border py-4">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex justify-between items-center text-left text-xs uppercase tracking-widest font-medium text-foreground hover:text-gold transition-colors"
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-gold' : 'text-muted-foreground'
          }`}
        />
      </button>
      {isOpen && <div className="mt-4 text-xs text-muted-foreground space-y-2 leading-relaxed">{children}</div>}
    </div>
  )
}

export function ProductDetail({ product }: { product: any }) {
  const cart = useCart() as any

  // Relational productImages fallback
  const productImages = Array.isArray(product?.productImages) ? product.productImages : []

  // Images resolution
  const rawImages: string[] =
    Array.isArray(product?.images) && product.images.length > 0
      ? product.images.filter(Boolean)
      : productImages.length > 0
      ? productImages.map((img: any) => img?.url || img).filter(Boolean)
      : [DEFAULT_IMAGE]

  // Variants extraction
  const variants = Array.isArray(product?.productVariants) ? product.productVariants : []
  const colors = variants.filter((v: any) => v?.type === 'COLOR')
  const fabrics = variants.filter((v: any) => v?.type === 'FABRIC')

  const rawDims = product?.dimensions || {}
  const initialWidth = typeof rawDims === 'object' ? rawDims.width || '' : ''
  const initialHeight = typeof rawDims === 'object' ? rawDims.height || '' : ''
  const initialDepth = typeof rawDims === 'object' ? rawDims.depth || '' : ''

  const [selectedImage, setSelectedImage] = useState<string>(rawImages[0] || DEFAULT_IMAGE)
  const [selectedColor, setSelectedColor] = useState(colors[0] || null)
  const [selectedFabric, setSelectedFabric] = useState(fabrics[0] || null)
  const [quantity, setQuantity] = useState<number>(1)
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false)
  const [added, setAdded] = useState<boolean>(false)

  // Share Modal State
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Accordion State Management
  const [openAccordion, setOpenAccordion] = useState<string | null>('specs')

  const toggleAccordion = (section: string) => {
    setOpenAccordion(openAccordion === section ? null : section)
  }

  // Bespoke Dimensions State
  const [useCustomDims, setUseCustomDims] = useState<boolean>(false)
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight,
    depth: initialDepth,
  })

  // Synchronize Wishlist with localStorage
  useEffect(() => {
    if (!product?.id) return
    try {
      const stored = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]')
      setIsWishlisted(stored.includes(product.id))
    } catch {
      setIsWishlisted(false)
    }
  }, [product?.id])

  const toggleWishlist = () => {
    if (!product?.id) return
    try {
      const stored: string[] = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]')
      let updated: string[]
      if (stored.includes(product.id)) {
        updated = stored.filter((id) => id !== product.id)
        setIsWishlisted(false)
      } else {
        updated = [...stored, product.id]
        setIsWishlisted(true)
      }
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('revamp:wishlist-change'))
    } catch (error) {
      console.error('Failed to update wishlist:', error)
    }
  }

  const reviewsCount = Array.isArray(product?.reviews) ? product.reviews.length : product?.ratingCount || 0
  const rating = typeof product?.rating === 'number' ? product.rating : parseFloat(product?.rating || '5.0')

  // Pricing (UGX)
  const basePrice = parseFloat(product?.price || '0')
  const fabricDelta = selectedFabric ? parseFloat(selectedFabric.priceDelta || '0') : 0
  const unitPrice = basePrice + fabricDelta
  const totalPrice = unitPrice * quantity

  const handleColorSelect = (color: any) => {
    setSelectedColor(color)
    const matchingImage = productImages.find((img: any) => img?.colorId === color?.id)
    if (matchingImage?.url) {
      setSelectedImage(matchingImage.url)
    }
  }

  const handleAddToCart = () => {
    const customDimensionsToPass = useCustomDims
      ? {
          width: dimensions.width ? parseFloat(String(dimensions.width)) : undefined,
          height: dimensions.height ? parseFloat(String(dimensions.height)) : undefined,
          depth: dimensions.depth ? parseFloat(String(dimensions.depth)) : undefined,
        }
      : undefined

    const itemToAdd = {
      id: product?.id,
      productId: product?.id,
      name: product?.name,
      slug: product?.slug,
      price: unitPrice,
      quantity,
      selectedColor,
      selectedFabric,
      color: selectedColor?.label || null,
      fabric: selectedFabric?.label || null,
      image: selectedImage,
      customDimensions: customDimensionsToPass,
      product,
    }

    if (cart) {
      if (typeof cart.addToCart === 'function') {
        cart.addToCart(itemToAdd, quantity)
      } else if (typeof cart.addItem === 'function') {
        cart.addItem(itemToAdd, quantity, selectedColor, selectedFabric, [], customDimensionsToPass)
      }
    } else {
      const existing = JSON.parse(localStorage.getItem('cart') || '[]')
      existing.push(itemToAdd)
      localStorage.setItem('cart', JSON.stringify(existing))
    }

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareToSocial = (platform: 'whatsapp' | 'twitter' | 'facebook') => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`Check out "${product?.name}" on The Revamp UG:`)

    let shareUrl = ''
    if (platform === 'whatsapp') {
      shareUrl = `https://wa.me/?text=${text}%20${url}`
    } else if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
    }

    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }

  const categoryName = product?.category?.name || product?.category || 'Luxury Collection'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
      {/* LEFT: GALLERY (7 columns) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted border border-border">
          <Image
            src={selectedImage}
            alt={product?.name || 'Product Image'}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover object-center transition-all duration-300"
          />
        </div>

        {rawImages.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {rawImages.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`relative aspect-square w-20 flex-shrink-0 overflow-hidden border transition-all ${
                  selectedImage === img
                    ? 'border-gold ring-1 ring-gold'
                    : 'border-border/60 opacity-60 hover:opacity-100'
                }`}
              >
                <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: BUY BOX & SPECS (5 columns) */}
      <div className="lg:col-span-5 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[11px] uppercase tracking-widest font-semibold text-gold">
            {categoryName}
          </span>
          {/* Share Button Trigger */}
          <button
            onClick={() => setIsShareOpen(!isShareOpen)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            title="Share Product"
          >
            <Share2 size={14} />
            <span className="uppercase text-[10px] tracking-wider font-medium">Share</span>
          </button>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-3 leading-tight">
          {product?.name || 'Untitled Piece'}
        </h1>

        {/* Share Popover Drawer */}
        {isShareOpen && (
          <div className="mb-6 p-4 border border-border bg-card rounded shadow-lg space-y-3 relative animate-in fade-in slide-in-from-top-2">
            <button
              onClick={() => setIsShareOpen(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
            <p className="text-xs font-medium uppercase tracking-wider text-foreground">Share this piece</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => shareToSocial('whatsapp')}
                className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-600 px-3 py-1.5 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                <MessageCircle size={14} /> WhatsApp
              </button>
              <button
                onClick={() => shareToSocial('twitter')}
                className="flex items-center gap-1.5 text-xs bg-sky-500/10 text-sky-600 px-3 py-1.5 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
              >
                X / Twitter
              </button>
              <button
                onClick={() => shareToSocial('facebook')}
                className="flex items-center gap-1.5 text-xs bg-blue-500/10 text-blue-600 px-3 py-1.5 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
              >
                Facebook
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-xs bg-muted text-foreground px-3 py-1.5 border border-border hover:bg-muted/80 transition-colors"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied ? 'Copied Link' : 'Copy Link'}
              </button>
            </div>
          </div>
        )}

        {/* Rating Overview */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center text-amber-500 gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < Math.floor(rating) ? 'fill-current text-amber-500' : 'text-muted'}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {rating.toFixed(1)} ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        {/* Price Display */}
        <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-border">
          <span className="text-2xl font-serif text-foreground font-medium">
            {formatUGX(totalPrice)}
          </span>
          <span className="text-xs text-muted-foreground">
            (≈ {formatUSD(totalPrice)})
          </span>
        </div>

        {/* Editorial Highlight */}
        {product?.editorialHighlight && (
          <div className="mb-6 p-4 border border-gold/30 bg-gold/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-serif text-gold font-medium">
              <Sparkle className="w-3.5 h-3.5" />
              <span>Why We Love This Piece</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              "{product.editorialHighlight}"
            </p>
          </div>
        )}

        {/* COLOR SWATCH PICKER */}
        {colors.length > 0 && (
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-widest font-medium text-foreground mb-3">
              Color Finish: <span className="text-gold">{selectedColor?.label || 'Select'}</span>
            </label>
            <div className="flex flex-wrap gap-2.5">
              {colors.map((color: any, idx: number) => (
                <button
                  key={color?.id || idx}
                  onClick={() => handleColorSelect(color)}
                  className={`flex items-center gap-2 h-10 px-3 border text-xs font-medium transition-all ${
                    selectedColor?.id === color?.id
                      ? 'border-gold bg-gold/10 text-foreground ring-1 ring-gold'
                      : 'border-border text-muted-foreground hover:border-foreground'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/20"
                    style={{ backgroundColor: color?.value || '#1C1C1C' }}
                  />
                  {color?.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FABRIC / MATERIAL SWATCH PICKER */}
        {fabrics.length > 0 && (
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-widest font-medium text-foreground mb-3">
              Material / Upholstery:{' '}
              <span className="text-gold">{selectedFabric?.label || 'Standard'}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {fabrics.map((fabric: any, idx: number) => {
                const delta = parseFloat(fabric?.priceDelta || '0')
                return (
                  <button
                    key={fabric?.id || idx}
                    onClick={() => setSelectedFabric(fabric)}
                    className={`h-9 px-4 border text-xs font-medium transition-all ${
                      selectedFabric?.id === fabric?.id
                        ? 'border-gold bg-gold/10 text-foreground ring-1 ring-gold'
                        : 'border-border text-muted-foreground hover:border-foreground'
                    }`}
                  >
                    {fabric?.label} {delta > 0 ? `(+${formatUGX(delta)})` : ''}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* BESPOKE TAILORING DRAWER */}
        <div className="mb-8 border border-border p-4 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-gold" />
              <span className="text-xs uppercase tracking-wider font-medium text-foreground">
                Custom Tailoring
              </span>
            </div>
            <button
              type="button"
              onClick={() => setUseCustomDims(!useCustomDims)}
              className="text-xs text-gold hover:underline flex items-center gap-1 font-medium"
            >
              {useCustomDims ? 'Use Standard Dimensions' : '+ Request Bespoke Sizing'}
            </button>
          </div>

          {useCustomDims ? (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <p className="text-[11px] text-muted-foreground">
                Specify exact dimensions in inches for our East Africa artisan workshop:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">
                    Width (in)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 64"
                    value={dimensions.width}
                    onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                    className="w-full p-2 text-xs border border-border bg-background focus:border-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">
                    Height (in)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 32"
                    value={dimensions.height}
                    onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                    className="w-full p-2 text-xs border border-border bg-background focus:border-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">
                    Depth (in)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 28"
                    value={dimensions.depth}
                    onChange={(e) => setDimensions({ ...dimensions, depth: e.target.value })}
                    className="w-full p-2 text-xs border border-border bg-background focus:border-gold outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Standard specifications applied.
            </div>
          )}
        </div>

        {/* QUANTITY, ADD TO CART & WISHLIST */}
        <div className="flex gap-4 mb-8">
          <div className="flex items-center border border-border">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-foreground hover:bg-muted transition-colors"
            >
              -
            </button>
            <span className="px-4 py-2 text-xs font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3 py-2 text-foreground hover:bg-muted transition-colors"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex-1 bg-gold hover:bg-gold/90 text-black font-semibold py-3 px-6 transition-colors text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {added ? <Check size={16} /> : <ShoppingBag size={16} />}
            {added ? 'Added To Selection' : 'Add To Cart'}
          </button>

          <button
            onClick={toggleWishlist}
            className={`p-3 border transition-colors ${
              isWishlisted
                ? 'border-red-500 text-red-500 bg-red-500/10'
                : 'border-border text-foreground hover:border-gold'
            }`}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart size={18} className={isWishlisted ? 'fill-current text-red-500' : ''} />
          </button>
        </div>

        {/* ACCORDIONS */}
        <div className="border-t border-border mt-2">
          <AccordionItem
            title="Overview & Description"
            isOpen={openAccordion === 'description'}
            onToggle={() => toggleAccordion('description')}
          >
            <p>{product?.description || 'Crafted with premium materials and engineered for refined living.'}</p>
          </AccordionItem>

          <AccordionItem
            title="Dimensions & Specifications"
            isOpen={openAccordion === 'specs'}
            onToggle={() => toggleAccordion('specs')}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-border/60 p-2.5">
                <span className="block text-[10px] uppercase text-muted-foreground">Overall Width</span>
                <span className="font-medium text-foreground">{rawDims?.width || '32'} in</span>
              </div>
              <div className="border border-border/60 p-2.5">
                <span className="block text-[10px] uppercase text-muted-foreground">Overall Height</span>
                <span className="font-medium text-foreground">{rawDims?.height || '34'} in</span>
              </div>
              <div className="border border-border/60 p-2.5">
                <span className="block text-[10px] uppercase text-muted-foreground">Depth</span>
                <span className="font-medium text-foreground">{rawDims?.depth || '30'} in</span>
              </div>
              <div className="border border-border/60 p-2.5">
                <span className="block text-[10px] uppercase text-muted-foreground">Seat Height</span>
                <span className="font-medium text-foreground">{rawDims?.seatHeight || '18'} in</span>
              </div>
            </div>
          </AccordionItem>

          <AccordionItem
            title="Materials & Craftsmanship"
            isOpen={openAccordion === 'materials'}
            onToggle={() => toggleAccordion('materials')}
          >
            <p>
              {product?.material ||
                'Solid hardwood frame sourced sustainably, upholstered in top-tier performance fabric designed for longevity.'}
            </p>
          </AccordionItem>

          <AccordionItem
            title="Care & Maintenance"
            isOpen={openAccordion === 'care'}
            onToggle={() => toggleAccordion('care')}
          >
            <p>
              Wipe clean with a soft, dry cloth. Avoid abrasive cleaners or direct harsh sunlight to maintain original luster.
            </p>
          </AccordionItem>
        </div>

        {/* Trust Badges */}
        <div className="border-t border-border pt-6 mt-6 space-y-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <Truck size={16} className="text-gold" />
            <span>Complimentary white-glove assembly on luxury orders.</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={16} className="text-gold" />
            <span>Authenticity guarantee & 2-year warranty included.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// PRODUCT REVIEWS WITH INTERACTIVE FORM
export function ProductReviews({ product }: { product: any }) {
  const [reviewsList, setReviewsList] = useState<any[]>(
    Array.isArray(product?.reviews) ? product.reviews : product?.productReviews || []
  )
  const [showForm, setShowForm] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const ratingCount = reviewsList.length
  const avgRating = typeof product?.rating === 'number' ? product.rating : parseFloat(product?.rating || '5.0')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment || !authorName) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/products/${product.slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          authorName,
          rating,
          comment,
        }),
      })

      if (res.ok) {
        const newRev = await res.json()
        setReviewsList([newRev.data || { authorName, rating, comment, createdAt: new Date() }, ...reviewsList])
        setComment('')
        setAuthorName('')
        setShowForm(false)
        
        // ✅ Refresh Server Components data
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to post review:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="border-t border-border pt-12 mt-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="font-serif text-2xl font-light text-foreground">
          Customer Reviews ({ratingCount})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gold hover:bg-gold/90 text-black text-xs uppercase tracking-widest font-semibold px-4 py-2 transition-colors flex items-center gap-1.5"
        >
          {showForm ? 'Cancel' : 'Write a Review'}
        </button>
      </div>

      {/* Review Submission Form Drawer */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-card border border-border space-y-4 rounded">
          <h3 className="font-serif text-lg text-foreground">Share your feedback</h3>
          
          <div>
            <label className="block text-xs uppercase text-muted-foreground mb-1">Rating</label>
            <div className="flex gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star size={20} className={star <= rating ? 'fill-current text-amber-500' : 'text-muted'} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-muted-foreground mb-1">Your Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Sarah K."
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full p-2.5 text-xs bg-background border border-border focus:border-gold outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-muted-foreground mb-1">Your Review</label>
            <textarea
              required
              rows={3}
              placeholder="Describe your experience with this piece..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2.5 text-xs bg-background border border-border focus:border-gold outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-foreground text-background hover:bg-foreground/90 font-medium text-xs px-6 py-2.5 uppercase tracking-wider flex items-center gap-2"
          >
            <Send size={14} />
            {isSubmitting ? 'Submitting...' : 'Post Review'}
          </button>
        </form>
      )}

      {/* Summary Header */}
      <div className="flex items-center gap-4 mb-8 bg-muted/20 p-6 border border-border">
        <div className="text-4xl font-serif font-medium text-foreground">
          {avgRating.toFixed(1)}
        </div>
        <div>
          <div className="flex items-center text-amber-500 gap-0.5 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={i < Math.floor(avgRating) ? 'fill-current text-amber-500' : 'text-muted'}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Based on {ratingCount} verified review{ratingCount === 1 ? '' : 's'}</p>
        </div>
      </div>

      {/* Reviews List */}
      {reviewsList.length > 0 ? (
        <div className="space-y-6">
          {reviewsList.map((rev: any, idx: number) => (
            <div key={rev?.id || idx} className="border-b border-border pb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs text-foreground">{rev?.authorName || 'Verified Buyer'}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {rev?.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recently'}
                </span>
              </div>
              <div className="flex items-center text-amber-500 gap-0.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < (rev?.rating || 5) ? 'fill-current text-amber-500' : 'text-muted'}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{rev?.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">No customer reviews yet for this product.</p>
      )}
    </div>
  )
}
