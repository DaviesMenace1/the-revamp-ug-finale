'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Star, Heart, ShoppingBag, Truck, ShieldCheck, Loader2, Sparkles } from 'lucide-react'

const DEFAULT_IMAGE = 'https://therevampug.com/default-thumb.png'

const formatPrice = (price: string | number, currency = 'USD') => {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num || 0)
}

export function ProductDetail({ product }: { product: any }) {
  // Extract images safely
  const rawImages: string[] = Array.isArray(product?.images) && product.images.length > 0
    ? product.images.filter(Boolean)
    : [DEFAULT_IMAGE]

  // Safe extraction of variants
  const variants = Array.isArray(product?.variants) ? product.variants : []
  const colors = variants.filter((v: any) => v?.type === 'COLOR')
  const fabrics = variants.filter((v: any) => v?.type === 'FABRIC')
  const productImages = Array.isArray(product?.productImages) ? product.productImages : []

  // Component state
  const [selectedImage, setSelectedImage] = useState<string>(rawImages[0] || DEFAULT_IMAGE)
  const [selectedColor, setSelectedColor] = useState(colors[0] || null)
  const [selectedFabric, setSelectedFabric] = useState(fabrics[0] || null)
  const [quantity, setQuantity] = useState<number>(1)
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false)
  const [addingToCart, setAddingToCart] = useState<boolean>(false)

  // Safe Rating Extraction
  const rawRating = typeof product?.rating === 'number'
    ? product.rating
    : parseFloat(product?.rating || '0')
  const rating = Number.isNaN(rawRating) ? 0 : rawRating

  const rawRatingCount = typeof product?.ratingCount === 'number'
    ? product.ratingCount
    : parseInt(product?.ratingCount || '0', 10)
  const ratingCount = Number.isNaN(rawRatingCount) ? 0 : rawRatingCount

  // Dynamic Price Calculation (Base Price + Fabric Delta)
  const basePrice = parseFloat(product?.price || '0')
  const fabricDelta = selectedFabric ? parseFloat(selectedFabric.priceDelta || '0') : 0
  const totalPrice = (basePrice + fabricDelta) * quantity

  // Switch image based on color selection
  const handleColorSelect = (color: any) => {
    setSelectedColor(color)
    const matchingImage = productImages.find((img: any) => img?.colorId === color?.id)
    if (matchingImage?.url) {
      setSelectedImage(matchingImage.url)
    }
  }

  // Add to Cart handler
  const handleAddToCart = () => {
    setAddingToCart(true)

    const cartItem = {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: basePrice + fabricDelta,
      quantity,
      color: selectedColor?.label || null,
      fabric: selectedFabric?.label || null,
      image: selectedImage,
    }

    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
    existingCart.push(cartItem)
    localStorage.setItem('cart', JSON.stringify(existingCart))

    setTimeout(() => {
      setAddingToCart(false)
      alert(`Added ${quantity} x "${product.name}" to cart.`)
    }, 400)
  }

  // Wishlist handler
  const toggleWishlist = () => {
    const existingWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    if (isWishlisted) {
      const updated = existingWishlist.filter((item: any) => item.id !== product.id)
      localStorage.setItem('wishlist', JSON.stringify(updated))
      setIsWishlisted(false)
    } else {
      existingWishlist.push({ id: product.id, name: product.name, slug: product.slug, image: selectedImage })
      localStorage.setItem('wishlist', JSON.stringify(existingWishlist))
      setIsWishlisted(true)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
      {/* LEFT: Image Gallery */}
      <div className="flex flex-col gap-4">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted border border-border/40 shadow-2xl rounded-sm group">
          <Image
            src={selectedImage}
            alt={product?.name || 'Product Image'}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1 border border-amber-500/30 text-[10px] tracking-widest uppercase font-mono text-gold flex items-center gap-1.5 shadow-lg">
            <Sparkles size={12} className="animate-pulse" /> REVAMP • 20026
          </div>
        </div>

        {rawImages.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {rawImages.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`relative aspect-square w-20 flex-shrink-0 overflow-hidden border transition-all ${
                  selectedImage === img
                    ? 'border-gold ring-1 ring-gold/50 scale-105'
                    : 'border-border/40 opacity-60 hover:opacity-100'
                }`}
              >
                <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Product Info & Actions */}
      <div className="flex flex-col">
        {product?.category && (
          <span className="text-[11px] font-mono tracking-widest uppercase text-gold mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-gold rounded-full animate-ping" />
            {product.category}
          </span>
        )}

        <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-tight text-foreground mb-3">
          {product?.name || 'Untitled Item'}
        </h1>

        {/* Rating Counter */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center text-amber-400 gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={i < Math.floor(rating) ? 'fill-current text-amber-400' : 'text-zinc-700'}
              />
            ))}
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {rating.toFixed(1)} <span className="text-zinc-600">/</span> {ratingCount} VERIFIED
          </span>
        </div>

        {/* Dynamic Pricing */}
        <div className="text-3xl font-light tracking-tight text-foreground mb-6 font-mono">
          {formatPrice(totalPrice, product?.currency || 'USD')}
          {fabricDelta > 0 && (
            <span className="text-xs text-gold/80 block mt-1 font-sans">
              (Includes +{formatPrice(fabricDelta)} for {selectedFabric?.label})
            </span>
          )}
        </div>

        {/* Description */}
        <div className="prose prose-sm text-muted-foreground mb-8 leading-relaxed">
          <p>{product?.description || product?.tagline || 'Crafted with precision engineering.'}</p>
        </div>

        {/* COLOR PICKER */}
        {colors.length > 0 && (
          <div className="mb-6">
            <label className="block text-xs font-mono uppercase tracking-widest text-foreground/80 mb-3">
              Finish: <span className="text-gold">{selectedColor?.label || 'Select'}</span>
            </label>
            <div className="flex flex-wrap gap-2.5">
              {colors.map((color: any, idx: number) => (
                <button
                  key={color?.id || idx}
                  onClick={() => handleColorSelect(color)}
                  className={`flex items-center gap-2.5 h-10 px-4 border text-xs font-medium transition-all ${
                    selectedColor?.id === color?.id
                      ? 'border-gold bg-gold/10 text-gold shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                      : 'border-border/50 text-foreground hover:border-foreground/50'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-inner"
                    style={{ backgroundColor: color?.value || '#1C1C1C' }}
                  />
                  {color?.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MATERIAL / FABRIC PICKER */}
        {fabrics.length > 0 && (
          <div className="mb-6">
            <label className="block text-xs font-mono uppercase tracking-widest text-foreground/80 mb-3">
              Specification: <span className="text-gold">{selectedFabric?.label || 'Standard'}</span>
            </label>
            <div className="flex flex-wrap gap-2.5">
              {fabrics.map((fabric: any, idx: number) => {
                const delta = parseFloat(fabric?.priceDelta || '0')
                return (
                  <button
                    key={fabric?.id || idx}
                    onClick={() => setSelectedFabric(fabric)}
                    className={`h-10 px-4 border text-xs font-medium transition-all ${
                      selectedFabric?.id === fabric?.id
                        ? 'border-gold bg-gold/10 text-gold shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                        : 'border-border/50 text-foreground hover:border-foreground/50'
                    }`}
                  >
                    {fabric?.label} {delta > 0 ? `(+${formatPrice(delta)})` : ''}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Quantity and Actions */}
        <div className="flex gap-4 mb-8">
          <div className="flex items-center border border-border/60 bg-muted/20">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-4 py-3 text-foreground hover:bg-muted/50 transition-colors font-mono text-sm"
            >
              -
            </button>
            <span className="px-4 py-3 text-sm font-mono text-foreground font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="px-4 py-3 text-foreground hover:bg-muted/50 transition-colors font-mono text-sm"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="flex-1 bg-gold hover:bg-gold/90 text-zinc-950 font-semibold py-3 px-6 transition-all text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:shadow-gold/20"
          >
            {addingToCart ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
            ACQUIRE NOW
          </button>

          <button
            onClick={toggleWishlist}
            className={`p-3.5 border transition-all ${
              isWishlisted
                ? 'border-red-500 text-red-500 bg-red-500/10'
                : 'border-border/60 text-foreground hover:border-gold'
            }`}
          >
            <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
          </button>
        </div>

        {/* Guarantees */}
        <div className="border-t border-border/30 pt-6 space-y-3 text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-3">
            <Truck size={16} className="text-gold" />
            <span>EXPRESS GLOBAL DISPATCH AVAILABLE</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={16} className="text-gold" />
            <span>20026 CERTIFIED CRAFTSMANSHIP GUARANTEE</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductReviews({ product }: { product: any }) {
  const [reviews, setReviews] = useState<any[]>(Array.isArray(product?.reviews) ? product.reviews : [])
  const [author, setAuthor] = useState('')
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!author || !comment) {
      alert('Please fill out your identity and experience details.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          author,
          rating,
          comment,
        }),
      })

      if (res.ok) {
        const newReview = await res.json()
        setReviews([newReview.data || { author, rating, comment, createdAt: new Date() }, ...reviews])
        setAuthor('')
        setComment('')
        setRating(5)
        alert('Review logged to network!')
      } else {
        alert('Failed to transmit review.')
      }
    } catch (err) {
      // Local fallback
      setReviews([{ author, rating, comment, createdAt: new Date() }, ...reviews])
      setAuthor('')
      setComment('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div>
        <div className="flex items-center justify-between border-b border-border/30 pb-4 mb-8">
          <h3 className="font-serif text-2xl font-light tracking-tight text-foreground">
            Client Transmissions <span className="font-mono text-xs text-gold ml-2">[{reviews.length}]</span>
          </h3>
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            SECURE REVIEW FEED 20026
          </span>
        </div>

        {/* 20026 INTERACTIVE RATING REVIEW FORM */}
        <form onSubmit={handleReviewSubmit} className="border border-border/50 p-6 md:p-8 bg-muted/10 space-y-6 mb-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 blur-3xl rounded-full pointer-events-none" />

          <h4 className="font-serif text-lg font-light text-foreground flex items-center gap-2">
            Submit Rating Transmission
          </h4>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Identity / Name *
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Alex Mercer"
                className="w-full p-3 border border-border/60 text-xs bg-background focus:outline-none focus:border-gold transition-colors font-mono"
                required
              />
            </div>

            {/* TAP TO RATE STAR SELECTOR */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Rating Assessment ({rating} / 5) *
              </label>
              <div className="flex items-center gap-1.5 pt-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-zinc-700 hover:scale-125 transition-transform duration-200 focus:outline-none"
                  >
                    <Star
                      size={22}
                      className={
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          : 'text-zinc-700'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Transmission Log / Comment *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Describe product quality, texture, and overall aesthetic..."
              className="w-full p-3 border border-border/60 text-xs bg-background focus:outline-none focus:border-gold transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-gold hover:bg-gold/90 text-zinc-950 px-8 py-3 text-xs font-mono uppercase tracking-widest font-semibold transition-all shadow-lg hover:shadow-gold/20"
          >
            {submitting ? 'Transmitting...' : 'Send Transmission'}
          </button>
        </form>

        {/* REVIEWS LIST */}
        {reviews.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border/40 font-mono text-xs text-muted-foreground">
            NO TRANSMISSIONS LOGGED YET. BE THE FIRST CLIENT TO TRANSMIT A REVIEW.
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((rev: any, idx: number) => (
              <div key={rev?.id || idx} className="border-b border-border/30 pb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold text-foreground">
                      {rev?.author || 'Anonymous Client'}
                    </span>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < (rev?.rating || 5) ? 'fill-current' : 'text-zinc-800'}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    VERIFIED BUYER
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{rev?.comment || rev?.text}</p>
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
