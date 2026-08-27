'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Package, Clock, CheckCircle2, Truck, Loader2, MapPin, RefreshCw } from 'lucide-react'
import PickupStationMap from '@/components/delivery/pickup-station-map'
import { SHIPMENT_STATUS_LABELS, type ShipmentStatus } from '@/lib/logistics/status'

type TrackedItem = {
  name: string
  quantity: number
  unitPrice: number
  currency: string
  image: string
  color?: unknown
  fabric?: unknown
  material?: unknown
  variant?: unknown
  accessories?: unknown
  dimensions?: unknown
  configuration?: unknown
}

type TrackedOrder = {
  orderNumber: string
  status: string
  paymentStatus: string | null
  paymentMode?: string | null
  paymentMethod?: string | null
  refundStatus?: string | null
  cancellationReason?: string | null
  createdAt: string | Date
  updatedAt: string | Date
  items: TrackedItem[]
  deliveryAddress: Record<string, unknown>
  currency: string
  subtotal: string | number
  totalAmount: string | number
  shipment?: {
    id: string
    trackingCode: string
    status: ShipmentStatus
    lastNote: string | null
    events: Array<{ id: string; status: ShipmentStatus; note: string | null; createdAt: string | Date }>
  } | null
}

const STATUS_STEPS = [
  { key: 'paid', label: 'Paid', icon: Clock, statuses: ['pending', 'confirmed', 'completed', 'processing', 'shipped', 'delivered'] },
  { key: 'processing', label: 'Processing', icon: Package, statuses: ['processing', 'shipped', 'delivered'] },
  { key: 'shipped', label: 'Shipped', icon: Truck, statuses: ['shipped', 'delivered'] },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, statuses: ['delivered'] },
]

function money(value: string | number, currency: string) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value) || 0)
}

function statusLabel(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function dateLabel(value: string | Date) {
  return new Date(value).toLocaleString('en-UG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Kampala' })
}

function addressLines(address: Record<string, unknown>) {
  return ['name', 'address', 'addressLine1', 'addressLine2', 'city', 'district', 'phone']
    .map((key) => ({ key, value: typeof address[key] === 'string' ? address[key] as string : '' }))
    .filter((entry) => entry.value.trim())
}

export default function TrackOrderPage() {
  const [orderRef, setOrderRef] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('ref') || '')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<TrackedOrder | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTrack = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setOrder(null)
    try {
      const params = new URLSearchParams({ ref: orderRef.trim(), email: email.trim() })
      const response = await fetch(`/api/orders/details?${params.toString()}`, { cache: 'no-store' })
      const data = await response.json().catch(() => null) as { order?: TrackedOrder; error?: string } | null
      if (!response.ok || !data?.order) throw new Error(data?.error || 'Order not found. Please check your reference and purchase email.')
      setOrder(data.order)
    } catch (trackError) {
      setError(trackError instanceof Error ? trackError.message : 'Failed to locate order.')
    } finally {
      setLoading(false)
    }
  }

  const address = order ? addressLines(order.deliveryAddress) : []
  const currentStatus = order?.status?.toLowerCase() || ''
  const shipment = order?.shipment || null
  const pickup = order?.deliveryAddress?.deliveryMethod === 'pickup_station' && order.deliveryAddress.pickupStation && typeof order.deliveryAddress.pickupStation === 'object' ? order.deliveryAddress.pickupStation as Record<string, unknown> : null

  return <div className="flex min-h-screen flex-col bg-background"><SiteHeader /><main className="mx-auto w-full max-w-4xl flex-grow px-4 pb-16 pt-24 sm:px-6"><div className="mb-8 text-center"><p className="text-[10px] uppercase tracking-[0.28em] text-primary">Order care</p><h1 className="mt-3 mb-2 font-serif text-3xl font-light sm:text-4xl">Track your order</h1><p className="text-sm text-muted-foreground">Enter the order reference and purchase email used at checkout.</p></div><div className="mb-8 border border-border bg-card p-6 sm:p-8"><form onSubmit={handleTrack} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="orderRef" className="text-xs uppercase tracking-wider">Order reference</Label><Input id="orderRef" required placeholder="e.g. REV-172400-98" value={orderRef} onChange={(event) => setOrderRef(event.target.value)} className="h-11 rounded-none" /></div><div className="space-y-2"><Label htmlFor="email" className="text-xs uppercase tracking-wider">Purchase email</Label><Input id="email" type="email" required placeholder="your@email.com" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 rounded-none" /></div></div><Button type="submit" disabled={loading} className="h-11 w-full rounded-none bg-primary text-xs uppercase tracking-widest text-primary-foreground">{loading ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <Search className="mr-2 size-4" aria-hidden="true" />}{loading ? 'Finding order' : 'Find order'}</Button></form>{error && <p role="alert" className="mt-4 border border-destructive/20 bg-destructive/10 p-3 text-center text-xs text-destructive">{error}</p>}</div>{order && <div className="space-y-5"><section className="space-y-6 border border-border bg-card p-6"><div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center"><div><p className="text-xs uppercase text-muted-foreground">Order reference</p><p className="font-mono font-bold text-foreground">{order.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">Placed {dateLabel(order.createdAt)}</p></div><div className="sm:text-right"><p className="text-xs uppercase text-muted-foreground">Current status</p><span className="mt-1 inline-block border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-bold uppercase text-primary">{shipment ? SHIPMENT_STATUS_LABELS[shipment.status] : statusLabel(currentStatus)}</span><p className="mt-1 text-xs text-muted-foreground">Updated {dateLabel(order.updatedAt)}</p></div></div><div className="grid grid-cols-2 gap-3 text-center text-xs sm:grid-cols-4">{STATUS_STEPS.map((step) => { const Icon = step.icon; const complete = step.statuses.includes(currentStatus) || (shipment?.status === 'ready_for_pickup' && step.key === 'shipped') || (shipment?.status === 'collected' && step.key !== 'paid'); return <div key={step.key} className={`border p-3 ${complete ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}><Icon className="mx-auto mb-1 size-5" aria-hidden="true" />{step.label}</div> })}</div>{shipment && <div className="rounded-lg border border-border/70 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Tracking code</p><p className="mt-1 font-mono text-sm text-primary">{shipment.trackingCode}</p></div><button type="button" onClick={() => { setOrder(null); void handleTrack({ preventDefault: () => undefined } as React.FormEvent) }} className="inline-flex min-h-10 items-center gap-2 rounded border border-border px-3 text-xs font-semibold uppercase tracking-[0.12em] text-foreground"><RefreshCw className="size-3.5" aria-hidden="true" /> Refresh</button></div><div className="mt-5 space-y-4 border-l border-primary/30 pl-4">{shipment.events.map((event) => <div key={event.id} className="relative"><span className="absolute -left-[1.32rem] top-1 size-2.5 rounded-full bg-primary" /><p className="text-sm font-medium text-foreground">{SHIPMENT_STATUS_LABELS[event.status]}</p><p className="mt-0.5 text-xs text-muted-foreground">{dateLabel(event.createdAt)}{event.note ? ` · ${event.note}` : ''}</p></div>)}</div>{shipment.lastNote && <p className="mt-4 rounded bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">{shipment.lastNote}</p>}</div>}</section><section className="border border-border bg-card p-6"><div className="flex items-center gap-2 border-b border-border pb-4"><Package className="size-4 text-primary" aria-hidden="true" /><h2 className="font-serif text-2xl">Items in this order</h2></div><div className="divide-y divide-border">{order.items.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-center gap-3 py-4"><img src={item.image} alt="" loading="lazy" className="size-14 rounded bg-muted object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">Quantity: {item.quantity}</p></div><p className="shrink-0 text-sm font-medium text-foreground">{money(item.unitPrice * item.quantity, item.currency || order.currency)}</p></div>)}{order.items.length === 0 && <p className="py-6 text-sm text-muted-foreground">Item details are not available for this order.</p>}</div><div className="mt-4 flex justify-between border-t border-border pt-4 text-sm"><span className="text-muted-foreground">Order total</span><strong className="text-foreground">{money(order.totalAmount, order.currency)}</strong></div><div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2"><p>Payment: <span className="font-medium text-foreground">{order.paymentMode === 'pay_on_delivery' ? 'Pay on delivery' : `Pay now${order.paymentMethod ? ` · ${order.paymentMethod === 'mobile_money' ? 'Mobile money' : 'Card'}` : ''}`}</span></p><p>Refund status: <span className="font-medium text-foreground">{statusLabel(order.refundStatus || 'not_requested')}</span></p></div></section>{pickup ? <section className="border border-border bg-card p-6"><div className="mb-4 flex items-center gap-2 border-b border-border pb-4"><MapPin className="size-4 text-primary" aria-hidden="true" /><h2 className="font-serif text-2xl">Pickup station</h2></div><div className="space-y-2 text-sm text-muted-foreground"><p className="font-medium text-foreground">{String(pickup.name || 'Pickup station')}</p><p>{String(pickup.address || '')}</p><p>{String(pickup.city || '')}{pickup.region ? ` · ${String(pickup.region)}` : ''}</p>{typeof pickup.instructions === 'string' && pickup.instructions && <p className="text-xs text-primary">{pickup.instructions}</p>}</div><div className="mt-5"><PickupStationMap stations={[{ id: String(pickup.id || order.orderNumber), name: String(pickup.name || 'Pickup station'), address: String(pickup.address || ''), city: String(pickup.city || ''), region: typeof pickup.region === 'string' ? pickup.region : null, phone: typeof pickup.phone === 'string' ? pickup.phone : null, instructions: null, latitude: typeof pickup.latitude === 'number' || typeof pickup.latitude === 'string' ? pickup.latitude : null, longitude: typeof pickup.longitude === 'number' || typeof pickup.longitude === 'string' ? pickup.longitude : null }]} selectedId={String(pickup.id || order.orderNumber)} selectable={false} /></div></section> : address.length > 0 && <section className="border border-border bg-card p-6"><div className="flex items-center gap-2 border-b border-border pb-4"><MapPin className="size-4 text-primary" aria-hidden="true" /><h2 className="font-serif text-2xl">Delivery details</h2></div><div className="mt-4 space-y-2 text-sm text-muted-foreground">{address.map((entry) => <p key={entry.key} className="capitalize">{entry.value}</p>)}</div></section>}<section className="flex flex-wrap gap-3 border border-border bg-card p-6"><p className="w-full text-sm leading-6 text-muted-foreground">To cancel an eligible order or request a refund, sign in to the client portal so we can verify ownership.</p><Button asChild className="min-h-11 rounded-none"><Link href="/client/orders">Manage this order</Link></Button><Button asChild variant="outline" className="min-h-11 rounded-none"><Link href="/refund-policy">View policy</Link></Button></section></div>}</main><SiteFooter /></div>
}
