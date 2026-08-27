'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Clock3, Sparkles, Tag } from 'lucide-react'

export type PublicPromotion = {
  id: string
  name: string
  code: string
  discountType: string
  discountValue: string
  maxDiscount: string | null
  serviceTypes: unknown
  audience: string
  startsAt: string | null
  endsAt: string | null
}

function discountLabel(promotion: PublicPromotion) {
  const value = Number(promotion.discountValue)
  if (!Number.isFinite(value)) return 'Special consultation offer'
  if (promotion.discountType === 'fixed') return `Save UGX ${value.toLocaleString('en-UG', { maximumFractionDigits: 0 })}`
  const cap = Number(promotion.maxDiscount)
  return Number.isFinite(cap) && cap > 0
    ? `Save ${value.toLocaleString('en-UG', { maximumFractionDigits: 0 })}% up to UGX ${cap.toLocaleString('en-UG', { maximumFractionDigits: 0 })}`
    : `Save ${value.toLocaleString('en-UG', { maximumFractionDigits: 0 })}%`
}

function audienceLabel(audience: string) {
  if (audience === 'new_customer') return 'For new clients'
  if (audience === 'returning_customer') return 'For returning clients'
  return 'Available now'
}

function expiryLabel(endsAt: string | null) {
  if (!endsAt) return 'While the offer is active'
  const date = new Date(endsAt)
  if (Number.isNaN(date.getTime())) return 'Limited-time offer'
  return `Offer ends ${date.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

export default function PromotionBanner({ compact = false }: { compact?: boolean }) {
  const [promotions, setPromotions] = useState<PublicPromotion[]>([])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 5000)
    fetch('/api/promotions/consultations', { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<{ promotions?: PublicPromotion[] }> : { promotions: [] })
      .then((payload) => setPromotions(Array.isArray(payload.promotions) ? payload.promotions.slice(0, 3) : []))
      .catch(() => undefined)
      .finally(() => window.clearTimeout(timer))
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [])

  if (promotions.length === 0) return null

  return (
    <section aria-label="Current promotions" className={`relative overflow-hidden border-y border-primary/20 bg-foreground text-background ${compact ? 'py-5' : 'py-8 sm:py-10'}`}>
      <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 size-64 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
          <div>
            <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-primary"><Sparkles className="size-3.5" aria-hidden="true" /> Studio offers</p>
            <h2 className="mt-2 font-serif text-2xl font-light sm:text-3xl">A little more value for your next conversation.</h2>
          </div>
          <p className="max-w-xs text-xs leading-5 text-background/65">Use a live promotion code when booking a consultation. Eligibility is checked again at checkout.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promotion) => (
            <article key={promotion.id} className="group flex min-h-44 flex-col justify-between rounded-xl border border-background/15 bg-background/10 p-5 backdrop-blur transition-transform hover:-translate-y-1 hover:border-primary/60">
              <div>
                <div className="flex items-start justify-between gap-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-foreground"><Tag className="size-3" aria-hidden="true" /> {discountLabel(promotion)}</span><span className="text-right text-[10px] uppercase tracking-[0.12em] text-background/60">{audienceLabel(promotion.audience)}</span></div>
                <h3 className="mt-4 font-serif text-xl font-light">{promotion.name}</h3>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-background/65"><Clock3 className="size-3.5" aria-hidden="true" /> {expiryLabel(promotion.endsAt)}</p>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-background/15 pt-4"><code className="rounded bg-background/10 px-2.5 py-1.5 text-xs font-semibold tracking-[0.12em] text-primary">{promotion.code}</code><a href={`/book-consultation?promo=${encodeURIComponent(promotion.code)}`} className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-background transition-colors hover:text-primary">Use offer <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></a></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
