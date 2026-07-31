'use client'

import { useState } from 'react'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, Download, Eye } from 'lucide-react'

export default function TradeCollections() {
  const [favorites, setFavorites] = useState(new Set<number>())

  const collections = [
    {
      id: 1,
      name: 'Savannah Modular Sofa',
      category: 'Seating',
      wholePrice: '4,200 UGX',
      minOrder: '2 units',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=400&fit=crop',
      inStock: true,
    },
    {
      id: 2,
      name: 'Coastal Dining Set',
      category: 'Dining',
      wholePrice: '2,800 UGX',
      minOrder: '1 set',
      image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=500&h=400&fit=crop',
      inStock: true,
    },
    {
      id: 3,
      name: 'Heritage Mirror Collection',
      category: 'Decor',
      wholePrice: '1,200 UGX',
      minOrder: '4 pieces',
      image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=500&h=400&fit=crop',
      inStock: true,
    },
    {
      id: 4,
      name: 'Urban Steel Shelving',
      category: 'Storage',
      wholePrice: '3,500 UGX',
      minOrder: '1 unit',
      image: 'https://images.unsplash.com/photo-1595521624749-9b5e9c1c3b5f?w=500&h=400&fit=crop',
      inStock: false,
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
      portalName="Wholesale Partner"
      portalSlug="trade"
      navItems={[
        { label: 'Dashboard', href: '/trade' },
        { label: 'Collections', href: '/trade/collections' },
        { label: 'Orders', href: '/trade/orders' },
        { label: 'Pricing', href: '/trade/pricing' },
        { label: 'Resources', href: '/trade/resources' },
      ]}
    >
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground mb-2">Wholesale Collections</h1>
          <p className="text-lg text-muted-foreground">Browse our curated wholesale collections with special trade pricing.</p>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">All Categories</Badge>
          <Badge variant="outline">Seating</Badge>
          <Badge variant="outline">Dining</Badge>
          <Badge variant="outline">Decor</Badge>
          <Badge variant="outline">Storage</Badge>
        </div>

        {/* Collections Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map(item => (
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
                {!item.inStock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-light text-sm">Out of Stock</span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-primary/70 uppercase tracking-wider mb-1">{item.category}</p>
                  <h3 className="font-serif text-lg font-light text-foreground">{item.name}</h3>
                </div>

                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Wholesale Price:</span>
                    <span className="font-semibold ml-2 text-primary">{item.wholePrice}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Minimum Order: {item.minOrder}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={!item.inStock}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Details
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
