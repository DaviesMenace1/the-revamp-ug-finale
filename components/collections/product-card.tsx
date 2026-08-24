'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { useCart } from '@/lib/context/cart-context'
import { WishlistButton } from '@/components/collections/wishlist-button'
import { formatMoney, normalizeCurrency } from '@/lib/utils'

const DEFAULT_IMAGE = 'https://therevampug.com/default-thumb.png'
const MAX_VISIBLE_SWATCHES = 5

type SwatchVariant = {
  id: string
  hex?: string | null
  label?: string | null
}

export function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const images = Array.isArray(product.productImages)
    ? product.productImages.map((img: any) => img?.url).filter(Boolean)
    : Array.isArray(product.images)
      ? product.images.filter(Boolean)
      : []
  const mainImage = images[0] || DEFAULT_IMAGE
  const hoverImage = images[1] || mainImage

  const variants = Array.isArray(product.productVariants) ? product.productVariants : []
  const colorVariants: SwatchVariant[] = variants
    .filter((variant: any) => variant.type === 'COLOR')
    .map((variant: any) => ({ id: variant.id, hex: variant.value, label: variant.label }))

  const visibleSwatches = colorVariants.slice(0, MAX_VISIBLE_SWATCHES)
  const overflowCount = colorVariants.length - visibleSwatches.length
  const currentPrice = Number(product.salePrice ?? product.price ?? 0)
  const comparePrice = product.originalPrice ? Number(product.originalPrice) : null
  const currency = normalizeCurrency(product.currency)
  const categoryLabel = product.subCategory?.category?.name || product.subCategory?.name

  function handleQuickAdd(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()

    addToCart(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: currentPrice,
        currency,
        images,
        thumbnailImage: mainImage,
      } as any,
      1,
    )

    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1800)
  }

  return (
    <article className="group relative flex min-w-0 flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Link href={`/collections/${product.slug}`} className="absolute inset-0 z-0 block" aria-label={`View ${product.name}`}>
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 767px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {hoverImage !== mainImage && (
            <Image
              src={hoverImage}
              alt=""
              fill
              sizes="(max-width: 767px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
          <span className="absolute inset-0 bg-foreground/0 transition-colors duration-500 group-hover:bg-foreground/10" />
        </Link>

        {product.featured && (
          <span className="absolute left-3 top-3 z-10 bg-gold px-2.5 py-1 text-[10px] uppercase tracking-widest text-obsidian">
            Featured
          </span>
        )}

        <div className="absolute right-2 top-2 z-20">
          <WishlistButton productId={product.id} variant="icon" />
        </div>

        <button
          type="button"
          onClick={handleQuickAdd}
          aria-label={`Add ${product.name} to cart`}
          className="absolute bottom-3 right-3 z-20 flex size-11 translate-y-0 items-center justify-center rounded-full bg-background text-foreground shadow-md transition-all duration-200 hover:bg-gold hover:text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          {justAdded ? <Check size={16} aria-hidden="true" /> : <ShoppingBag size={16} aria-hidden="true" />}
        </button>
      </div>

      <Link href={`/collections/${product.slug}`} className="flex min-w-0 flex-1 flex-col border-t border-border/70 bg-background px-1 py-4">
        {categoryLabel && <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{categoryLabel}</span>}
        <h3 className="mb-2 font-serif text-lg leading-tight text-foreground transition-colors group-hover:text-gold">{product.name}</h3>
        <div className="mb-2 flex flex-wrap items-baseline gap-2">
          <span className="font-sans text-sm font-medium tabular-nums text-foreground">{formatMoney(currentPrice, currency)}</span>
          {comparePrice && comparePrice > currentPrice && <span className="font-sans text-xs tabular-nums text-muted-foreground line-through">{formatMoney(comparePrice, currency)}</span>}
        </div>
        {visibleSwatches.length > 0 && (
          <div className="mt-auto flex items-center gap-1.5 pt-1" aria-label={`${colorVariants.length} colour options`}>
            {visibleSwatches.map((swatch) => (
              <span key={swatch.id} title={swatch.label ?? undefined} className="size-4 rounded-full border border-border/60" style={{ backgroundColor: swatch.hex?.startsWith('#') ? swatch.hex : '#e5e5e5' }} />
            ))}
            {overflowCount > 0 && <span className="ml-0.5 text-[11px] text-muted-foreground">+{overflowCount}</span>}
          </div>
        )}
      </Link>
    </article>
  )
}
