'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Star, Heart, ShoppingBag, Truck, ShieldCheck, Check, Ruler, Sparkles } from 'lucide-react'
import { useCart } from '@/lib/context/cart-context'

const DEFAULT_IMAGE = 'https://therevampug.com/default-thumb.png'

const formatPrice = (price: string | number, currency = 'USD') => {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num || 0)
}

// -------------------------------------------------------------
// COMPONENT 1: PRODUCT DETAIL
// -------------------------------------------------------------
export function ProductDetail({ product }: { product: any }) {
  const cart = useCart() as any

  // Relational productImages fallback
  const productImages = Array.isArray(product?.productImages) ? product.productImages : []

  // Support both array of strings (product.images) or relation objects (product.productImages)
  const rawImages: string[] =
    Array.isArray(product?.images) && product.images.length > 0
      ? product.images.filter(Boolean)
      : productImages.length > 0
      ? productImages.map((img: any) => img?.url || img).filter(Boolean)
      : [DEFAULT_IMAGE]

  // ✅ FIXED TYPO: product.productVariants instead of product.productsVariants
  const variants = Array.isArray(product?.productVariants) ? product.productVariants : []
  const colors = variants.filter((v: any) => v?.type === 'COLOR')
  const fabrics = variants.filter((v: any) => v?.type === 'FABRIC')

  const rawDims = product?.dimensions || {}
  const initialWidth = typeof rawDims === 'object' ? (rawDims.width || '') : ''
  const initialHeight = typeof rawDims === 'object' ? (rawDims.height || '') : ''
  const initialDepth = typeof rawDims === 'object' ? (rawDims.depth || '') : ''

  const [selectedImage, setSelectedImage] = useState<string>(rawImages[0] || DEFAULT_IMAGE)
  const [selectedColor, setSelectedColor] = useState(colors[0] || null)
  const [selectedFabric, setSelectedFabric] = useState(fabrics[0] || null)
  const [quantity, setQuantity] = useState<number>(1)
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false)
  const [added, setAdded] = useState<boolean>(false)

  const [useCustomDims, setUseCustomDims] = useState<boolean>(false)
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight,
    depth: initialDepth,
  })

  const reviewsCount = Array.isArray(product?.reviews) ? product.reviews.length : (product?.ratingCount || 0)
  const rating = typeof product?.rating === 'number' ? product.rating : parseFloat(product?.rating || '0')

  const basePrice = parseFloat(product?.price || '0')
  const fabricDelta = selectedFabric ? parseFloat(selectedFabric.priceDelta || '0') : 0
  const totalPrice = (basePrice + fabricDelta) * quantity

  // Original / Compare-at Price Calculations
  const baseComparePrice = product?.compareAtPrice ? parseFloat(product.compareAtPrice) : product?.originalPrice ? parseFloat(product.originalPrice) : null
  const totalComparePrice = baseComparePrice ? (baseComparePrice + fabricDelta) * quantity : null

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
      price: basePrice + fabricDelta,
      quantity,
      color: selectedColor?.label || null,
      selectedColor,
      fabric: selectedFabric?.label || null,
      selectedFabric,
      selectedMaterial: selectedFabric,
      image: selectedImage,
      customDimensions: customDimensionsToPass,
      product: {
        ...product,
        salePrice: basePrice + fabricDelta,
        price: basePrice + fabricDelta,
        thumbnailImage: selectedImage,
      }
    }

    if (cart && typeof cart.addItem === 'function') {
      cart.addItem(itemToAdd, quantity, selectedColor, null, [], customDimensionsToPass)
    } else if (cart && typeof cart.addToCart === 'function') {
      cart.addToCart(product, quantity, selectedColor, null, [], customDimensionsToPass)
    } else {
      const existing = JSON.parse(localStorage.getItem('cart') || '[]')
      existing.push(itemToAdd)
      localStorage.setItem('cart', JSON.stringify(existing))
    }

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
      {/* LEFT: Image Gallery */}
      <div className="flex flex-col gap-4">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted border border-border">
          <Image
            src={selectedImage}
            alt={product?.name || 'Product Image'}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
        </div>

        {rawImages.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {rawImages.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`relative aspect-square w-20 flex-shrink-0 overflow-hidden border transition-all ${
                  selectedImage === img
                    ? 'border-gold'
                    : 'border-border/60 opacity-60 hover:opacity-100'
                }`}
              >
                <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Product Info */}
      <div className="flex flex-col">
        {product?.category && (
          <span className="text-xs uppercase tracking-widest font-semibold text-gold mb-2">
            {product.category}
          </span>
        )}

        <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-3">
          {product?.name || 'Untitled Product'}
        </h1>

        {/* Rating Overview */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center text-amber-500 gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={i < Math.floor(rating) ? 'fill-current' : 'text-muted'}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {rating.toFixed(1)} ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        {/* Price Display with Compare-At Price */}
        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-2xl font-medium text-foreground">
            {formatPrice(totalPrice, product?.currency || 'USD')}
          </span>

          {totalComparePrice && totalComparePrice > totalPrice && (
            <span className="text-sm text-muted-foreground line-through font-normal">
              {formatPrice(totalComparePrice, product?.currency || 'USD')}
            </span>
          )}

          {fabricDelta > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              (Includes +{formatPrice(fabricDelta)} for {selectedFabric?.label})
            </span>
          )}
        </div>

        {/* Description */}
        <div className="prose prose-sm text-muted-foreground mb-8">
          <p>{product?.description || product?.tagline || 'Crafted with premium materials and precision.'}</p>
        </div>

        {/* COLOR OPTION PICKER */}
        {colors.length > 0 && (
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wider font-medium text-foreground mb-3">
              Color Finish: <span className="text-gold font-semibold">{selectedColor?.label || 'Select'}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color: any, idx: number) => (
                <button
                  key={color?.id || idx}
                  onClick={() => handleColorSelect(color)}
                  className={`flex items-center gap-2 h-9 px-4 border text-xs font-medium transition-all ${
                    selectedColor?.id === color?.id
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-border text-foreground hover:border-muted-foreground'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20"
                    style={{ backgroundColor: color?.value || '#1C1C1C' }}
                  />
                  {color?.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MATERIAL / FABRIC OPTION PICKER */}
        {fabrics.length > 0 && (
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wider font-medium text-foreground mb-3">
              Material Option:{' '}
              <span className="text-gold font-semibold">{selectedFabric?.label || 'Standard'}</span>
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
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border text-foreground hover:border-muted-foreground'
                    }`}
                  >
                    {fabric?.label} {delta > 0 ? `(+${formatPrice(delta)})` : ''}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* CUSTOM DIMENSIONS SELECTOR */}
        <div className="mb-8 border border-border p-4 bg-muted/20 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-gold" />
              <span className="text-xs uppercase tracking-wider font-medium text-foreground">
                Sizing & Dimensions
              </span>
            </div>
            <button
              type="button"
              onClick={() => setUseCustomDims(!useCustomDims)}
              className="text-xs text-gold hover:underline flex items-center gap-1 font-medium"
            >
              {useCustomDims ? 'Use Standard Sizing' : '+ Tailor Custom Dimensions'}
            </button>
          </div>

          {useCustomDims ? (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                Specify exact dimensions in inches (″) for a bespoke fit:
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                    Width (″)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 64"
                    value={dimensions.width}
                    onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                    className="w-full p-2 text-xs border border-border bg-background text-foreground focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                    Height (″)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 32"
                    value={dimensions.height}
                    onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                    className="w-full p-2 text-xs border border-border bg-background text-foreground focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                    Depth (″)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 28"
                    value={dimensions.depth}
                    onChange={(e) => setDimensions({ ...dimensions, depth: e.target.value })}
                    className="w-full p-2 text-xs border border-border bg-background text-foreground focus:outline-none focus:border-gold"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Standard Specifications: </span>
              {typeof product?.dimensions === 'string'
                ? product.dimensions
                : product?.dimensions?.width
                ? `${product.dimensions.width}″W ${product.dimensions.height ? `× ${product.dimensions.height}″H` : ''} ${product.dimensions.depth ? `× ${product.dimensions.depth}″D` : ''}`
                : 'Standard Factory Dimensioning'}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <div className="flex items-center border border-border">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-foreground hover:bg-muted transition-colors"
            >
              -
            </button>
            <span className="px-4 py-2 text-sm font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3 py-2 text-foreground hover:bg-muted transition-colors"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex-1 bg-gold hover:bg-gold/90 text-obsidian font-medium py-3 px-6 transition-colors text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {added ? <Check size={16} /> : <ShoppingBag size={16} />}
            {added ? 'Added To Cart' : 'Add To Cart'}
          </button>

          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`p-3 border transition-colors ${
              isWishlisted ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-border text-foreground hover:border-gold'
            }`}
          >
            <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
          </button>
        </div>

        {/* Guarantees */}
        <div className="border-t border-border pt-6 space-y-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <Truck size={16} className="text-gold" />
            <span>Complimentary delivery on luxury collection orders.</span>
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

// -------------------------------------------------------------
// COMPONENT 2: PRODUCT REVIEWS
// -------------------------------------------------------------
export function ProductReviews({ product }: { product: any }) {
  const initialReviews = Array.isArray(product?.reviews) ? product.reviews : []
  const [reviews, setReviews] = useState<any[]>(initialReviews)

  const [author, setAuthor] = useState('')
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (Array.isArray(product?.reviews)) {
      setReviews(product.reviews)
    }
  }, [product])

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!author || !comment) {
      alert('Please fill out your name and review text.')
      return
    }

    setSubmitting(true)

    const newReview = {
      id: Date.now().toString(),
      productId: product?.id,
      author,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product?.id,
          author,
          rating,
          comment,
        }),
      })

      if (res.ok) {
        const responseData = await res.json()
        const savedReview = responseData.data || responseData.review || newReview
        setReviews((prev) => [savedReview, ...prev])
      } else {
        setReviews((prev) => [newReview, ...prev])
      }
    } catch (err) {
      setReviews((prev) => [newReview, ...prev])
    } finally {
      setSubmitting(false)
      setAuthor('')
      setComment('')
      setRating(5)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pt-10 border-t border-border">
      <div>
        <h3 className="font-serif text-2xl font-light mb-6">Customer Reviews</h3>

        <form onSubmit={handleReviewSubmit} className="border border-border p-6 bg-muted/20 space-y-4 mb-10">
          <h4 className="font-serif text-lg font-light">Write a Review</h4>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-foreground mb-1">
                Your Name *
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full p-2.5 border border-border text-xs bg-background focus:outline-none focus:border-gold"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-foreground mb-1">
                Rating Assessment ({rating} / 5 Stars) *
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Star
                      size={20}
                      className={
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-300'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-medium text-foreground mb-1">
              Your Review *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Share your experience regarding craftsmanship, texture, or quality..."
              className="w-full p-2.5 border border-border text-xs bg-background focus:outline-none focus:border-gold"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-gold text-obsidian px-6 py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-gold/90 transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>

        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet for this product. Be the first to leave a review!</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((rev: any, idx: number) => (
              <div key={rev?.id || idx} className="border-b border-border pb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-foreground">
                      {rev?.author || rev?.userName || 'Verified Customer'}
                    </span>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={i < (Number(rev?.rating) || 5) ? 'fill-current' : 'text-zinc-300'}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Verified Buyer
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {rev?.comment || rev?.text || rev?.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}










