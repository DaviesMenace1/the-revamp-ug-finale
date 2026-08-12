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
// COMPONENT 1: PRODUCT DETAIL (Updated with Crossed-Out Original Price)
// -------------------------------------------------------------
export function ProductDetail({ product }: { product: any }) {
  const cart = useCart() as any

  const rawImages: string[] = Array.isArray(product?.images) && product.images.length > 0
    ? product.images.filter(Boolean)
    : [DEFAULT_IMAGE]

  const variants = Array.isArray(product?.variants) ? product.variants : []
  const colors = variants.filter((v: any) => v?.type === 'COLOR')
  const fabrics = variants.filter((v: any) => v?.type === 'FABRIC')
  const productImages = Array.isArray(product?.productImages) ? product.productImages : []

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
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
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









// 'use client'

// import { useEffect, useMemo, useState } from 'react'
// import { Heart, Share2, Star, Check, ShoppingBag } from 'lucide-react'
// import { cn } from '@/lib/utils'
// import { Button } from '@/components/ui/button'
// import { WishlistButton } from '@/components/collections/wishlist-button'
// import { useCart } from '@/lib/context/cart-context'
// import { formatPrice, type Product, type ProductReview } from '@/lib/data/products'

// export function ProductDetail({ product }: { product: Product }) {
//   const [activeImage, setActiveImage] = useState(0)
//   const [color, setColor] = useState(product.colors[0]?.label ?? '')
//   const [fabric, setFabric] = useState(product.fabrics[0]?.label ?? '')
//   const [addons, setAddons] = useState<string[]>([])
//   const [quantity, setQuantity] = useState(1)
//   const [added, setAdded] = useState(false)
//   const { addToCart } = useCart()

//   const total = useMemo(() => {
//     let sum = product.price
//     const fab = product.fabrics.find((f) => f.label === fabric)
//     if (fab?.priceDelta) sum += fab.priceDelta
//     for (const a of addons) {
//       const addon = product.addons.find((x) => x.label === a)
//       if (addon?.priceDelta) sum += addon.priceDelta
//     }
//     return sum
//   }, [product, fabric, addons])

//   const toggleAddon = (label: string) =>
//     setAddons((prev) => (prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]))

//   return (
//     <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
//       {/* Gallery */}
//       <div className="space-y-4">
//         <div className="relative aspect-[4/5] overflow-hidden bg-muted">
//           <div
//             className="absolute inset-0 bg-cover bg-center"
//             style={{ backgroundImage: `url('${product.images[activeImage]}')` }}
//             role="img"
//             aria-label={`${product.name} — view ${activeImage + 1}`}
//           />
//         </div>
//         {product.images.length > 1 && (
//           <div className="grid grid-cols-4 gap-3">
//             {product.images.map((img, i) => (
//               <button
//                 key={img}
//                 onClick={() => setActiveImage(i)}
//                 aria-label={`View image ${i + 1}`}
//                 className={cn(
//                   'relative aspect-square overflow-hidden bg-muted transition-opacity',
//                   activeImage === i ? 'ring-2 ring-gold' : 'opacity-70 hover:opacity-100',
//                 )}
//               >
//                 <div
//                   className="absolute inset-0 bg-cover bg-center"
//                   style={{ backgroundImage: `url('${img}')` }}
//                 />
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Info & options */}
//       <div>
//         <div className="flex items-center gap-3 mb-4">
//           <span className="font-sans text-xs tracking-widest uppercase text-gold">{product.itemType}</span>
//           <span className="w-px h-3 bg-border" />
//           <span className="font-sans text-xs tracking-widest uppercase text-muted-foreground">
//             {product.space}
//           </span>
//         </div>

//         <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground leading-tight mb-3">
//           {product.name}
//         </h1>

//         {/* Rating */}
//         <div className="flex items-center gap-2 mb-6">
//           <Stars value={product.rating} />
//           <span className="font-sans text-sm text-muted-foreground">
//             {product.rating.toFixed(1)} ({product.reviewCount} reviews)
//           </span>
//         </div>

//         <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8">
//           {product.description}
//         </p>

//         <div className="font-serif text-3xl font-light text-foreground mb-8">
//           {formatPrice(total, product.currency)}
//         </div>

//         {/* Color */}
//         {product.colors.length > 0 && (
//           <OptionBlock label="Colour" value={color}>
//             <div className="flex flex-wrap gap-3">
//               {product.colors.map((c) => (
//                 <button
//                   key={c.label}
//                   onClick={() => setColor(c.label)}
//                   aria-label={c.label}
//                   aria-pressed={color === c.label}
//                   title={c.label}
//                   className={cn(
//                     'size-9 rounded-full border transition-transform',
//                     color === c.label ? 'ring-2 ring-gold ring-offset-2 ring-offset-background' : 'border-border',
//                   )}
//                   style={{ backgroundColor: c.value }}
//                 />
//               ))}
//             </div>
//           </OptionBlock>
//         )}

//         {/* Fabric */}
//         {product.fabrics.length > 0 && (
//           <OptionBlock label="Fabric" value={fabric}>
//             <div className="flex flex-wrap gap-2">
//               {product.fabrics.map((f) => (
//                 <button
//                   key={f.label}
//                   onClick={() => setFabric(f.label)}
//                   aria-pressed={fabric === f.label}
//                   className={cn(
//                     'font-sans text-sm px-4 py-2 border transition-colors',
//                     fabric === f.label
//                       ? 'border-gold text-gold'
//                       : 'border-border text-foreground/70 hover:border-foreground',
//                   )}
//                 >
//                   {f.label}
//                   {f.priceDelta ? ` +${formatPrice(f.priceDelta, product.currency)}` : ''}
//                 </button>
//               ))}
//             </div>
//           </OptionBlock>
//         )}

//         {/* Add-ons */}
//         {product.addons.length > 0 && (
//           <OptionBlock label="Add-ons">
//             <div className="flex flex-col gap-2">
//               {product.addons.map((a) => {
//                 const checked = addons.includes(a.label)
//                 return (
//                   <button
//                     key={a.label}
//                     onClick={() => toggleAddon(a.label)}
//                     aria-pressed={checked}
//                     className={cn(
//                       'flex items-center justify-between gap-3 font-sans text-sm px-4 py-3 border text-left transition-colors',
//                       checked ? 'border-gold' : 'border-border hover:border-foreground/40',
//                     )}
//                   >
//                     <span className="flex items-center gap-3">
//                       <span
//                         className={cn(
//                           'size-4 border flex items-center justify-center',
//                           checked ? 'bg-gold border-gold' : 'border-muted-foreground/40',
//                         )}
//                       >
//                         {checked && <Check size={12} className="text-obsidian" />}
//                       </span>
//                       {a.label}
//                     </span>
//                     {a.priceDelta ? (
//                       <span className="text-muted-foreground">
//                         +{formatPrice(a.priceDelta, product.currency)}
//                       </span>
//                     ) : null}
//                   </button>
//                 )
//               })}
//             </div>
//           </OptionBlock>
//         )}

//         {/* Actions */}
//         <div className="flex flex-col gap-3 mt-10">
//           <div className="flex items-center justify-between border border-border px-4 py-2">
//             <span className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Quantity</span>
//             <div className="flex items-center gap-4">
//               <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">−</button>
//               <span className="min-w-4 text-center font-sans text-sm">{quantity}</span>
//               <button type="button" onClick={() => setQuantity((value) => Math.min(99, value + 1))} aria-label="Increase quantity">+</button>
//             </div>
//           </div>
//           <Button
//             size="lg"
//             onClick={() => {
//               addToCart(product, quantity, product.colors.find((item) => item.label === color), product.fabrics.find((item) => item.label === fabric), product.addons.filter((item) => addons.includes(item.label)))
//               setAdded(true)
//               window.setTimeout(() => setAdded(false), 2200)
//             }}
//             className="w-full rounded-none bg-foreground text-background hover:bg-gold hover:text-obsidian font-sans text-xs tracking-widest uppercase py-6"
//           >
//             <ShoppingBag size={15} className="mr-2" />
//             {added ? 'Added to Cart' : `Add to Cart — ${formatPrice(total * quantity, product.currency)}`}
//           </Button>
//           <div className="grid grid-cols-2 gap-3">
//             <WishlistButton productId={product.id} />
//             <ShareButtons productName={product.name} />
//           </div>
//           <LikeButton productId={product.id} />
//         </div>
//       </div>
//     </div>
//   )
// }

// function OptionBlock({
//   label,
//   value,
//   children,
// }: {
//   label: string
//   value?: string
//   children: React.ReactNode
// }) {
//   return (
//     <div className="mb-6">
//       <div className="flex items-center gap-2 mb-3">
//         <span className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">{label}</span>
//         {value && <span className="font-sans text-sm text-foreground">— {value}</span>}
//       </div>
//       {children}
//     </div>
//   )
// }

// function Stars({ value }: { value: number }) {
//   return (
//     <div className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
//       {[1, 2, 3, 4, 5].map((n) => (
//         <Star
//           key={n}
//           size={15}
//           className={cn(n <= Math.round(value) ? 'fill-gold text-gold' : 'text-muted-foreground/40')}
//         />
//       ))}
//     </div>
//   )
// }

// function LikeButton({ productId }: { productId: string }) {
//   const storageKey = `revamp:like:${productId}`
//   const [liked, setLiked] = useState(false)
//   const [count, setCount] = useState(0)

//   useEffect(() => {
//     const seed = productId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
//     setCount(40 + (seed % 120))
//     setLiked(window.localStorage.getItem(storageKey) === 'true')
//   }, [productId, storageKey])

//   return (
//     <button
//       onClick={() => {
//         const nextLiked = !liked
//         setLiked(nextLiked)
//         window.localStorage.setItem(storageKey, String(nextLiked))
//         setCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)))
//       }}
//       aria-pressed={liked}
//       className={cn(
//         'flex items-center justify-center gap-2 w-full py-3 border font-sans text-xs tracking-widest uppercase transition-colors',
//         liked ? 'border-gold text-gold' : 'border-border text-foreground/70 hover:border-foreground',
//       )}
//     >
//       <Heart size={15} className={cn(liked && 'fill-gold text-gold')} />
//       {liked ? 'Liked' : 'Like'} · {count}
//     </button>
//   )
// }

// function ShareButtons({ productName }: { productName: string }) {
//   const [copied, setCopied] = useState(false)

//   const share = async () => {
//     const url = typeof window !== 'undefined' ? window.location.href : ''
//     if (navigator.share) {
//       try {
//         await navigator.share({ title: productName, url })
//         return
//       } catch {
//         /* user cancelled — fall through to copy */
//       }
//     }
//     try {
//       await navigator.clipboard.writeText(url)
//       setCopied(true)
//       setTimeout(() => setCopied(false), 2000)
//     } catch {
//       /* clipboard unavailable */
//     }
//   }

//   return (
//     <Button
//       onClick={share}
//       variant="outline"
//       size="lg"
//       className="w-full rounded-none border-foreground/20 font-sans text-xs tracking-widest uppercase py-6 hover:border-gold hover:text-gold"
//     >
//       <Share2 size={15} className="mr-2" />
//       {copied ? 'Link Copied' : 'Share'}
//     </Button>
//   )
// }

// export function ProductReviews({ product }: { product: Product }) {
//   const [reviews, setReviews] = useState<ProductReview[]>(product.reviews)
//   const [rating, setRating] = useState(5)
//   const [author, setAuthor] = useState('')
//   const [title, setTitle] = useState('')
//   const [body, setBody] = useState('')
//   const [submitted, setSubmitted] = useState(false)

//   const submit = (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!author.trim() || !body.trim()) return
//     const review: ProductReview = {
//       id: `local-${Date.now()}`,
//       author: author.trim(),
//       rating,
//       date: new Date().toISOString().slice(0, 10),
//       title: title.trim() || 'Review',
//       body: body.trim(),
//     }
//     setReviews((prev) => [review, ...prev])
//     setAuthor('')
//     setTitle('')
//     setBody('')
//     setRating(5)
//     setSubmitted(true)
//     setTimeout(() => setSubmitted(false), 3000)
//   }

//   return (
//     <div className="grid lg:grid-cols-[1fr_380px] gap-12">
//       {/* Review list */}
//       <div>
//         <h2 className="font-serif text-3xl font-light text-foreground mb-8">
//           Reviews ({reviews.length})
//         </h2>
//         <div className="flex flex-col gap-8">
//           {reviews.map((r) => (
//             <div key={r.id} className="border-b border-border pb-8">
//               <div className="flex items-center justify-between mb-2">
//                 <span className="font-sans text-sm font-medium text-foreground">{r.author}</span>
//                 <span className="font-sans text-xs text-muted-foreground">{r.date}</span>
//               </div>
//               <Stars value={r.rating} />
//               <h3 className="font-serif text-lg font-light text-foreground mt-3 mb-1">{r.title}</h3>
//               <p className="font-sans text-sm text-muted-foreground leading-relaxed">{r.body}</p>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Review form */}
//       <div className="bg-muted/30 p-6 h-fit">
//         <h3 className="font-serif text-2xl font-light text-foreground mb-6">Leave a Review</h3>
//         <form onSubmit={submit} className="flex flex-col gap-4">
//           <div>
//             <span className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground block mb-2">
//               Your Rating
//             </span>
//             <div className="flex items-center gap-1">
//               {[1, 2, 3, 4, 5].map((n) => (
//                 <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
//                   <Star
//                     size={22}
//                     className={cn(n <= rating ? 'fill-gold text-gold' : 'text-muted-foreground/40')}
//                   />
//                 </button>
//               ))}
//             </div>
//           </div>
//           <input
//             value={author}
//             onChange={(e) => setAuthor(e.target.value)}
//             placeholder="Your name"
//             required
//             className="bg-background border border-border px-4 py-3 font-sans text-sm rounded-none focus:outline-none focus:border-gold"
//           />
//           <input
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             placeholder="Review title"
//             className="bg-background border border-border px-4 py-3 font-sans text-sm rounded-none focus:outline-none focus:border-gold"
//           />
//           <textarea
//             value={body}
//             onChange={(e) => setBody(e.target.value)}
//             placeholder="Share your experience with this piece..."
//             required
//             rows={4}
//             className="bg-background border border-border px-4 py-3 font-sans text-sm rounded-none resize-none focus:outline-none focus:border-gold"
//           />
//           <Button
//             type="submit"
//             className="w-full rounded-none bg-foreground text-background hover:bg-gold hover:text-obsidian font-sans text-xs tracking-widest uppercase py-6"
//           >
//             Submit Review
//           </Button>
//           {submitted && (
//             <p className="font-sans text-sm text-gold text-center">Thank you — your review was added.</p>
//           )}
//         </form>
//       </div>
//     </div>
//   )
// }
