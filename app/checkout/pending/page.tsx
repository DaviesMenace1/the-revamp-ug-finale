'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, RefreshCw, ShoppingBag } from 'lucide-react'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { useCart } from '@/lib/context/cart-context'

function PendingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { clearCart } = useCart()
  const orderRef = searchParams.get('orderRef')?.trim() || ''
  const initialMessage = searchParams.get('message')?.trim() || 'Your payment is still being confirmed.'
  const [status, setStatus] = useState<'checking' | 'pending' | 'failed' | 'error'>(orderRef ? 'checking' : 'error')
  const [message, setMessage] = useState(orderRef ? initialMessage : 'No order reference was provided. Return to checkout and try again.')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!orderRef) return

    let cancelled = false
    let timer: number | undefined
    let attempts = 0

    const checkPayment = async () => {
      attempts += 1
      if (!cancelled) setAttempt(attempts)

      try {
        await fetch(`/api/orders/reconcile?ref=${encodeURIComponent(orderRef)}`, { cache: 'no-store' })
        const response = await fetch(`/api/orders/details?ref=${encodeURIComponent(orderRef)}`, { cache: 'no-store' })
        const payload = await response.json().catch(() => null) as { order?: { paymentStatus?: string; status?: string }; error?: string } | null
        const paymentStatus = payload?.order?.paymentStatus
        const orderStatus = payload?.order?.status

        if (paymentStatus === 'completed') {
          clearCart()
          router.replace(`/checkout/success?orderRef=${encodeURIComponent(orderRef)}`)
          return
        }

        if (paymentStatus === 'failed' || orderStatus === 'cancelled') {
          if (!cancelled) {
            setStatus('failed')
            setMessage('This payment was not completed. Your saved cart is still available so you can try again.')
          }
          return
        }

        if (!cancelled) {
          setStatus(attempts < 12 ? 'checking' : 'pending')
          setMessage(payload?.error || 'The payment is still being confirmed. We will keep checking for a short time.')
        }

        if (!cancelled && attempts < 12) timer = window.setTimeout(checkPayment, 5000)
      } catch {
        if (!cancelled) {
          setStatus(attempts < 12 ? 'checking' : 'error')
          setMessage('We could not check the payment right now. You can retry without losing your saved cart.')
          if (attempts < 12) timer = window.setTimeout(checkPayment, 5000)
        }
      }
    }

    void checkPayment()
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [clearCart, orderRef, router])

  return (
    <main className="flex min-h-[70dvh] items-center justify-center px-4 py-24 sm:px-6">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 text-center shadow-lift sm:p-10" aria-live="polite">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          {status === 'checking' ? <Loader2 className="size-8 animate-spin" aria-label="Checking payment" /> : status === 'failed' || status === 'error' ? <RefreshCw className="size-8" aria-hidden="true" /> : <ShoppingBag className="size-8" aria-hidden="true" />}
        </div>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">Payment update</p>
        <h1 className="mt-3 font-serif text-4xl text-foreground">{status === 'failed' ? 'Payment not completed' : status === 'error' ? 'We could not confirm it yet' : 'Confirming your payment'}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">{message}</p>
        {orderRef && <p className="mt-5 text-xs text-muted-foreground">Order reference: <span className="font-mono text-foreground">{orderRef}</span></p>}
        {status === 'checking' && <p className="mt-3 text-xs text-muted-foreground">Check {attempt} of 12. Please keep this page open.</p>}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {(status === 'pending' || status === 'error' || status === 'failed') && <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-border px-5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary"><RefreshCw className="size-4" aria-hidden="true" /> Check again</button>}
          <Link href="/cart" className="inline-flex min-h-11 items-center justify-center rounded bg-primary px-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90">Return to cart</Link>
        </div>
      </section>
    </main>
  )
}

export default function CheckoutPendingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Suspense fallback={<main className="flex min-h-[70dvh] items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" aria-label="Loading payment status" /></main>}>
        <PendingContent />
      </Suspense>
      <SiteFooter />
    </div>
  )
}
