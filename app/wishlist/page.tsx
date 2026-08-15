'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Heart,
  ShoppingBag,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/context/cart-context'

const STORAGE_KEY = 'revamp:wishlist'

type WishlistProduct = {
  id: string
  slug: string
  name: string
  price: number
  currency?: string
  thumbnailImage?: string
  images?: string[]
}

function formatPrice(
  value: number,
  currency = 'UGX'
) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency,
    maximumFractionDigits:
      currency === 'UGX' ? 0 : 2,
  }).format(Number(value) || 0)
}

function getImage(product: WishlistProduct) {
  return (
    product.thumbnailImage ||
    product.images?.[0] ||
    '/placeholder.jpg'
  )
}

export default function WishlistPage() {
  const { addToCart } = useCart()

  const [ids, setIds] = useState<string[]>([])
  const [products, setProducts] = useState<
    WishlistProduct[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWishlist = async () => {
      let savedIds: string[] = []

      try {
        const raw =
          localStorage.getItem(STORAGE_KEY)

        savedIds = raw ? JSON.parse(raw) : []
      } catch {
        savedIds = []
      }

      setIds(savedIds)

      if (!savedIds.length) {
        setProducts([])
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `/api/products?ids=${encodeURIComponent(
            savedIds.join(',')
          )}`,
          {
            cache: 'no-store',
          }
        )

        if (response.ok) {
          const data = await response.json()

          const returned =
            data.products ||
            data.data ||
            data.items ||
            []

          setProducts(
            returned.filter((product: any) =>
              savedIds.includes(product.id)
            )
          )
        }
      } catch (error) {
        console.error(
          'Failed to load wishlist:',
          error
        )
      } finally {
        setLoading(false)
      }
    }

    loadWishlist()

    const sync = () => {
      loadWishlist()
    }

    window.addEventListener(
      'revamp:wishlist-change',
      sync
    )

    return () =>
      window.removeEventListener(
        'revamp:wishlist-change',
        sync
      )
  }, [])

  const remove = (id: string) => {
    const next = ids.filter(
      (item) => item !== id
    )

    setIds(next)

    setProducts((current) =>
      current.filter(
        (product) => product.id !== id
      )
    )

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next)
    )

    window.dispatchEvent(
      new CustomEvent(
        'revamp:wishlist-change'
      )
    )
  }

  const clear = () => {
    setIds([])
    setProducts([])

    localStorage.removeItem(STORAGE_KEY)

    window.dispatchEvent(
      new CustomEvent(
        'revamp:wishlist-change'
      )
    )
  }

  const addWishlistProductToCart = (
    product: WishlistProduct
  ) => {
    addToCart(
      product as any,
      1,
      undefined,
      undefined,
      []
    )
  }

  return (
    <main className="min-h-screen bg-background px-6 pb-24 pt-32 md:px-10">
      <div className="mx-auto max-w-7xl">

        <header className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">

          <div>
            <p className="font-sans text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Saved pieces
            </p>

            <h1 className="mt-4 font-serif text-5xl md:text-7xl">
              Wishlist
            </h1>

            <p className="mt-4 max-w-xl font-sans leading-7 text-muted-foreground">
              Keep the pieces you're considering
              close and return to them whenever
              you're ready.
            </p>
          </div>

          {products.length > 0 && (
            <Button
              variant="outline"
              onClick={clear}
            >
              <Trash2
                data-icon="inline-start"
              />
              Clear wishlist
            </Button>
          )}

        </header>

        {loading ? (
          <section className="flex min-h-[400px] items-center justify-center">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Loading saved pieces...
            </p>
          </section>
        ) : products.length === 0 ? (
          <section className="flex min-h-[400px] flex-col items-center justify-center text-center">

            <Heart className="mb-6 h-10 w-10 text-muted-foreground" />

            <h2 className="font-serif text-3xl">
              Nothing saved yet
            </h2>

            <p className="mt-4 max-w-md leading-7 text-muted-foreground">
              Save furniture, lighting, décor and
              architectural pieces while you explore
              The Revamp UG collection.
            </p>

            <Button
              asChild
              className="mt-7"
            >
              <Link href="/collections">
                Explore collections
                <ArrowRight
                  data-icon="inline-end"
                />
              </Link>
            </Button>

          </section>
        ) : (
          <div className="mt-10 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {products.map((product) => (
              <article
                key={product.id}
                className="group bg-background"
              >

                <Link
                  href={`/collections/${product.slug}`}
                  className="block"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">

                    <Image
                      src={getImage(product)}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        remove(product.id)
                      }}
                      aria-label={`Remove ${product.name} from wishlist`}
                      className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-sm"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </button>

                  </div>
                </Link>

                <div className="p-5">

                  <Link
                    href={`/collections/${product.slug}`}
                    className="font-serif text-2xl hover:text-primary"
                  >
                    {product.name}
                  </Link>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatPrice(
                      product.price,
                      product.currency ||
                        'UGX'
                    )}
                  </p>

                  <Button
                    className="mt-5 w-full"
                    onClick={() =>
                      addWishlistProductToCart(
                        product
                      )
                    }
                  >
                    <ShoppingBag
                      data-icon="inline-start"
                    />
                    Add to cart
                  </Button>

                </div>
              </article>
            ))}

          </div>
        )}

      </div>
    </main>
  )
}