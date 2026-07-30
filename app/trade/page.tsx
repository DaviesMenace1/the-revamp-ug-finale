'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { TrendingUp, DollarSign, Package, Download } from 'lucide-react'

const tradeNavItems = [
  { label: 'Dashboard', href: '/trade' },
  { label: 'Collections', href: '/trade/collections' },
  { label: 'Wholesale Pricing', href: '/trade/pricing' },
  { label: 'Orders', href: '/trade/orders' },
  { label: 'Resources', href: '/trade/resources' },
]

export default function TradeDashboard() {
  return (
    <PortalLayout
      portalName="Trade Portal"
      portalSlug="trade"
      navItems={tradeNavItems}
    >
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">
            Trade Portal
          </h1>
          <p className="text-muted-foreground">
            Access wholesale collections, pricing, and exclusive resources for design professionals.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6 border-border/20">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Orders</p>
              <p className="font-serif text-4xl font-light text-primary">24</p>
            </div>
          </Card>
          <Card className="p-6 border-border/20">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">YTD Savings</p>
              <p className="font-serif text-4xl font-light text-primary">$18.5K</p>
            </div>
          </Card>
          <Card className="p-6 border-border/20">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending Orders</p>
              <p className="font-serif text-4xl font-light text-primary">3</p>
            </div>
          </Card>
          <Card className="p-6 border-border/20">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Available Credits</p>
              <p className="font-serif text-4xl font-light text-primary">$5.2K</p>
            </div>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/trade/collections"
            className="p-6 border border-border/20 rounded-lg hover:border-primary/20 hover:bg-primary/5 transition-all"
          >
            <Package className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-medium text-foreground mb-1">Browse Collections</h3>
            <p className="text-sm text-muted-foreground">View all wholesale products and exclusive lines</p>
          </Link>
          <Link
            href="/trade/pricing"
            className="p-6 border border-border/20 rounded-lg hover:border-primary/20 hover:bg-primary/5 transition-all"
          >
            <DollarSign className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-medium text-foreground mb-1">Pricing & Discounts</h3>
            <p className="text-sm text-muted-foreground">Check tiered pricing and volume discounts</p>
          </Link>
          <Link
            href="/trade/resources"
            className="p-6 border border-border/20 rounded-lg hover:border-primary/20 hover:bg-primary/5 transition-all"
          >
            <Download className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-medium text-foreground mb-1">Resources</h3>
            <p className="text-sm text-muted-foreground">Download spec sheets, catalogs, and guides</p>
          </Link>
        </div>

        {/* Featured Collections */}
        <div className="space-y-4">
          <h2 className="font-serif text-2xl font-light text-foreground">Featured Collections</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Contemporary Living', items: 45, discount: '20%' },
              { name: 'Heritage Furniture', items: 32, discount: '18%' },
              { name: 'Outdoor Collections', items: 28, discount: '15%' },
            ].map(collection => (
              <Card key={collection.name} className="p-6 border-border/20">
                <div className="space-y-3">
                  <h3 className="font-medium text-foreground">{collection.name}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{collection.items} items</span>
                    <span className="text-primary font-medium">Save {collection.discount}</span>
                  </div>
                  <Link href={`/trade/collections/${collection.name.toLowerCase().replace(/ /g, '-')}`} className="text-sm text-primary hover:text-primary/80">
                    View →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
