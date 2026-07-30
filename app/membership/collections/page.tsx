'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, ShoppingCart, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function MembershipCollections() {
  const [favorites, setFavorites] = useState(new Set<number>())

  const exclusiveCollections = [
    {
      id: 1,
      name: 'Platinum Seating Suite',
      designer: 'Exclusive to Members',
      memberPrice: '3,800 UGX',
      retailPrice: '4,800 UGX',
      discount: '21% off',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=400&fit=crop',
      exclusive: true,
      inStock: true,
    },
    {
      id: 2,
      name: 'Heritage Collection Relaunch',
      designer: 'Limited Edition',
      memberPrice: '2,600 UGX',
      retailPrice: '3,200 UGX',
      discount: '19% off',
      image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=500&h=400&fit=crop',
      exclusive: true,
      inStock: true,
    },
    {
      id: 3,
      name: 'Artisan Textile Collection',
      designer: 'Pre-order - Early Access',
      memberPrice: '1,800 UGX',
      retailPrice: '2,400 UGX',
      discount: '25% off',
      image: 'https://images.unsplash.com/photo-1584622181563-430f63602d4b?w=500&h=400&fit=crop',
      exclusive: true,
      inStock: false,
    },
    {
      id: 4,
      name: 'Urban Steel Accents',
      designer: 'VIP Tier & Above',
      memberPrice: '1,200 UGX',
      retailPrice: '1,500 UGX',
      discount: '20% off',
      image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=500&h=400&fit=crop',
      exclusive: false,
      inStock: true,
    },
  ]

  const toggleFavorite = (id: number) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(id)) {
      newFavorites.delete(id)
    } else {
      newFavorites.add(id)
    }
    setFavorites(newFavorites)
  }

  return (
    <PortalLayout
      title="Exclusive Collections"
      subtitle="Members-only access to limited-edition designs and early releases."
      portalType="membership"
    >
      <div className="space-y-8">
        {/* Membership Tier Info */}
        <div className="bg-gradient-to-r from-gold/10 to-primary/10 border border-gold/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <p className="text-sm font-medium text-gold uppercase tracking-wider">Your Membership Level</p>
          </div>
          <p className="text-foreground font-light">
            You&apos;re a <span className="font-medium">Silver Member</span> — enjoy 15% off all member collections and early access to new releases.
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {exclusiveCollections.map(item => (
            <div
              key={item.id}
              className="border border-border/20 rounded-lg overflow-hidden hover:border-primary/20 transition-colors"
            >
              <div className="relative h-48 overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform"
                />
                {item.exclusive && (
                  <div className="absolute top-3 right-3 bg-gold text-obsidian px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Exclusive
                  </div>
                )}
                {!item.inStock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-light text-sm">Coming Soon</span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-gold uppercase tracking-wider mb-1">{item.designer}</p>
                  <h3 className="font-serif text-lg font-light text-foreground">{item.name}</h3>
                </div>

                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Member Price:</span>
                    <span className="font-semibold ml-2 text-primary">{item.memberPrice}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="line-through">{item.retailPrice}</span>
                    <span className="ml-2 text-gold font-medium">{item.discount}</span>
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none gap-2"
                    disabled={!item.inStock}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {item.inStock ? 'Add to Cart' : 'Notify Me'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(item.id)}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        favorites.has(item.id) ? 'fill-primary text-primary' : 'text-muted-foreground'
                      }`}
                    />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  )
}
