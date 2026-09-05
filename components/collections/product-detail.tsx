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
  Send,
} from '@/components/ui/luxury-icons'
import { useCart } from '@/lib/context/cart-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DEFAULT_PRODUCT_IMAGE, formatMoney, normalizeCurrency, resolveProductImageUrls, resolveProductVariantImage } from '@/lib/utils'
import { ProductShareSheet } from '@/components/collections/product-share-sheet'
import { getProductDimensions } from '@/lib/product-dimensions'

const WISHLIST_STORAGE_KEY = 'revamp:wishlist'

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
        className="w-full flex justify-between items-center text-left text-xs uppercase tracking-widest font-medium text-foreground hover:text-gilded transition-colors"
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-gilded' : 'text-muted-foreground'
          }`}
        />
      </button>
      {isOpen && <div className="mt-4 text-xs text-muted-foreground space-y-2 leading-relaxed">{children}</div>}
    </div>
  )
}

export function ProductDetail({ product }: { product: any }) {
  const cart = useCart() as any

  // Images are sorted by primary flag and display order, with safe legacy fallbacks.
  const rawImages = resolveProductImageUrls(product)

  // Variants extraction
  const variants = Array.isArray(product?.productVariants) ? product.productVariants : []
  const colors = variants.filter((variant: any) => variant?.type === 'COLOR')
  const fabrics = variants.filter((variant: any) => variant?.type === 'FABRIC')
  const materials = variants.filter((variant: any) => variant?.type === 'MATERIAL')
  const otherVariants = variants.filter((variant: any) => !['COLOR', 'FABRIC', 'MATERIAL'].includes(variant?.type))
  const accessories = Array.isArray(product?.addons) ? product.addons : []

  const productDimensions = getProductDimensions(product)
  const initialWidth = productDimensions.find((dimension) => dimension.key.toLowerCase() === 'width')?.value ?? ''
  const initialHeight = productDimensions.find((dimension) => dimension.key.toLowerCase() === 'height')?.value ?? ''
  const initialDepth = productDimensions.find((dimension) => dimension.key.toLowerCase() === 'depth')?.value ?? ''

  const [selectedImage, setSelectedImage] = useState<string>(rawImages[0] || DEFAULT_PRODUCT_IMAGE)
  const [selectedColor, setSelectedColor] = useState(colors[0] || null)
  const [selectedFabric, setSelectedFabric] = useState(fabrics[0] || null)
  const [selectedMaterial, setSelectedMaterial] = useState(materials[0] || null)
  const [selectedVariant, setSelectedVariant] = useState(otherVariants[0] || null)
  const [selectedAccessories, setSelectedAccessories] = useState<any[]>([])
  const [quantity, setQuantity] = useState<number>(1)
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false)
  const [added, setAdded] = useState<boolean>(false)

  const [isShareOpen, setIsShareOpen] = useState(false)

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

  // Pricing stays in the product currency and is shared with the cart snapshot.
  const basePrice = Number(product?.salePrice ?? product?.price ?? 0)
  const optionPrice = (option: any) => Number(option?.priceDelta ?? option?.price ?? 0) || 0
  const fabricDelta = optionPrice(selectedFabric)
  const unitPrice = basePrice + fabricDelta + optionPrice(selectedMaterial) + optionPrice(selectedVariant) + selectedAccessories.reduce((sum, accessory) => sum + optionPrice(accessory), 0)
  const totalPrice = unitPrice * quantity

  const selectVariantImage = (variant: any) => {
    const matchingImage = resolveProductVariantImage(product, variant?.id)
    if (matchingImage) setSelectedImage(matchingImage)
  }

  const handleColorSelect = (color: any) => {
    setSelectedColor(color)
    selectVariantImage(color)
  }

  const handleAddToCart = () => {
    const customDimensionsToPass = useCustomDims
      ? {
          width: dimensions.width ? parseFloat(String(dimensions.width)) : undefined,
          height: dimensions.height ? parseFloat(String(dimensions.height)) : undefined,
          depth: dimensions.depth ? parseFloat(String(dimensions.depth)) : undefined,
        }
      : undefined

    const productForCart = {
      ...product,
      id: product?.id,
      slug: product?.slug || product?.id,
      name: product?.name || 'Untitled Piece',
      price: basePrice,
      currency: normalizeCurrency(product?.currency),
      images: rawImages,
      thumbnailImage: selectedImage,
    }

    cart.addToCart(
      productForCart,
      quantity,
      selectedColor,
      selectedVariant,
      selectedAccessories,
      customDimensionsToPass,
      selectedFabric,
      selectedMaterial,
    )

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const categoryName = product?.category?.name || product?.category || 'Luxury Collection'
  const productInquiryHref = `/contact?interest=product_inquiry&product=${encodeURIComponent(product?.name || '')}`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
      {/* LEFT: GALLERY (7 columns) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-muted/30 border border-border">
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
                    ? 'border-gilded ring-1 ring-gilded'
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
          <span className="text-[11px] uppercase tracking-widest font-semibold text-gilded">
            {categoryName}
          </span>
          {/* Share Button Trigger */}
          <button
            type="button"
            onClick={() => setIsShareOpen((open) => !open)}
            aria-label={`Share ${product?.name || 'this product'}`}
            className="flex min-h-11 items-center gap-2 rounded-full px-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            title="Share product"
          >
            <Share2 size={14} />
            <span className="uppercase text-[10px] tracking-wider font-medium">Share</span>
          </button>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-3 leading-tight">
          {product?.name || 'Untitled Piece'}
        </h1>

        <ProductShareSheet
          product={{
            name: product?.name || 'Untitled Piece',
            price: totalPrice,
            currency: normalizeCurrency(product?.currency),
            image: selectedImage,
            description: product?.description,
          }}
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
        />

        {/* Rating Overview */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center text-gilded gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < Math.floor(rating) ? 'fill-current text-gilded' : 'text-muted'}
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
            {formatMoney(totalPrice, normalizeCurrency(product?.currency))}
          </span>
          <span className="text-xs text-muted-foreground">
            Final price updates with your selected finish.
          </span>
        </div>

        {/* Editorial Highlight */}
        {product?.editorialHighlight && (
          <div className="mb-6 p-4 border border-gilded/30 bg-gilded/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-serif text-gilded font-medium">
              <Sparkle className="w-3.5 h-3.5" />
              <span>Why We Love This Piece</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-serif">
              "{product.editorialHighlight}"
            </p>
          </div>
        )}

        {/* COLOR SWATCH PICKER */}
        {colors.length > 0 && (
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-widest font-medium text-foreground mb-3">
              Color Finish: <span className="text-gilded">{selectedColor?.label || 'Select'}</span>
            </label>
            <div className="flex flex-wrap gap-2.5">
              {colors.map((color: any, idx: number) => (
                <button
                  type="button"
                  key={color?.id || idx}
                  onClick={() => handleColorSelect(color)}
                  aria-pressed={selectedColor?.id === color?.id}
                  aria-label={`Select ${color?.label || 'colour'} colour`}
                  className={`flex items-center gap-2 h-10 px-3 border text-xs font-medium transition-all ${
                    selectedColor?.id === color?.id
                      ? 'border-gilded bg-gilded/10 text-foreground ring-1 ring-gilded'
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
              <span className="text-gilded">{selectedFabric?.label || 'Standard'}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {fabrics.map((fabric: any, idx: number) => {
                const delta = parseFloat(fabric?.priceDelta || '0')
                return (
                  <button
                    key={fabric?.id || idx}
                    onClick={() => {
                      setSelectedFabric(fabric)
                      selectVariantImage(fabric)
                    }}
                    className={`h-9 px-4 border text-xs font-medium transition-all ${
                      selectedFabric?.id === fabric?.id
                        ? 'border-gilded bg-gilded/10 text-foreground ring-1 ring-gilded'
                        : 'border-border text-muted-foreground hover:border-foreground'
                    }`}
                  >
                    {fabric?.label} {delta > 0 ? `(+${formatMoney(delta, normalizeCurrency(product?.currency))})` : ''}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {materials.length > 0 && (
          <div className="mb-6">
            <label className="mb-3 block text-xs font-medium uppercase tracking-widest text-foreground">Material: <span className="text-gilded">{selectedMaterial?.label || 'Standard'}</span></label>
            <div className="flex flex-wrap gap-2">
              {materials.map((material: any, index: number) => (
                <button type="button" key={material?.id || index} onClick={() => { setSelectedMaterial(material); selectVariantImage(material) }} className={`min-h-11 border px-4 text-xs font-medium transition-all ${selectedMaterial?.id === material?.id ? 'border-gilded bg-gilded/10 text-foreground ring-1 ring-gilded' : 'border-border text-muted-foreground hover:border-foreground'}`}>
                  {material?.label || material?.name} {optionPrice(material) > 0 ? `(+${formatMoney(optionPrice(material), normalizeCurrency(product?.currency))})` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {otherVariants.length > 0 && (
          <div className="mb-6">
            <label className="mb-3 block text-xs font-medium uppercase tracking-widest text-foreground">Style / size: <span className="text-gilded">{selectedVariant?.label || 'Select'}</span></label>
            <div className="flex flex-wrap gap-2">
              {otherVariants.map((variant: any, index: number) => (
                <button type="button" key={variant?.id || index} onClick={() => { setSelectedVariant(variant); selectVariantImage(variant) }} className={`min-h-11 border px-4 text-xs font-medium transition-all ${selectedVariant?.id === variant?.id ? 'border-gilded bg-gilded/10 text-foreground ring-1 ring-gilded' : 'border-border text-muted-foreground hover:border-foreground'}`}>
                  {variant?.label || variant?.name} {optionPrice(variant) > 0 ? `(+${formatMoney(optionPrice(variant), normalizeCurrency(product?.currency))})` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {accessories.length > 0 && (
          <div className="mb-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-foreground">Complete the setting</p>
            <div className="space-y-2">
              {accessories.map((accessory: any, index: number) => {
                const isSelected = selectedAccessories.some((selected) => selected?.id === accessory?.id)
                return <label key={accessory?.id || index} className={`flex min-h-11 cursor-pointer items-center justify-between gap-4 border px-3 text-xs transition-colors ${isSelected ? 'border-gilded bg-gilded/10' : 'border-border hover:border-foreground'}`}><span className="flex items-center gap-2"><input type="checkbox" checked={isSelected} onChange={() => setSelectedAccessories((current) => isSelected ? current.filter((selected) => selected?.id !== accessory?.id) : [...current, accessory])} className="size-4 accent-[var(--primary)]" />{accessory?.label || accessory?.name}</span><span className="text-muted-foreground">{optionPrice(accessory) > 0 ? `+${formatMoney(optionPrice(accessory), normalizeCurrency(product?.currency))}` : 'Included'}</span></label>
              })}
            </div>
          </div>
        )}

        {/* BESPOKE TAILORING DRAWER */}
        <div className="mb-8 border border-border p-4 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-gilded" />
              <span className="text-xs uppercase tracking-wider font-medium text-foreground">
                Custom Tailoring
              </span>
            </div>
            <button
              type="button"
              onClick={() => setUseCustomDims(!useCustomDims)}
              className="text-xs text-gilded hover:underline flex items-center gap-1 font-medium"
            >
              {useCustomDims ? 'Use Standard Dimensions' : '+ Request Bespoke Sizing'}
            </button>
          </div>

          {useCustomDims ? (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <p className="text-[11px] text-muted-foreground">
                Add approximate dimensions in inches if you already have them. The studio will confirm the final specification before custom work is accepted.
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
                    className="w-full p-2 text-xs border border-border bg-background focus:border-gilded outline-none"
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
                    className="w-full p-2 text-xs border border-border bg-background focus:border-gilded outline-none"
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
                    className="w-full p-2 text-xs border border-border bg-background focus:border-gilded outline-none"
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
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-obsidian hover:bg-gilded/10 transition-colors"
            >
              -
            </button>
            <span className="px-4 py-2 text-xs font-medium">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3 py-2 text-obsidian hover:bg-gilded/10 transition-colors"
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
                : 'border-border text-foreground hover:border-gilded'
            }`}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart size={18} className={isWishlisted ? 'fill-current text-red-500' : ''} />
          </button>
        </div>

        <div className="mb-8 flex flex-col gap-2 border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-foreground">Need a different finish or size?</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Send the studio this piece as the starting point for a customisation conversation.</p>
          </div>
          <Link href={productInquiryHref} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-border px-4 text-xs font-medium uppercase tracking-wider text-foreground transition-colors hover:border-gilded hover:text-gilded"><Send className="size-4" aria-hidden="true" />Ask about this piece</Link>
        </div>

        {/* ACCORDIONS */}
        <div className="border-t border-border mt-2">
          <AccordionItem
            title="Overview & Description"
            isOpen={openAccordion === 'description'}
            onToggle={() => toggleAccordion('description')}
          >
            <p>{product?.description || 'The studio will confirm the product description and suitable specifications with your order brief.'}</p>
          </AccordionItem>

          <AccordionItem
            title="Dimensions & Specifications"
            isOpen={openAccordion === 'specs'}
            onToggle={() => toggleAccordion('specs')}
          >
            {productDimensions.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {productDimensions.map(({ key, label, value, unit }) => (
                  <div key={key} className="border border-border/60 p-2.5">
                    <span className="block text-[10px] uppercase text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value}{unit ? ` ${unit}` : ''}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Product dimensions have not been supplied.</p>
            )}
          </AccordionItem>

          <AccordionItem
            title="Materials & Craftsmanship"
            isOpen={openAccordion === 'materials'}
            onToggle={() => toggleAccordion('materials')}
          >
            <p>
              {product?.material ||
                'Material and finish details will be confirmed for the selected piece and options.'}
            </p>
          </AccordionItem>

          <AccordionItem
            title="Care & Maintenance"
            isOpen={openAccordion === 'care'}
            onToggle={() => toggleAccordion('care')}
          >
            <p>
              Follow the care guidance supplied with your order. The studio can confirm suitable care for the selected material and finish.
            </p>
          </AccordionItem>
        </div>

        {/* Trust Badges */}
                  <div className="border-t border-border pt-6 mt-6 space-y-3 text-xs text-muted-foreground">

          <div className="flex items-center gap-3">
            <Truck size={16} className="text-gilded" />
            <span>Delivery and installation options are confirmed with your order brief.</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={16} className="text-gilded" />
            <span>Specifications and any applicable warranty terms are confirmed before purchase.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// PRODUCT REVIEWS WITH INTERACTIVE FORM
export function ProductReviews({ product }: { product: any }) {
  const router = useRouter()
  const [reviewsList, setReviewsList] = useState<any[]>(
    Array.isArray(product?.reviews) ? product.reviews : product?.productReviews || []
  )
  const [showForm, setShowForm] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const ratingCount = reviewsList.length
  const avgRating =
    ratingCount > 0
      ? reviewsList.reduce((sum, rev) => sum + Number(rev.rating || 0), 0) / ratingCount
      : 0

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
            <div className="flex gap-1 text-gilded">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star size={20} className={star <= rating ? 'fill-current text-gilded' : 'text-muted'} />
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
              className="w-full p-2.5 text-xs bg-background border border-border focus:border-gilded outline-none"
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
              className="w-full p-2.5 text-xs bg-background border border-border focus:border-gilded outline-none"
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
          <div className="flex items-center text-gilded gap-0.5 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={i < Math.floor(avgRating) ? 'fill-current text-gilded' : 'text-muted'}
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
              <div className="flex items-center text-gilded gap-0.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < (rev?.rating || 5) ? 'fill-current text-gilded' : 'text-muted'}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{rev?.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground font-serif">No customer reviews yet for this product.</p>
      )}
    </div>
  )
}

