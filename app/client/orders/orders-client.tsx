'use client'

import { useMemo, useState } from 'react'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { CalendarDays, CheckCircle2, Clock, MapPin, Package, Search, Truck, X } from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import { getOrderItemOptionLines } from '@/lib/orders/order-item-options'

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
  confirmed: 'bg-emerald-100 text-emerald-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-muted text-muted-foreground',
}

const STATUS_STEPS = [
  { key: 'paid', label: 'Paid', icon: Clock, statuses: ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] },
  { key: 'processing', label: 'Processing', icon: Package, statuses: ['processing', 'shipped', 'delivered'] },
  { key: 'shipped', label: 'Shipped', icon: Truck, statuses: ['shipped', 'delivered'] },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, statuses: ['delivered'] },
]

type OrderItem = {
  name?: string
  title?: string
  quantity?: number
  price?: number | string
  unitPrice?: number | string
  image?: string
}

type Order = {
  id: string
  orderNumber: string
  total: string
  status: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  deliveryAddress?: Record<string, unknown> | null
}

type DateFilter = 'all' | '30' | '90' | '365'

function statusLabel(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('en-UG', { dateStyle: 'medium', timeZone: 'Africa/Kampala' })
}

function addressLines(address: Record<string, unknown> | null | undefined) {
  if (!address) return []
  return ['name', 'address', 'addressLine1', 'addressLine2', 'city', 'district', 'phone']
    .map((key) => ({ key, value: typeof address[key] === 'string' ? address[key] as string : '' }))
    .filter((entry) => entry.value.trim())
}

export default function OrdersClient({ orders = [], loadError = null }: { orders: Order[]; loadError?: string | null }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [now] = useState(() => Date.now())

  const statuses = useMemo(() => Array.from(new Set(orders.map((order) => order.status || 'pending'))).sort(), [orders])
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()
    const cutoff = dateFilter === 'all' ? null : now - Number(dateFilter) * 24 * 60 * 60 * 1000
    return orders.filter((order) => {
      const matchesSearch = !query || order.orderNumber.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'all' || (order.status || 'pending') === statusFilter
      const matchesDate = cutoff === null || new Date(order.createdAt).getTime() >= cutoff
      return matchesSearch && matchesStatus && matchesDate
    })
  }, [dateFilter, now, orders, search, statusFilter])

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || null
  const selectedStatus = selectedOrder?.status?.toLowerCase() || 'pending'
  const selectedAddress = addressLines(selectedOrder?.deliveryAddress)

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-8 pb-8">
        <header className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-8 text-background shadow-lift sm:px-10 sm:py-10">
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold">Your purchase history</p>
          <h1 className="mt-4 font-serif text-4xl sm:text-6xl">Orders</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-background/70">Browse every order, filter your history, and track the exact order you want without memorising a reference number.</p>
          <div className="absolute -right-20 -top-20 size-56 rounded-full border border-gold/25" />
        </header>

        {loadError && <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><span>{loadError}</span><button type="button" onClick={() => window.location.reload()} className="min-h-11 shrink-0 font-medium underline underline-offset-4">Retry</button></div>}

        <section aria-label="Filter all orders" className="rounded-xl border border-border/70 bg-card p-4 shadow-soft sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="min-w-0 flex-1"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Search orders</span><span className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order reference" className="min-h-11 w-full rounded border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" /></span></label>
            <label className="lg:w-48"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-11 w-full rounded border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"><option value="all">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label>
            <label className="lg:w-48"><span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Date range</span><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)} className="min-h-11 w-full rounded border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"><option value="all">Any date</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option></select></label>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground"><span>{filteredOrders.length} of {orders.length} orders shown</span>{(search || statusFilter !== 'all' || dateFilter !== 'all') && <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); setDateFilter('all') }} className="font-medium text-primary underline underline-offset-4">Clear filters</button>}</div>
        </section>

        {selectedOrder && (
          <section aria-label={`Tracking details for ${selectedOrder.orderNumber}`} className="scroll-mt-6 rounded-xl border border-primary/40 bg-card p-5 shadow-lift sm:p-7">
            <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] uppercase tracking-[0.2em] text-primary">Tracking this order</p><h2 className="mt-2 font-serif text-3xl text-foreground">{selectedOrder.orderNumber}</h2><p className="mt-1 text-xs text-muted-foreground">Placed {dateLabel(selectedOrder.createdAt)} · Updated {dateLabel(selectedOrder.updatedAt)}</p></div><button type="button" onClick={() => setSelectedOrderId(null)} className="inline-flex min-h-10 items-center gap-2 self-start rounded border border-border px-3 text-xs font-semibold uppercase tracking-[0.12em] text-foreground hover:border-gold">Close <X className="size-4" /></button></div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{STATUS_STEPS.map((step) => { const Icon = step.icon; const complete = step.statuses.includes(selectedStatus); return <div key={step.key} className={`border p-3 text-center text-xs ${complete ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}><Icon className="mx-auto mb-1 size-5" />{step.label}</div> })}</div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div><h3 className="font-serif text-2xl text-foreground">Order items</h3><div className="mt-3 divide-y divide-border">{selectedOrder.items.map((item, index) => { const itemName = item.name || item.title || 'Product'; const quantity = Math.max(1, Number(item.quantity || 1)); const price = Number(item.unitPrice ?? item.price ?? 0); const optionLines = getOrderItemOptionLines(item); return <div key={`${itemName}-${index}`} className="flex items-start gap-3 py-3"><img src={item.image || '/brand/revamp-logo.png'} alt="" className="size-12 shrink-0 rounded bg-muted object-cover" /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground">{itemName}</p>{optionLines.length > 0 && <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">{optionLines.map((line) => <p key={line}>{line}</p>)}</div>}<p className="mt-1 text-xs text-muted-foreground">Quantity: {quantity}</p></div><p className="shrink-0 text-sm font-medium text-foreground">{formatMoney(String(price * quantity), 'UGX')}</p></div> })}{selectedOrder.items.length === 0 && <p className="py-4 text-sm text-muted-foreground">Item details are not available.</p>}</div><div className="mt-3 flex justify-between border-t border-border pt-4 text-sm"><span className="text-muted-foreground">Order total</span><strong className="text-foreground">{formatMoney(selectedOrder.total, 'UGX')}</strong></div></div>
              <div><h3 className="flex items-center gap-2 font-serif text-2xl text-foreground"><MapPin className="size-4 text-primary" /> Delivery details</h3>{selectedAddress.length > 0 ? <div className="mt-3 space-y-2 text-sm text-muted-foreground">{selectedAddress.map((entry) => <p key={entry.key}>{entry.value}</p>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Delivery details are not available for this order.</p>}<p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="size-3" />Last updated {dateLabel(selectedOrder.updatedAt)}</p></div>
            </div>
          </section>
        )}

        <section aria-label="All orders" className="space-y-4">
          <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.2em] text-primary">Track all orders</p><h2 className="mt-1 font-serif text-3xl text-foreground">Your orders</h2></div><span className="text-xs text-muted-foreground">Select any order to view its tracking</span></div>
          <div className="grid gap-4">
            {filteredOrders.map((order) => { const status = order.status || 'pending'; const isSelected = order.id === selectedOrderId; return <Card key={order.id} className={`rounded-xl border-border/70 bg-card p-5 shadow-soft transition-shadow hover:shadow-lift sm:p-6 ${isSelected ? 'border-primary/60 ring-1 ring-primary/20' : ''}`}><div className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-foreground">{order.orderNumber}</p><p className="text-sm text-muted-foreground">{dateLabel(order.createdAt)}</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[status] || 'bg-muted text-muted-foreground'}`}>{statusLabel(status)}</span></div><div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Package className="size-4" />{Array.isArray(order.items) ? order.items.length : 0} item(s)</div><div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-border/70 pt-4"><div><p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Order total</p><p className="mt-1 font-serif text-3xl text-foreground">{formatMoney(order.total, 'UGX')}</p></div><button type="button" onClick={() => setSelectedOrderId(order.id)} className="inline-flex min-h-11 items-center gap-2 rounded border border-border px-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground hover:border-gold hover:text-primary"><Truck className="size-4" />{isSelected ? 'Tracking open' : 'Track this order'}</button></div></Card> })}
            {filteredOrders.length === 0 && <div className="flex flex-col items-center rounded-xl border border-dashed border-border/40 p-12 text-center"><Package className="mb-3 size-8 text-muted-foreground" /><p className="font-serif text-2xl text-foreground">No matching orders</p><p className="mt-2 text-sm text-muted-foreground">Try another reference, status, or date range.</p></div>}
          </div>
        </section>
      </div>
    </PortalLayout>
  )
}
