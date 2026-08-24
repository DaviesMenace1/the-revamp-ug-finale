'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { Package, DollarSign } from 'lucide-react'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Support', href: '/client/tickets' },
  { label: 'Documents', href: '/client/documents' },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-muted text-muted-foreground',
}

type Order = {
  id: string
  orderNumber: string
  total: string
  status: string | null
  createdAt: string
  items: any[]
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export default function OrdersClient({ orders = [], loadError = null }: { orders: Order[]; loadError?: string | null }) {

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">Orders</h1>
                    <p className="text-muted-foreground">Track and manage all your furniture and décor orders.</p>
        </div>

        {loadError && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <span>{loadError}</span>
            <button type="button" onClick={() => window.location.reload()} className="min-h-11 shrink-0 font-medium underline underline-offset-4">Retry</button>
          </div>
        )}

        <div className="grid gap-4">

          {orders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-foreground">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    STATUS_COLORS[order.status ?? 'pending']
                  }`}
                >
                  {order.status ?? 'pending'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Package className="w-4 h-4" />
                {Array.isArray(order.items) ? order.items.length : 0} item(s)
              </div>

              <div className="flex items-center gap-2 text-lg font-medium text-foreground">
                <DollarSign className="w-4 h-4" />
                {formatCurrency(order.total)}
              </div>
            </Card>
          ))}

          {orders.length === 0 && (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-border/40 p-12 text-center">
              <Package className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
