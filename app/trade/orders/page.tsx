'use client'

import { useState } from 'react'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Download } from 'lucide-react'

export default function TradeOrders() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const orders = [
    {
      id: 'TRD-2024-001',
      date: 'July 22, 2024',
      items: '15 units - Savannah Sofas',
      total: '63,000 UGX',
      status: 'Delivered',
      statusColor: 'bg-green-500/10 text-green-700',
    },
    {
      id: 'TRD-2024-002',
      date: 'July 15, 2024',
      items: '8 units - Coastal Dining Sets',
      total: '22,400 UGX',
      status: 'In Transit',
      statusColor: 'bg-blue-500/10 text-blue-700',
    },
    {
      id: 'TRD-2024-003',
      date: 'July 10, 2024',
      items: '24 pieces - Heritage Mirrors',
      total: '28,800 UGX',
      status: 'Processing',
      statusColor: 'bg-yellow-500/10 text-yellow-700',
    },
    {
      id: 'TRD-2024-004',
      date: 'June 28, 2024',
      items: '12 units - Urban Shelving',
      total: '42,000 UGX',
      status: 'Delivered',
      statusColor: 'bg-green-500/10 text-green-700',
    },
  ]

  const filteredOrders = orders.filter(order => {
    if (filter === 'pending') return ['In Transit', 'Processing'].includes(order.status)
    if (filter === 'completed') return order.status === 'Delivered'
    return true
  })

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
          <h1 className="font-serif text-4xl font-light text-foreground mb-2">Trade Orders</h1>
          <p className="text-lg text-muted-foreground">Manage your wholesale orders and track shipments.</p>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="rounded-none"
          >
            All Orders
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            className="rounded-none"
          >
            Pending
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
            className="rounded-none"
          >
            Completed
          </Button>
        </div>

        {/* Order List */}
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="border border-border/20 rounded-lg p-6 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                <div>
                  <p className="font-serif text-lg font-light text-foreground">{order.id}</p>
                  <p className="text-sm text-muted-foreground">{order.date}</p>
                </div>
                <Badge className={order.statusColor}>{order.status}</Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Items</p>
                  <p className="text-muted-foreground font-light">{order.items}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</p>
                  <p className="text-lg font-light text-primary">{order.total}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowRight className="w-4 h-4" />
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Invoice
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* New Order CTA */}
        <div className="bg-muted/40 border border-border/20 rounded-lg p-8 text-center">
          <h3 className="font-serif text-2xl font-light text-foreground mb-3">
            Ready to Place an Order?
          </h3>
          <p className="text-muted-foreground font-light mb-6 max-w-xl mx-auto">
            Browse our wholesale collections and build your order. New trade members can get started with a minimum order of 5,000 UGX.
          </p>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none">
            Browse Collections
          </Button>
        </div>
      </div>
    </PortalLayout>
  )
}
