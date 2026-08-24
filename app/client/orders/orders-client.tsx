'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { ArrowUpRight, Package } from 'lucide-react'
import { formatMoney } from '@/lib/utils'

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



export default function OrdersClient({ orders = [], loadError = null }: { orders: Order[]; loadError?: string | null }) {

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-8 pb-8">
        <header className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-8 text-background shadow-lift sm:px-10 sm:py-10"><p className="text-[10px] uppercase tracking-[0.28em] text-gold">Your purchase history</p><h1 className="mt-4 font-serif text-4xl sm:text-6xl">Orders</h1><p className="mt-4 max-w-xl text-sm leading-7 text-background/70">Follow each considered piece from payment through delivery.</p><div className="absolute -right-20 -top-20 size-56 rounded-full border border-gold/25" /></header>

        {loadError && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <span>{loadError}</span>
            <button type="button" onClick={() => window.location.reload()} className="min-h-11 shrink-0 font-medium underline underline-offset-4">Retry</button>
          </div>
        )}

        <div className="grid gap-4">

                    {orders.map((order) => (
            <Card key={order.id} className="rounded-xl border-border/70 bg-card p-5 shadow-soft transition-shadow hover:shadow-lift sm:p-6">

                              <div className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">

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

                            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">

                <Package className="w-4 h-4" />
                {Array.isArray(order.items) ? order.items.length : 0} item(s)
              </div>

                            <div className="mt-4 flex items-end justify-between gap-4 border-t border-border/70 pt-4"><div><p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Order total</p><p className="mt-1 font-serif text-3xl text-foreground">{formatMoney(order.total, 'UGX')}</p></div><ArrowUpRight className="size-4 text-primary" /></div>

            </Card>
          ))}

          {orders.length === 0 && (
                        <div className="flex flex-col items-center rounded-xl border border-dashed border-border/40 p-12 text-center">

              <Package className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
