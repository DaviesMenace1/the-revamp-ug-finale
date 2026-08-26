'use client'

import React, { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Package, Clock, CheckCircle2, Truck, Loader2, MapPin } from 'lucide-react'

type TrackedItem = {
  name: string
  quantity: number
  unitPrice: number
  currency: string
  image: string
}

type TrackedOrder = {
  orderNumber: string
  status: string
  paymentStatus: string | null
  createdAt: string | Date
  updatedAt: string | Date
  items: TrackedItem[]
  deliveryAddress: Record<string, unknown>
  currency: string
  subtotal: string | number
  totalAmount: string | number
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
      const data = await response.json() as { order?: TrackedOrder; error?: string }
      if (!response.ok || !data.order) throw new Error(data.error || 'Order not found. Please check your reference and purchase email.')
      setOrder(data.order)
    } catch (trackError) {
      setError(trackError instanceof Error ? trackError.message : 'Failed to locate order.')
    } finally {
      setLoading(false)
    }
  }

  const address = order ? addressLines(order.deliveryAddress) : []
  const currentStatus = order?.status?.toLowerCase() || ''

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-grow pt-24 pb-16 px-4 max-w-3xl mx-auto w-full">
        <div className="text-center mb-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-primary">Order care</p>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-light mb-2">Track Your Order</h1>
          <p className="text-muted-foreground text-sm">Enter the order reference and purchase email used at checkout.</p>
        </div>

        <div className="border border-border bg-card p-6 sm:p-8 mb-8">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderRef" className="text-xs uppercase tracking-wider">Order Ref #</Label>
                <Input id="orderRef" required placeholder="e.g. REV-172400-98" value={orderRef} onChange={(event) => setOrderRef(event.target.value)} className="rounded-none h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider">Purchase Email</Label>
                <Input id="email" type="email" required placeholder="your@email.com" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-none h-11" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground h-11 rounded-none uppercase tracking-widest text-xs">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              {loading ? 'Finding order…' : 'Find Order'}
            </Button>
          </form>
          {error && <p role="alert" className="mt-4 text-xs text-destructive bg-destructive/10 p-3 border border-destructive/20 text-center">{error}</p>}
        </div>

        {order && (
          <div className="space-y-5">
            <section className="border border-border bg-card p-6 space-y-6">
              <div className="flex flex-col gap-4 pb-4 border-b border-border sm:flex-row sm:justify-between sm:items-center">
                <div><p className="text-xs text-muted-foreground uppercase">Order Ref</p><p className="font-mono font-bold text-foreground">{order.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">Placed {dateLabel(order.createdAt)}</p></div>
                <div className="sm:text-right"><p className="text-xs text-muted-foreground uppercase">Current Status</p><span className="inline-block mt-1 text-xs uppercase font-bold px-2 py-1 border bg-primary/10 text-primary border-primary/20">{statusLabel(currentStatus)}</span><p className="mt-1 text-xs text-muted-foreground">Updated {dateLabel(order.updatedAt)}</p></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                {STATUS_STEPS.map((step) => { const Icon = step.icon; const complete = step.statuses.includes(currentStatus); return <div key={step.key} className={`p-3 border ${complete ? 'border-primary text-primary bg-primary/5' : 'text-muted-foreground border-border'}`}><Icon className="w-5 h-5 mx-auto mb-1" />{step.label}</div> })}
              </div>
            </section>

            <section className="border border-border bg-card p-6">
              <div className="flex items-center gap-2 border-b border-border pb-4"><Package className="size-4 text-primary" /><h2 className="font-serif text-2xl">Items in this order</h2></div>
              <div className="divide-y divide-border">
                {order.items.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-center gap-3 py-4"><img src={item.image} alt="" className="size-14 rounded object-cover bg-muted" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">Quantity: {item.quantity}</p></div><p className="shrink-0 text-sm font-medium text-foreground">{money(item.unitPrice * item.quantity, item.currency || order.currency)}</p></div>)}
                {order.items.length === 0 && <p className="py-6 text-sm text-muted-foreground">Item details are not available for this order.</p>}
              </div>
              <div className="mt-4 flex justify-between border-t border-border pt-4 text-sm"><span className="text-muted-foreground">Order total</span><strong className="text-foreground">{money(order.totalAmount, order.currency)}</strong></div>
            </section>

            {address.length > 0 && <section className="border border-border bg-card p-6"><div className="flex items-center gap-2 border-b border-border pb-4"><MapPin className="size-4 text-primary" /><h2 className="font-serif text-2xl">Delivery details</h2></div><div className="mt-4 space-y-2 text-sm text-muted-foreground">{address.map((entry) => <p key={entry.key} className="capitalize">{entry.value}</p>)}</div></section>}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
