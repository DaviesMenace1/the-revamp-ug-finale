'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { products, formatPrice } from '@/lib/data/products'
import { useCart } from '@/lib/context/cart-context'

const STORAGE_KEY = 'revamp:wishlist'

export default function WishlistPage() {
  const [ids, setIds] = useState<string[]>([])
  const { addToCart } = useCart()

  useEffect(() => {
    const sync = () => {
      try { setIds(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')) } catch { setIds([]) }
    }
    sync()
    window.addEventListener('revamp:wishlist-change', sync)
    return () => window.removeEventListener('revamp:wishlist-change', sync)
  }, [])

  const savedProducts = ids.map((id) => products.find((product) => product.id === id)).filter(Boolean)

  const remove = (id: string) => {
    const next = ids.filter((item) => item !== id)
    setIds(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('revamp:wishlist-change'))
  }

  const clear = () => {
    setIds([])
    window.localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new CustomEvent('revamp:wishlist-change'))
  }

  return (
    <main className="min-h-screen bg-background px-6 py-24 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.28em] text-muted-foreground">Saved pieces</p>
            <h1 className="mt-4 font-serif text-5xl text-foreground md:text-7xl">Your wishlist</h1>
            <p className="mt-4 max-w-lg font-sans leading-7 text-muted-foreground">Keep the pieces you are considering close, then move them to your cart when the moment feels right.</p>
          </div>
          {savedProducts.length > 0 && <Button variant="outline" onClick={clear}><Trash2 data-icon="inline-start" /> Clear wishlist</Button>}
        </div>

        {savedProducts.length === 0 ? (
          <section className="flex min-h-[360px] flex-col items-center justify-center gap-5 text-center">
            <Heart className="size-10 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-serif text-3xl text-foreground">Nothing saved yet</h2>
            <p className="max-w-md font-sans leading-7 text-muted-foreground">Browse the collection and save pieces you would like to revisit.</p>
            <Button onClick={() => { window.location.href = '/collections' }}>
              Explore collections <ArrowRight data-icon="inline-end" />
            </Button>
          </section>
        ) : (
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {savedProducts.map((product) => product && (
              <article key={product.id} className="group bg-background">
                <Link href={`/collections/${product.slug}`} className="block overflow-hidden">
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img src={product.images[0]} alt={product.name} className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                </Link>
                <div className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <Link href={`/collections/${product.slug}`} className="font-serif text-2xl text-foreground hover:text-primary">{product.name}</Link>
                    <p className="mt-2 font-sans text-sm text-muted-foreground">{formatPrice(product.price, product.currency)}</p>
                  </div>
                  <button type="button" onClick={() => remove(product.id)} aria-label={`Remove ${product.name} from wishlist`} className="text-muted-foreground hover:text-destructive"><Heart className="size-5 fill-current" /></button>
                </div>
                <div className="px-5 pb-5"><Button className="w-full" onClick={() => addToCart(product as never, 1)}><ShoppingBag data-icon="inline-start" /> Add to cart</Button></div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
