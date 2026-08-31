'use client'

import { useState } from 'react'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Badge } from '@/components/ui/badge'
import { Heart, Sparkles, Package } from '@/components/ui/luxury-icons'

const membershipNavItems = [
  { label: 'Dashboard', href: '/membership' },
  { label: 'Collections', href: '/membership/collections' },
  { label: 'Events', href: '/membership/events' },
  { label: 'Community', href: '/membership/community' },
  { label: 'Benefits', href: '/membership/benefits' },
]

function formatCurrency(value: number, currency = 'UGX') {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0)
}

type Product = {
  id: string
  slug: string
  name: string
  price: number
  originalPrice: number | null
  currency: string
  image: string | null
}

export default function MembershipCollectionsClient({ products = [] }: { products: Product[] }) {
  const [favorites, setFavorites] = useState(new Set<string>())

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <PortalLayout portalName="VIP Membership" portalSlug="membership" navItems={membershipNavItems}>
      <div className="space-y-8">
        <div className="space-y-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">Exclusive Collections</h1>
            <p className="text-muted-foreground">Curated pieces featured for our members.</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="rounded-lg border border-border/20 overflow-hidden group">
              <div className="relative aspect-square bg-muted">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <Badge className="absolute top-2 left-2 bg-gold text-obsidian">Exclusive</Badge>
                <button
                  onClick={() => toggleFavorite(product.id)}
                  className="absolute top-2 right-2 rounded-full bg-background/90 p-2"
                >
                  <Heart
                    className={`h-4 w-4 ${favorites.has(product.id) ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'}`}
                  />
                </button>
              </div>

              <div className="p-4">
                <p className="text-sm font-medium text-foreground">{product.name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-primary">
                    {formatCurrency(product.price, product.currency)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatCurrency(product.originalPrice, product.currency)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 flex flex-col items-center rounded-lg border border-dashed border-border/40 p-12 text-center">
              <Sparkles className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No exclusive pieces are featured yet. Check back soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
