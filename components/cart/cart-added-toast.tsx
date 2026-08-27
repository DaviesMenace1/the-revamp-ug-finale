'use client'

import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'
import { formatMoney, normalizeCurrency } from '@/lib/utils'

export type CartToastData = {
  name: string
  image?: string
  quantity: number
  options: string[]
  currency?: string
}

export function CartAddedToast({ data, itemCount, cartTotal, currency = 'UGX', onDismiss }: { data: CartToastData; itemCount: number; cartTotal: number; currency?: string; onDismiss: () => void }) {
  return (
    <div className="fixed inset-x-4 bottom-4 z-[100] mx-auto w-auto max-w-sm rounded-xl border border-border bg-card p-3 text-card-foreground shadow-lift sm:left-auto sm:right-5 sm:inset-x-auto sm:w-[22rem]" role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
          <Image src={data.image || '/brand/revamp-logo.png'} alt="" fill sizes="56px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">Added to cart</p>
              <p className="mt-1 line-clamp-2 text-sm font-medium leading-5">{data.name}</p>
            </div>
            <button type="button" onClick={onDismiss} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Dismiss cart notification">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Quantity: {data.quantity} · {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart</p>
          {data.options.length > 0 && <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{data.options.join(' · ')}</p>}
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
            <span className="text-xs font-semibold tabular-nums">{formatMoney(cartTotal, normalizeCurrency(data.currency || currency))}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onDismiss} className="min-h-9 rounded border border-border px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-primary">Continue shopping</button>
              <Link href="/cart" onClick={onDismiss} className="inline-flex min-h-9 items-center rounded bg-primary px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-foreground transition-colors hover:bg-primary/90">View cart</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
