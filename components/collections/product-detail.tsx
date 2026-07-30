'use client'

import { useMemo, useState } from 'react'
import { Heart, Share2, Star, Check, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { WishlistButton } from '@/components/collections/wishlist-button'
import { formatPrice, type Product, type ProductReview } from '@/lib/data/products'

export function ProductDetail({ product }: { product: Product }) {
  const [activeImage, setActiveImage] = useState(0)
  const [color, setColor] = useState(product.colors[0]?.label ?? '')
  const [fabric, setFabric] = useState(product.fabrics[0]?.label ?? '')
  const [addons, setAddons] = useState<string[]>([])

  const total = useMemo(() => {
    let sum = product.price
    const fab = product.fabrics.find((f) => f.label === fabric)
    if (fab?.priceDelta) sum += fab.priceDelta
    for (const a of addons) {
      const addon = product.addons.find((x) => x.label === a)
      if (addon?.priceDelta) sum += addon.priceDelta
    }
    return sum
  }, [product, fabric, addons])

  const toggleAddon = (label: string) =>
    setAddons((prev) => (prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]))

  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
      {/* Gallery */}
      <div className="space-y-4">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${product.images[activeImage]}')` }}
            role="img"
            aria-label={`${product.name} — view ${activeImage + 1}`}
          />
        </div>
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {product.images.map((img, i) => (
              <button
                key={img}
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
                className={cn(
                  'relative aspect-square overflow-hidden bg-muted transition-opacity',
                  activeImage === i ? 'ring-2 ring-gold' : 'opacity-70 hover:opacity-100',
                )}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${img}')` }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info & options */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="font-sans text-xs tracking-widest uppercase text-gold">{product.itemType}</span>
          <span className="w-px h-3 bg-border" />
          <span className="font-sans text-xs tracking-widest uppercase text-muted-foreground">
            {product.space}
          </span>
        </div>

        <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground leading-tight mb-3">
          {product.name}
        </h1>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-6">
          <Stars value={product.rating} />
          <span className="font-sans text-sm text-muted-foreground">
            {product.rating.toFixed(1)} ({product.reviewCount} reviews)
          </span>
        </div>

        <p className="font-sans text-base text-muted-foreground leading-relaxed mb-8">
          {product.description}
        </p>

        <div className="font-serif text-3xl font-light text-foreground mb-8">
          {formatPrice(total, product.currency)}
        </div>

        {/* Color */}
        {product.colors.length > 0 && (
          <OptionBlock label="Colour" value={color}>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((c) => (
                <button
                  key={c.label}
                  onClick={() => setColor(c.label)}
                  aria-label={c.label}
                  aria-pressed={color === c.label}
                  title={c.label}
                  className={cn(
                    'size-9 rounded-full border transition-transform',
                    color === c.label ? 'ring-2 ring-gold ring-offset-2 ring-offset-background' : 'border-border',
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </OptionBlock>
        )}

        {/* Fabric */}
        {product.fabrics.length > 0 && (
          <OptionBlock label="Fabric" value={fabric}>
            <div className="flex flex-wrap gap-2">
              {product.fabrics.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setFabric(f.label)}
                  aria-pressed={fabric === f.label}
                  className={cn(
                    'font-sans text-sm px-4 py-2 border transition-colors',
                    fabric === f.label
                      ? 'border-gold text-gold'
                      : 'border-border text-foreground/70 hover:border-foreground',
                  )}
                >
                  {f.label}
                  {f.priceDelta ? ` +${formatPrice(f.priceDelta, product.currency)}` : ''}
                </button>
              ))}
            </div>
          </OptionBlock>
        )}

        {/* Add-ons */}
        {product.addons.length > 0 && (
          <OptionBlock label="Add-ons">
            <div className="flex flex-col gap-2">
              {product.addons.map((a) => {
                const checked = addons.includes(a.label)
                return (
                  <button
                    key={a.label}
                    onClick={() => toggleAddon(a.label)}
                    aria-pressed={checked}
                    className={cn(
                      'flex items-center justify-between gap-3 font-sans text-sm px-4 py-3 border text-left transition-colors',
                      checked ? 'border-gold' : 'border-border hover:border-foreground/40',
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          'size-4 border flex items-center justify-center',
                          checked ? 'bg-gold border-gold' : 'border-muted-foreground/40',
                        )}
                      >
                        {checked && <Check size={12} className="text-obsidian" />}
                      </span>
                      {a.label}
                    </span>
                    {a.priceDelta ? (
                      <span className="text-muted-foreground">
                        +{formatPrice(a.priceDelta, product.currency)}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </OptionBlock>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-10">
          <Button
            size="lg"
            className="w-full rounded-none bg-foreground text-background hover:bg-gold hover:text-obsidian font-sans text-xs tracking-widest uppercase py-6"
          >
            <ShoppingBag size={15} className="mr-2" />
            Enquire to Purchase — {formatPrice(total, product.currency)}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <WishlistButton productId={product.id} />
            <ShareButtons productName={product.name} />
          </div>
          <LikeButton productId={product.id} />
        </div>
      </div>
    </div>
  )
}

function OptionBlock({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">{label}</span>
        {value && <span className="font-sans text-sm text-foreground">— {value}</span>}
      </div>
      {children}
    </div>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={15}
          className={cn(n <= Math.round(value) ? 'fill-gold text-gold' : 'text-muted-foreground/40')}
        />
      ))}
    </div>
  )
}

function LikeButton({ productId }: { productId: string }) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)

  // Seed a stable-ish like count from the id so the number feels real.
  useMemo(() => {
    const seed = productId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    setCount(40 + (seed % 120))
  }, [productId])

  return (
    <button
      onClick={() => {
        setLiked((v) => !v)
        setCount((c) => (liked ? c - 1 : c + 1))
      }}
      aria-pressed={liked}
      className={cn(
        'flex items-center justify-center gap-2 w-full py-3 border font-sans text-xs tracking-widest uppercase transition-colors',
        liked ? 'border-gold text-gold' : 'border-border text-foreground/70 hover:border-foreground',
      )}
    >
      <Heart size={15} className={cn(liked && 'fill-gold text-gold')} />
      {liked ? 'Liked' : 'Like'} · {count}
    </button>
  )
}

function ShareButtons({ productName }: { productName: string }) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.share) {
      try {
        await navigator.share({ title: productName, url })
        return
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <Button
      onClick={share}
      variant="outline"
      size="lg"
      className="w-full rounded-none border-foreground/20 font-sans text-xs tracking-widest uppercase py-6 hover:border-gold hover:text-gold"
    >
      <Share2 size={15} className="mr-2" />
      {copied ? 'Link Copied' : 'Share'}
    </Button>
  )
}

export function ProductReviews({ product }: { product: Product }) {
  const [reviews, setReviews] = useState<ProductReview[]>(product.reviews)
  const [rating, setRating] = useState(5)
  const [author, setAuthor] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!author.trim() || !body.trim()) return
    const review: ProductReview = {
      id: `local-${Date.now()}`,
      author: author.trim(),
      rating,
      date: new Date().toISOString().slice(0, 10),
      title: title.trim() || 'Review',
      body: body.trim(),
    }
    setReviews((prev) => [review, ...prev])
    setAuthor('')
    setTitle('')
    setBody('')
    setRating(5)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-12">
      {/* Review list */}
      <div>
        <h2 className="font-serif text-3xl font-light text-foreground mb-8">
          Reviews ({reviews.length})
        </h2>
        <div className="flex flex-col gap-8">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-border pb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-sm font-medium text-foreground">{r.author}</span>
                <span className="font-sans text-xs text-muted-foreground">{r.date}</span>
              </div>
              <Stars value={r.rating} />
              <h3 className="font-serif text-lg font-light text-foreground mt-3 mb-1">{r.title}</h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Review form */}
      <div className="bg-muted/30 p-6 h-fit">
        <h3 className="font-serif text-2xl font-light text-foreground mb-6">Leave a Review</h3>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <span className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground block mb-2">
              Your Rating
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                  <Star
                    size={22}
                    className={cn(n <= rating ? 'fill-gold text-gold' : 'text-muted-foreground/40')}
                  />
                </button>
              ))}
            </div>
          </div>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name"
            required
            className="bg-background border border-border px-4 py-3 font-sans text-sm rounded-none focus:outline-none focus:border-gold"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title"
            className="bg-background border border-border px-4 py-3 font-sans text-sm rounded-none focus:outline-none focus:border-gold"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience with this piece..."
            required
            rows={4}
            className="bg-background border border-border px-4 py-3 font-sans text-sm rounded-none resize-none focus:outline-none focus:border-gold"
          />
          <Button
            type="submit"
            className="w-full rounded-none bg-foreground text-background hover:bg-gold hover:text-obsidian font-sans text-xs tracking-widest uppercase py-6"
          >
            Submit Review
          </Button>
          {submitted && (
            <p className="font-sans text-sm text-gold text-center">Thank you — your review was added.</p>
          )}
        </form>
      </div>
    </div>
  )
}
