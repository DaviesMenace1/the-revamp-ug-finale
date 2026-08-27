'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/context/cart-context'
import { formatMoney, normalizeCurrency } from '@/lib/utils'
import {
  CheckCircle2,
  Package,
  MapPin,
  Mail,
  Printer,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react'

function parseObject(value: unknown): Record<string, any> {
  if (typeof value !== 'string') return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, any> : {}
  } catch {
    return {}
  }
}

function parseItems(value: unknown): any[] {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderRef = searchParams.get('orderRef')
  const { clearCart } = useCart()

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(Boolean(orderRef))
  const [loadError, setLoadError] = useState<string | null>(orderRef ? null : 'This confirmation link is missing an order reference.')

  // Fetch the order first; the cart is cleared only after the server confirms payment.
  useEffect(() => {
    const reference = orderRef || ''
    if (!reference) return

    async function fetchOrderDetails() {
      try {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const reconciliationResponse = await fetch(`/api/orders/reconcile?ref=${encodeURIComponent(reference)}`, { cache: 'no-store' })
          const reconciliation = await reconciliationResponse.json().catch(() => null) as { status?: string; success?: boolean; error?: string } | null
          if (reconciliation?.status === 'paid' && reconciliation.success !== false) clearCart()
          const res = await fetch(`/api/orders/details?ref=${encodeURIComponent(reference)}`, { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            const orderData = data?.order
            const isPayOnDelivery = orderData?.paymentMode === 'pay_on_delivery'
            const isConfirmedPayOnDelivery = isPayOnDelivery && ['confirmed', 'processing', 'shipped', 'delivered'].includes(String(orderData?.status || ''))
            if (orderData?.paymentStatus === 'completed' || isConfirmedPayOnDelivery) {
              setOrder(orderData)
              setLoadError(null)
              clearCart()
              return
            }
            if (orderData?.paymentStatus === 'failed' || orderData?.status === 'cancelled') {
              setLoadError('This payment was not completed, so no successful receipt is shown. Please return to checkout and try again.')
              return
            }
          }
          if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 1000))
        }
        setLoadError('We could not load the confirmed order details yet. Your payment was not changed. Please retry this view in a moment.')
      } catch (error) {
        console.error('Failed to load order details:', error)
        setLoadError('We could not load the confirmed order details yet. Your payment was not changed. Please retry this view in a moment.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [clearCart, orderRef])

  if (loading) {
    return (
      <div className="text-center py-24">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground font-sans">
          Confirming payment & retrieving receipt...
        </p>
      </div>
    )
  }

  const deliveryAddress = order?.deliveryAddress ? parseObject(order.deliveryAddress) : null
  const items = parseItems(order?.items)
  const isPayOnDelivery = order?.paymentMode === 'pay_on_delivery'

  if (loadError || !order) {
    return (
      <div className="mx-auto max-w-xl py-24 text-center">
        <div className="rounded-xl border border-amber-300/70 bg-amber-50 p-6 text-amber-950 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-50">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em]">The Revamp UG</p>
          <h1 className="mt-3 font-serif text-3xl">Your order is still being confirmed.</h1>
          <p className="mt-3 text-sm leading-6">{loadError || 'We are retrieving your order details. Your payment was not changed.'}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 min-h-11 rounded bg-amber-950 px-4 text-sm font-medium text-white dark:bg-amber-200 dark:text-amber-950">Retry confirmation</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header Banner */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full mb-4">
          <CheckCircle2 className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground mb-2">
          Thank You For Your Order!
        </h1>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {isPayOnDelivery ? 'Your order has been confirmed. Payment is due when your order is delivered or collected. A confirmation email has been sent to ' : 'We’ve received your payment and sent a receipt confirmation email to '}{' '}

          <span className="text-foreground font-medium">{order?.userEmail || 'your email'}</span>.
        </p>
      </div>

      {/* Printable Order Card */}
      <div className="bg-card border border-border p-6 sm:p-10 shadow-sm space-y-8 print:shadow-none print:border-none">
        {/* Order Meta Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Order Reference</p>
            <p className="font-mono text-lg font-bold text-foreground mt-0.5">
              {orderRef || order?.orderNumber || 'N/A'}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{isPayOnDelivery ? 'Order Date' : 'Date Paid'}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {order?.createdAt
                ? new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : new Date().toLocaleDateString('en-US')}
            </p>
          </div>
        </div>

          {/* Delivery & Payment Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          {/* Delivery details */}
          <div className="space-y-2 p-4 bg-muted/30 border border-border">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" /> {deliveryAddress?.deliveryMethod === 'pickup_station' ? 'Pickup Station' : 'Delivery Address'}

            </p>
            {deliveryAddress ? (
              <div className="space-y-0.5 text-foreground text-xs leading-relaxed">
                <p className="font-semibold text-sm">{deliveryAddress.deliveryMethod === 'pickup_station' ? deliveryAddress.pickupStation?.name || 'Pickup station' : deliveryAddress.name}</p>
                <p>{deliveryAddress.deliveryMethod === 'pickup_station' ? deliveryAddress.pickupStation?.address || deliveryAddress.address : deliveryAddress.address}</p>
                <p>
                  {deliveryAddress.city}{deliveryAddress.region ? ` · ${deliveryAddress.region}` : ''}, {deliveryAddress.country}
                </p>
                <p className="text-muted-foreground pt-1">{deliveryAddress.phone}</p>
                {deliveryAddress.deliveryMethod === 'pickup_station' && deliveryAddress.pickupStation?.instructions && <p className="pt-1 text-primary">{deliveryAddress.pickupStation.instructions}</p>}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Standard Delivery</p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2 p-4 bg-muted/30 border border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" /> Payment Summary
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method:</span>
                <span className="font-medium text-foreground">{isPayOnDelivery ? 'Pay on delivery' : 'Flutterwave'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`${isPayOnDelivery ? 'text-amber-700 bg-amber-500/10 border-amber-500/20' : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'} font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 border`}>
                  {isPayOnDelivery ? 'Payment due at fulfilment' : 'Paid / Confirmed'}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border/50 text-sm font-semibold">
                <span>{isPayOnDelivery ? 'Total Due:' : 'Total Amount:'}</span>
                <span className="font-mono text-primary">
                  {formatMoney(order?.totalAmount || 0, normalizeCurrency(order?.currency))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Purchased Items List */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-primary" /> Purchased Items ({items.length})
          </p>
          <div className="border border-border divide-y divide-border">
            {items.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground text-center">
                Order details confirmed. Check email for line item specifics.
              </p>
            ) : (
              items.map((item: any, idx: number) => (
                <div key={item.cartItemId || item.productId || item.id || `${item.name || 'item'}-${idx}`} className="p-4 flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <div className="relative w-12 h-12 bg-muted border border-border shrink-0 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name || 'Purchased product'}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>

                      {/* Customization Details */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.color && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 border text-muted-foreground">
                            Color: {item.color}
                          </span>
                        )}
                        {item.material && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 border text-muted-foreground">
                            Material: {item.material}
                          </span>
                        )}
                        {item.dimensions && (
                          <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 border border-gold/20 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            {item.dimensions.width}″W × {item.dimensions.height}″H
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono font-medium">
                    {formatMoney(Number(item.unitPrice ?? item.price ?? 0) * Number(item.quantity || 0), normalizeCurrency(item.currency || order?.currency))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Print & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border print:hidden">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="w-full sm:w-auto rounded-none uppercase tracking-widest text-xs h-11 px-6 border-border"
          >
            <Printer className="w-4 h-4 mr-2" /> Print Receipt
          </Button>

          <Button
            asChild
            className="w-full sm:w-auto rounded-none uppercase tracking-widest text-xs h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/collections">
              Continue Shopping <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="text-center py-24">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground font-sans">Loading receipt...</p>
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
