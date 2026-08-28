'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Clock3, Tag } from 'lucide-react'

export type PublicPromotion = {
  id: string
  name: string
  code: string
  discountType: string
  discountValue: string
  maxDiscount: string | null
  kind: 'collection' | 'consultation'
  audience: string
  startsAt: string | null
  endsAt: string | null
  scopeLabel: string
  href: string
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
  if (audience === 'new_customer') return 'New clients'
  if (audience === 'returning_customer') return 'Returning clients'
  if (audience === 'members') return 'Members'
  return 'Available now'
}

function offerLabel(promotion: PublicPromotion) {
  const value = Number(promotion.discountValue)
  const amount = promotion.discountType === 'fixed'
    ? Number.isFinite(value) ? `UGX ${value.toLocaleString('en-UG', { maximumFractionDigits: 0 })} off` : 'a special offer'
    : Number.isFinite(value) ? `${value.toLocaleString('en-UG', { maximumFractionDigits: 0 })}% discount` : 'a special offer'
  const subject = promotion.kind === 'consultation'
    ? promotion.audience === 'new_customer' ? 'your first consultation booking' : promotion.audience === 'returning_customer' ? 'your next consultation booking' : 'your consultation booking'
    : promotion.audience === 'new_customer' ? 'your first order' : promotion.scopeLabel.toLowerCase()
  const cap = Number(promotion.maxDiscount)
  const capLabel = promotion.discountType !== 'fixed' && Number.isFinite(cap) && cap > 0
    ? `, up to UGX ${cap.toLocaleString('en-UG', { maximumFractionDigits: 0 })}`
    : ''
  return `Get ${amount} on ${subject}${capLabel}`
}

function expiryLabel(endsAt: string | null) {
  if (!endsAt) return ''
  const date = new Date(endsAt)
  if (Number.isNaN(date.getTime())) return ''
  return `Ends ${date.toLocaleDateString('en-UG', { day: 'numeric', month: 'short' })}`
}

export default function PromotionBanner() {
  const [promotions, setPromotions] = useState<PublicPromotion[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 5000)
    fetch('/api/promotions/active', { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<{ promotions?: PublicPromotion[] }> : { promotions: [] })
      .then((payload) => setPromotions(Array.isArray(payload.promotions) ? payload.promotions.slice(0, 3) : []))
      .catch(() => undefined)
      .finally(() => window.clearTimeout(timer))
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (paused || promotions.length < 2) return
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % promotions.length), 6000)
    return () => window.clearInterval(timer)
  }, [paused, promotions.length])

  if (promotions.length === 0) return null

  const promotion = promotions[activeIndex] || promotions[0]
  const previous = () => setActiveIndex((index) => (index - 1 + promotions.length) % promotions.length)
  const next = () => setActiveIndex((index) => (index + 1) % promotions.length)
  const expiry = expiryLabel(promotion.endsAt)

  return (
    <div className="border-b border-primary/30 bg-foreground text-background" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="mx-auto flex min-h-12 max-w-[1440px] items-center gap-1 px-2 sm:px-4 lg:px-12">
        {promotions.length > 1 && <button type="button" onClick={previous} className="flex size-11 shrink-0 items-center justify-center text-background/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Previous promotion"><ArrowLeft className="size-4" aria-hidden="true" /></button>}
        <div key={promotion.id} className="min-w-0 flex-1 text-center" aria-live="polite">
          <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.16em]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary"><Tag className="size-3.5" aria-hidden="true" />{discountLabel(promotion)}</span>
            <span className="hidden truncate text-background/85 sm:inline">{offerLabel(promotion)}</span>
            <span className="hidden items-center gap-1 text-background/60 md:inline-flex"><Clock3 className="size-3" aria-hidden="true" />{expiry || promotion.scopeLabel || audienceLabel(promotion.audience)}</span>
          </div>
          <p className="mt-0.5 truncate text-[10px] text-background/70 sm:hidden">{offerLabel(promotion)}</p>
        </div>
        <a href={`${promotion.href}?promo=${encodeURIComponent(promotion.code)}`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-background transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-3 sm:text-xs">Use code <span className="rounded border border-primary/50 px-1.5 py-1 font-mono text-[10px] tracking-normal text-primary">{promotion.code}</span></a>
        {promotions.length > 1 && <button type="button" onClick={next} className="flex size-11 shrink-0 items-center justify-center text-background/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Next promotion"><ArrowRight className="size-4" aria-hidden="true" /></button>}
      </div>
      {promotions.length > 1 && <div className="flex justify-center gap-1 pb-1" aria-label={`${activeIndex + 1} of ${promotions.length} promotions`} role="group">{promotions.map((item, index) => <button key={item.id} type="button" aria-pressed={index === activeIndex} aria-label={`Show promotion ${index + 1}`} onClick={() => setActiveIndex(index)} className={`h-1 rounded-full transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${index === activeIndex ? 'w-5 bg-primary' : 'w-1 bg-background/40'}`} />)}</div>}
    </div>
  )
}
