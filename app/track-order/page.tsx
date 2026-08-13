'use client'

import React, { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Package, Clock, CheckCircle2, Truck, Loader2 } from 'lucide-react'

export default function TrackOrderPage() {
  const [orderRef, setOrderRef] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setOrder(null)

    try {
      const res = await fetch(`/api/orders/details?ref=${orderRef.trim()}`)
      const data = await res.json()

      if (!res.ok || !data.order) {
        throw new Error('Order not found. Please check your reference code.')
      }

      if (data.order.userEmail.toLowerCase() !== email.trim().toLowerCase()) {
        throw new Error('Email address does not match this order reference.')
      }

      setOrder(data.order)
    } catch (err: any) {
      setError(err.message || 'Failed to locate order.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-grow pt-24 pb-16 px-4 max-w-3xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-light mb-2">Track Your Order</h1>
          <p className="text-muted-foreground text-sm">
            Enter your order reference number and purchase email below.
          </p>
        </div>

        {/* Form Card */}
        <div className="border border-border bg-card p-6 sm:p-8 mb-8">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderRef" className="text-xs uppercase tracking-wider">Order Ref #</Label>
                <Input
                  id="orderRef"
                  required
                  placeholder="e.g. REV-172400-98"
                  value={orderRef}
                  onChange={(e) => setOrderRef(e.target.value)}
                  className="rounded-none h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-none h-11"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground h-11 rounded-none uppercase tracking-widest text-xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Find Order
            </Button>
          </form>

          {error && (
            <p className="mt-4 text-xs text-destructive bg-destructive/10 p-3 border border-destructive/20 text-center">
              {error}
            </p>
          )}
        </div>

        {/* Order Status Display */}
        {order && (
          <div className="border border-border bg-card p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Order Ref</p>
                <p className="font-mono font-bold">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase">Current Status</p>
                <span className="inline-block mt-1 text-xs uppercase font-bold px-2 py-0.5 border bg-primary/10 text-primary border-primary/20">
                  {order.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
              <div className={`p-3 border ${['pending', 'completed', 'processing', 'shipped', 'delivered'].includes(order.status) ? 'border-primary text-primary' : 'text-muted-foreground'}`}>
                <Clock className="w-5 h-5 mx-auto mb-1" /> Paid
              </div>
              <div className={`p-3 border ${['processing', 'shipped', 'delivered'].includes(order.status) ? 'border-primary text-primary' : 'text-muted-foreground'}`}>
                <Package className="w-5 h-5 mx-auto mb-1" /> Processing
              </div>
              <div className={`p-3 border ${['shipped', 'delivered'].includes(order.status) ? 'border-primary text-primary' : 'text-muted-foreground'}`}>
                <Truck className="w-5 h-5 mx-auto mb-1" /> Shipped
              </div>
              <div className={`p-3 border ${order.status === 'delivered' ? 'border-primary text-primary' : 'text-muted-foreground'}`}>
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1" /> Delivered
              </div>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
