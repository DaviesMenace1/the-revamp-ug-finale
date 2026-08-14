'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Star,
  Heart,
  ShoppingBag,
  Check,
  Ruler,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Truck,
  Sparkle
} from 'lucide-react'
import { useCart } from '@/lib/context/cart-context'

const DEFAULT_IMAGE = '/images/placeholder.jpg'

// Localized Currency Formatter (Default: UGX primary, USD secondary)
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
      color: selectedColor?.label || null,
      selectedColor,
      fabric: selectedFabric?.label || null,
      selectedFabric,
      image: selectedImage,
      customDimensions: customDimensionsToPass,
      product,
    }

    if (cart && typeof cart.addItem === 'function') {
      cart.addItem(itemToAdd, quantity, selectedColor, null, [], customDimensionsToPass)
    } else {
      const existing = JSON.parse(localStorage.getItem('cart') || '[]')
      existing.push(itemToAdd)
      localStorage.setItem('cart', JSON.stringify(existing))
    }

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
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
        <span className="text-[11px] uppercase tracking-widest font-semibold text-gold mb-2">
          {categoryName}
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-3 leading-tight">
          {product?.name || 'Untitled Piece'}
        </h1>

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

        {/* Price Display: UGX Primary, USD Secondary */}
        <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-border">
          <span className="text-2xl font-serif text-foreground font-medium">
            {formatUGX(totalPrice)}
          </span>
          <span className="text-xs text-muted-foreground">
            (≈ {formatUSD(totalPrice)})
          </span>
        </div>

        {/* "WHY WE LOVE THIS" Editorial Highlight */}
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

        {/* QUANTITY & ADD TO CART */}
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
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`p-3 border transition-colors ${
              isWishlisted
                ? 'border-red-500 text-red-500 bg-red-500/10'
                : 'border-border text-foreground hover:border-gold'
            }`}
          >
            <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
          </button>
        </div>

        {/* ACCORDION SPECIFICATIONS (MCGEE & CO STYLE) */}
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

// Append this to the bottom of components/collections/product-detail.tsx

export function ProductReviews({ product }: { product: any }) {
  const reviews = Array.isArray(product?.reviews) ? product.reviews : []
  const ratingCount = reviews.length || product?.ratingCount || 0
  const avgRating = typeof product?.rating === 'number' ? product.rating : parseFloat(product?.rating || '5.0')

  return (
    <div className="border-t border-border pt-12 mt-12">
      <h2 className="font-serif text-2xl font-light text-foreground mb-6">
        Customer Reviews & Feedback ({ratingCount})
      </h2>

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
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((rev: any, idx: number) => (
            <div key={rev?.id || idx} className="border-b border-border pb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs text-foreground">{rev?.authorName || 'Verified Buyer'}</span>
                  {rev?.verifiedPurchase && (
                    <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 border border-gold/20">
                      Verified Purchase
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {rev?.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}
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
              {rev?.title && <h4 className="text-xs font-semibold text-foreground mb-1">{rev.title}</h4>}
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











