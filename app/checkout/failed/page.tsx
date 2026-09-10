'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, RefreshCw, XCircle } from '@/components/ui/luxury-icons'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

function FailedContent() {
  const params = useSearchParams()
  const message = params.get('message') || 'The payment was not completed. Your cart is still available so you can try again.'
  return <main className="flex min-h-[70dvh] items-center justify-center bg-canvas px-5 py-24 sm:px-8"><div className="w-full max-w-xl rounded-xl border border-border/70 bg-card p-8 text-center shadow-editorial sm:p-12"><span className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"><XCircle className="size-7" aria-hidden="true" /></span><p className="mt-7 text-[10px] uppercase tracking-[0.28em] text-primary">Payment not completed</p><h1 className="mt-3 font-serif text-4xl font-light text-foreground sm:text-5xl">Let’s try that again.</h1><p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">{message}</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/checkout" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground"><RefreshCw className="size-4" aria-hidden="true" /> Return to checkout</Link><Link href="/cart" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border px-5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground"><ArrowLeft className="size-4" aria-hidden="true" /> Review cart</Link></div></div></main>
}

export default function CheckoutFailedPage() {
  return <div className="min-h-screen bg-background"><SiteHeader /><Suspense fallback={<main className="min-h-[70dvh]" />}><FailedContent /></Suspense><SiteFooter /></div>
}
