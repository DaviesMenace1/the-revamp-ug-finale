'use client'

import { useState, useMemo } from 'react'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Badge } from '@/components/ui/badge'
import { Package } from 'lucide-react'

const tradeNavItems = [
  { label: 'Dashboard', href: '/trade' },
  { label: 'Collections', href: '/trade/collections' },
  { label: 'Wholesale Pricing', href: '/trade/pricing' },
  { label: 'Orders', href: '/trade/orders' },
  { label: 'Resources', href: '/trade/resources' },
]

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

type Order = {
  id: string
  orderNumber: string
  total: string
  status: string | null
  createdAt: string
  items: any[]
}

export default function TradeOrdersClient({ orders = [] }: { orders: Order[] }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return orders
    if (filter === 'completed') return orders.filter((o) => o.status === 'delivered')
    return orders.filter((o) => o.status === filter)
  }, [orders, filter])

  return (
    <PortalLayout portalName="Trade Portal" portalSlug="trade" navItems={tradeNavItems}>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">Orders</h1>
          <p className="text-muted-foreground">Track your wholesale orders and shipments.</p>
        </div>

        <div className="flex gap-2">
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-medium transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {filtered.map((order) => (
            <div key={order.id} className="rounded-lg border border-border/20 p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-foreground">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge>{order.status ?? 'pending'}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{order.items.length} item(s)</p>
              <p className="text-lg font-medium text-foreground">{formatCurrency(order.total)}</p>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-border/40 p-12 text-center">
              <Package className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No orders in this view yet.</p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}