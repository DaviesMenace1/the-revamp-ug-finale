'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, type CSSProperties, type MouseEvent } from 'react'
import { Check, ShoppingBag, Star } from 'lucide-react'
import { useCart } from '@/lib/context/cart-context'
import { WishlistButton } from '@/components/collections/wishlist-button'
import { cn, formatMoney, normalizeCurrency, resolveProductImageUrls, resolveProductVariantImage } from '@/lib/utils'

const MAX_VISIBLE_SWATCHES = 5

type SwatchVariant = {
  id: string
  hex?: string | null
  label?: string | null
  image?: string | null
}

type ProductRecord = {
  id: string
  slug: string
  name: string
  brand?: string | null
  price?: string | number | null
  salePrice?: string | number | null
  originalPrice?: string | number | null
  currency?: string | null
  quantity?: number | null
  availability?: string | null
  condition?: string | null
  rating?: string | number | null
  ratingCount?: number | null
  featured?: boolean | null
  isNewArrival?: boolean | null
  isBestSeller?: boolean | null
  isOnSale?: boolean | null
  editorialHighlight?: string | null
  description?: string | null
  subCategory?: { name?: string | null; category?: { name?: string | null } | null } | null
  productImages?: { url?: string | null; altText?: string | null; isPrimary?: boolean | null; displayOrder?: number | null }[]
  productVariants?: { id: string; type?: string | null; value?: string | null; label?: string | null }[]
  [key: string]: unknown
}

function compactLabel(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getAvailability(product: ProductRecord) {
  const availability = compactLabel(product.availability).toLowerCase()
  const quantity = Number(product.quantity ?? 0)
  const inStock = availability !== 'out_of_stock' && availability !== 'discontinued'

  if (!inStock) return { label: 'Sold out', canAdd: false }
  if (quantity > 0 && quantity <= 3) return { label: `Only ${quantity} left`, canAdd: true }
  if (availability === 'preorder') return { label: 'Pre-order', canAdd: true }
  return { label: 'In stock', canAdd: true }
}

function getBadge(product: ProductRecord, comparePrice: number | null, currentPrice: number) {
  if (product.isBestSeller) return 'Best seller'
  if (product.isNewArrival) return 'New arrival'
  if (product.isOnSale || (comparePrice !== null && comparePrice > currentPrice)) return 'Sale'
  if (product.featured) return 'Featured'
  return null
}

export function ProductCard({ product, featured = false, className, style }: { product: ProductRecord; featured?: boolean; className?: string; style?: CSSProperties }) {
  const { addToCart } = useCart()
  const [justAdded, setJustAdded] = useState(false)
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null)

  const images = resolveProductImageUrls(product)
  const mainImage = images[0]
  const hoverImage = images[1] || mainImage
  const primaryImage = product.productImages?.find((image) => image.isPrimary) || product.productImages?.[0]
  const imageAlt = compactLabel(primaryImage?.altText) || product.name

  const variants = Array.isArray(product.productVariants) ? product.productVariants : []
  const colorVariants: SwatchVariant[] = variants
    .filter((variant) => variant.type === 'COLOR')
    .map((variant) => ({ id: variant.id, hex: variant.value, label: variant.label, image: resolveProductVariantImage(product, variant.id) }))
  const selectedColor = colorVariants.find((variant) => variant.id === selectedColorId)
  const displayImage = selectedColor?.image || mainImage
  const displayHoverImage = selectedColor?.image ? images.find((image) => image !== selectedColor.image) || selectedColor.image : hoverImage

  const visibleSwatches = colorVariants.slice(0, MAX_VISIBLE_SWATCHES)
  const overflowCount = colorVariants.length - visibleSwatches.length
  const currentPrice = Number(product.salePrice ?? product.price ?? 0)
  const comparePriceValue = product.originalPrice ?? product.price
  const comparePrice = comparePriceValue !== null && comparePriceValue !== undefined ? Number(comparePriceValue) : null
  const hasDiscount = comparePrice !== null && Number.isFinite(comparePrice) && comparePrice > currentPrice
  const discountPercent = hasDiscount ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100) : 0
  const currency = normalizeCurrency(product.currency)
  const categoryLabel = compactLabel(product.subCategory?.category?.name) || compactLabel(product.subCategory?.name)
  const brandLabel = compactLabel(product.brand)
  const ratingValue = Number(product.rating ?? 0)
  const rating = Number.isFinite(ratingValue) ? Math.max(0, Math.min(5, ratingValue)) : 0
  const ratingCount = Math.max(0, Number(product.ratingCount ?? 0))
  const availability = getAvailability(product)
  const badge = getBadge(product, comparePrice, currentPrice) || (featured ? 'Featured' : null)
  const detailLine = compactLabel(product.editorialHighlight) || compactLabel(product.description)

  function handleQuickAdd(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (!availability.canAdd) return

    addToCart(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: currentPrice,
        currency,
        images,
        thumbnailImage: displayImage,
      } as any,
      1,
      selectedColor ? { id: selectedColor.id, label: selectedColor.label || selectedColor.id, name: selectedColor.label || selectedColor.id, hex: selectedColor.hex, image: selectedColor.image || undefined } as any : undefined,
    )

    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1800)
  }

  return (
    <article className={cn('group flex h-full min-w-0 flex-col overflow-hidden rounded-xl bg-card shadow-soft ring-1 ring-border/60', className)} style={style}>
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <Link href={`/collections/${product.slug}`} className="absolute inset-0 z-0 block" aria-label={`View ${product.name}`}>
          <Image src={displayImage} alt={imageAlt} fill sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw" className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
          {displayHoverImage !== displayImage && <Image src={displayHoverImage} alt="" fill sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw" className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />}
          <span className="absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/5" />
        </Link>

        {badge && <span className="absolute left-2.5 top-2.5 z-10 rounded-sm bg-background/95 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground shadow-sm sm:left-3 sm:top-3">{badge}</span>}

        <div className="absolute right-2 top-2 z-20 sm:right-3 sm:top-3">
          <WishlistButton productId={product.id} variant="icon" />
        </div>

        <button type="button" onClick={handleQuickAdd} disabled={!availability.canAdd} aria-label={availability.canAdd ? `Add ${product.name} to cart` : `${product.name} is sold out`} className={cn('absolute bottom-2.5 right-2.5 z-20 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-background px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground shadow-md transition-all duration-200 hover:bg-gold hover:text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:bottom-3 sm:right-3 sm:min-h-11 sm:px-3.5', !availability.canAdd && 'cursor-not-allowed opacity-60 hover:bg-background hover:text-foreground')}>
          {justAdded ? <Check size={15} aria-hidden="true" /> : <ShoppingBag size={15} aria-hidden="true" />}
          <span>{justAdded ? 'Added' : 'Add to Cart'}</span>
        </button>
      </div>

      <div className="flex min-h-[174px] flex-1 flex-col px-2.5 pb-3 pt-3 sm:min-h-[190px] sm:px-3 sm:pb-4">
        <Link href={`/collections/${product.slug}`} className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary">
            {brandLabel && <span className="max-w-[55%] truncate">{brandLabel}</span>}
            {brandLabel && categoryLabel && <span className="text-muted-foreground">·</span>}
            {categoryLabel && <span className="max-w-[45%] truncate text-muted-foreground">{categoryLabel}</span>}
          </div>
          <h3 className="mt-1.5 line-clamp-2 min-h-[2.45rem] text-[13px] font-medium leading-[1.25] text-foreground transition-colors group-hover:text-primary sm:text-sm">{product.name}</h3>
          {detailLine && <p className="mt-1 line-clamp-1 text-[10px] leading-4 text-muted-foreground">{detailLine}</p>}
        </Link>

        <div className="mt-auto">
          <div className="flex min-h-4 items-center gap-1.5" aria-label={`${rating.toFixed(1)} out of 5 stars from ${ratingCount} reviews`}>
            <span className="flex items-center text-gold" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={11} strokeWidth={1.5} fill={index + 0.5 <= rating ? 'currentColor' : 'none'} />)}</span>
            {ratingCount > 0 ? <span className="text-[10px] tabular-nums text-muted-foreground">({ratingCount.toLocaleString('en-UG')})</span> : <span className="text-[10px] text-muted-foreground">New</span>}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 pt-3">
            <span className="text-sm font-semibold tabular-nums text-foreground sm:text-base">{formatMoney(currentPrice, currency)}</span>
            {hasDiscount && <span className="text-[10px] tabular-nums text-muted-foreground line-through">{formatMoney(comparePrice, currency)}</span>}
            {discountPercent > 0 && <span className="text-[10px] font-medium tabular-nums text-destructive">-{discountPercent}%</span>}
          </div>

          <div className="mt-1 flex min-h-6 items-center justify-between gap-2 text-[10px]">
            <span className={cn(availability.canAdd ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive')}>{availability.label}</span>
            {visibleSwatches.length > 0 && <div className="flex items-center gap-1" aria-label={`${colorVariants.length} colour options`}>
              {visibleSwatches.map((swatch) => <button type="button" key={swatch.id} title={swatch.label ?? undefined} aria-label={`Show ${swatch.label || 'colour'} option`} aria-pressed={selectedColorId === swatch.id} onClick={() => setSelectedColorId(swatch.id)} className={cn('size-3 rounded-full border border-border/70 transition-transform duration-200 hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', selectedColorId === swatch.id && 'scale-125 ring-1 ring-primary ring-offset-1')} style={{ backgroundColor: swatch.hex?.startsWith('#') ? swatch.hex : '#e5e5e5' }} />)}
              {overflowCount > 0 && <span className="text-[9px] text-muted-foreground">+{overflowCount}</span>}
            </div>}
          </div>
        </div>
      </div>
    </article>
  )
}
