'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { useCart } from '@/lib/context/cart-context'
import { WishlistButton } from '@/components/collections/wishlist-button'

const DEFAULT_IMAGE = 'https://therevampug.com/default-thumb.png'
const MAX_VISIBLE_SWATCHES = 5

function formatPrice(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value || 0)
}

type SwatchVariant = {
  id: string
  hex?: string | null
  label?: string | null
  imageUrl?: string | null
}

export function ProductCard({ product }: { product: any }) {
  const { addToCart } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const images = Array.isArray(product.productImages)
    ? product.productImages.map((img: any) => img?.url).filter(Boolean)
    : []
  const mainImage = images[0] || DEFAULT_IMAGE
  const hoverImage = images[1] || mainImage

  const variants = Array.isArray(product.productVariants) ? product.productVariants : []
  const colorVariants: SwatchVariant[] = variants
    .filter((v: any) => v.type === 'COLOR')
    .map((v: any) => ({
      id: v.id,
      hex: v.value,
      label: v.label,
    }))

  const visibleSwatches = colorVariants.slice(0, MAX_VISIBLE_SWATCHES)
  const overflowCount = colorVariants.length - visibleSwatches.length

  const currentPrice = parseFloat(String(product.price || '0'))
  const comparePrice = product.originalPrice ? parseFloat(String(product.originalPrice)) : null
  const currency = product.currency || 'USD'

  const categoryLabel = product.subCategory?.category?.name || product.subCategory?.name

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    addToCart(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: currentPrice,
        currency,
        images,
      } as any,
      1,
    )

    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1800)
  }

  return (
    <Link
      href={`/collections/${product.slug}`}
      className="group relative flex flex-col bg-background overflow-hidden"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Image
          src={mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-opacity duration-500 group-hover:opacity-0"
        />
        {hoverImage !== mainImage && (
          <Image
            src={hoverImage}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500 z-10 pointer-events-none" />

        {product.featured && (
          <span className="absolute top-3 left-3 bg-gold text-obsidian font-sans text-[10px] tracking-widest uppercase px-2.5 py-1 z-20">
            Featured
          </span>
        )}

        <div className="absolute top-2 right-2 z-20">
          <WishlistButton productId={product.id} variant="icon" />
        </div>

        <button
          onClick={handleQuickAdd}
          aria-label="Add to cart"
          className="absolute bottom-3 right-3 z-20 flex size-10 items-center justify-center rounded-full bg-background shadow-md transition-all duration-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-gold hover:text-obsidian"
        >
          {justAdded ? <Check size={16} /> : <ShoppingBag size={16} />}
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4 border-t border-border">
        {categoryLabel && (
          <span className="text-[10px] uppercase font-semibold text-amber-700 block mb-1">
            {categoryLabel}
          </span>
        )}

        <h3 className="font-serif text-base font-light text-foreground group-hover:text-gold transition-colors leading-tight mb-1">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-sans text-sm text-foreground font-medium">
            {formatPrice(currentPrice, currency)}
          </span>

          {comparePrice && comparePrice > currentPrice && (
            <span className="font-sans text-xs text-muted-foreground line-through">
              {formatPrice(comparePrice, currency)}
            </span>
          )}
        </div>

        {visibleSwatches.length > 0 && (
          <div className="mt-auto flex items-center gap-1.5 pt-1">
            {visibleSwatches.map((swatch) => (
              <span
                key={swatch.id}
                title={swatch.label ?? undefined}
                className="size-4 rounded-full border border-border/60"
                style={{
                  backgroundColor: swatch.hex && swatch.hex.startsWith('#') ? swatch.hex : '#e5e5e5',
                }}
              />
            ))}
            {overflowCount > 0 && (
              <span className="text-[11px] text-muted-foreground ml-0.5">+{overflowCount}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}