'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Pause, Play, Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveSetting } from '@/lib/actions/settings'
import { createConsultationPromotion, updateConsultationPromotionStatus } from '@/lib/actions/consultation-commerce'

export type ConsultationPricing = {
  baseFee: string
  currency: string
  taxRate: string
  taxInclusive: boolean
  holdMinutes: number
  terms: string
}

export type ConsultationPromotion = {
  id: string
  name: string
  code: string | null
  discountType: string
  discountValue: string
  maxDiscount: string | null
  serviceTypes: unknown
  audience: string
  startsAt: string | null
  endsAt: string | null
  totalUsageLimit: number | null
  perCustomerLimit: number
  status: string
  stackable: boolean
  createdAt: string
  updatedAt: string
}

const INITIAL_PROMOTION = {
  name: '',
  code: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscount: '',
  serviceTypes: '',
  audience: 'all',
  startsAt: '',
  endsAt: '',
  totalUsageLimit: '',
  perCustomerLimit: '1',
  status: 'draft',
}

function formatPromotion(row: ConsultationPromotion) {
  const value = Number(row.discountValue)
  const amount = row.discountType === 'percentage' ? `${value}% off` : `${new Intl.NumberFormat('en-UG').format(value)} UGX off`
  return `${amount}${row.code ? ` · ${row.code}` : ''}`
}

function serviceTypes(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').join(', ') : 'All consultation services'
}

export default function ConsultationCommerceClient({ initialPricing, initialPromotions }: { initialPricing: ConsultationPricing; initialPromotions: ConsultationPromotion[] }) {
  const router = useRouter()
  const [pricing, setPricing] = useState(initialPricing)
  const [promotion, setPromotion] = useState(INITIAL_PROMOTION)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<'pricing' | 'promotion' | null>(null)
  const [isPending, startTransition] = useTransition()

  function savePricing() {
    setError('')
    startTransition(async () => {
      const response = await saveSetting('consultation_pricing', { ...pricing, baseFee: pricing.baseFee, taxRate: pricing.taxRate, currency: pricing.currency.toUpperCase() })
      if (!response.success) setError(response.error || 'Could not save consultation pricing.')
      else {
        setSaved('pricing')
        setTimeout(() => setSaved(null), 2000)
      }
    })
  }

  function createPromotion() {
    setError('')
    startTransition(async () => {
      const response = await createConsultationPromotion(promotion)
      if (!response.success) setError(response.error || 'Could not create promotion.')
      else {
        setSaved('promotion')
        setPromotion(INITIAL_PROMOTION)
        router.refresh()
        setTimeout(() => setSaved(null), 2000)
      }
    })
  }

  function changePromotionStatus(id: string, status: string) {
    setError('')
    startTransition(async () => {
      const response = await updateConsultationPromotionStatus(id, status)
      if (!response.success) setError(response.error || 'Could not update promotion.')
      else router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border/70 bg-card p-6 shadow-soft sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] uppercase tracking-[0.22em] text-primary">Consultation commerce</p><h2 className="mt-2 font-serif text-3xl font-light text-foreground">Pricing that stays clear.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Set the current fee and tax treatment. Each future payment saves a pricing snapshot, so historic invoices never change when you update these settings.</p></div><span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-primary">Tax-inclusive</span></div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><div><label htmlFor="consultation-fee" className="mb-2 block text-sm font-medium text-foreground">Default fee</label><Input id="consultation-fee" inputMode="decimal" value={pricing.baseFee} onChange={(event) => setPricing((value) => ({ ...value, baseFee: event.target.value }))} className="min-h-11 rounded-none" /></div><div><label htmlFor="consultation-currency" className="mb-2 block text-sm font-medium text-foreground">Currency</label><Input id="consultation-currency" value={pricing.currency} onChange={(event) => setPricing((value) => ({ ...value, currency: event.target.value.toUpperCase().slice(0, 3) }))} className="min-h-11 rounded-none" /></div><div><label htmlFor="consultation-tax-rate" className="mb-2 block text-sm font-medium text-foreground">Included tax rate (%)</label><Input id="consultation-tax-rate" inputMode="decimal" value={pricing.taxRate} onChange={(event) => setPricing((value) => ({ ...value, taxRate: event.target.value }))} className="min-h-11 rounded-none" /></div><div><label htmlFor="consultation-hold-minutes" className="mb-2 block text-sm font-medium text-foreground">Payment hold (minutes)</label><Input id="consultation-hold-minutes" inputMode="numeric" value={String(pricing.holdMinutes)} onChange={(event) => setPricing((value) => ({ ...value, holdMinutes: Number(event.target.value) || 15 }))} className="min-h-11 rounded-none" /></div></div>
        <label className="mt-5 flex min-h-11 items-center gap-3 text-sm text-foreground"><input type="checkbox" checked={pricing.taxInclusive} onChange={(event) => setPricing((value) => ({ ...value, taxInclusive: event.target.checked }))} className="size-4" />Price shown to clients includes tax.</label>
        <label htmlFor="consultation-terms" className="mt-5 block text-sm font-medium text-foreground">Checkout terms</label><textarea id="consultation-terms" value={pricing.terms} onChange={(event) => setPricing((value) => ({ ...value, terms: event.target.value }))} rows={3} className="mt-2 w-full rounded-none border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
        <Button type="button" disabled={isPending} onClick={savePricing} className="mt-5 min-h-11 rounded-none bg-primary text-primary-foreground hover:bg-primary/90">{saved === 'pricing' ? <Check className="mr-2 size-4" /> : <Save className="mr-2 size-4" />}{saved === 'pricing' ? 'Saved' : 'Save consultation pricing'}</Button>
      </section>

      <section className="rounded-xl border border-border/70 bg-card p-6 shadow-soft sm:p-7">
        <div><p className="text-[10px] uppercase tracking-[0.22em] text-primary">Promotion campaigns</p><h2 className="mt-2 font-serif text-3xl font-light text-foreground">Make room for the right offer.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Campaigns are validated again on the server at checkout. Codes are non-stackable by default and cannot reduce the payable amount below zero.</p></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div><label htmlFor="promotion-name" className="mb-2 block text-sm font-medium text-foreground">Campaign name</label><Input id="promotion-name" value={promotion.name} onChange={(event) => setPromotion((value) => ({ ...value, name: event.target.value }))} placeholder="Welcome to the studio" className="min-h-11 rounded-none" /></div><div><label htmlFor="promotion-code" className="mb-2 block text-sm font-medium text-foreground">Promo code (optional)</label><Input id="promotion-code" value={promotion.code} onChange={(event) => setPromotion((value) => ({ ...value, code: event.target.value.toUpperCase() }))} placeholder="WELCOME20" className="min-h-11 rounded-none uppercase" /></div><div><label htmlFor="promotion-type" className="mb-2 block text-sm font-medium text-foreground">Discount type</label><select id="promotion-type" value={promotion.discountType} onChange={(event) => setPromotion((value) => ({ ...value, discountType: event.target.value }))} className="min-h-11 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground"><option value="percentage">Percentage</option><option value="fixed">Fixed UGX amount</option></select></div><div><label htmlFor="promotion-value" className="mb-2 block text-sm font-medium text-foreground">Discount value</label><Input id="promotion-value" inputMode="decimal" value={promotion.discountValue} onChange={(event) => setPromotion((value) => ({ ...value, discountValue: event.target.value }))} placeholder={promotion.discountType === 'percentage' ? '20' : '50000'} className="min-h-11 rounded-none" /></div><div><label htmlFor="promotion-max" className="mb-2 block text-sm font-medium text-foreground">Maximum discount (optional)</label><Input id="promotion-max" inputMode="decimal" value={promotion.maxDiscount} onChange={(event) => setPromotion((value) => ({ ...value, maxDiscount: event.target.value }))} placeholder="For percentage campaigns" className="min-h-11 rounded-none" /></div><div><label htmlFor="promotion-services" className="mb-2 block text-sm font-medium text-foreground">Service categories</label><Input id="promotion-services" value={promotion.serviceTypes} onChange={(event) => setPromotion((value) => ({ ...value, serviceTypes: event.target.value }))} placeholder="interior_design, architecture" className="min-h-11 rounded-none" /></div><div><label htmlFor="promotion-audience" className="mb-2 block text-sm font-medium text-foreground">Audience</label><select id="promotion-audience" value={promotion.audience} onChange={(event) => setPromotion((value) => ({ ...value, audience: event.target.value }))} className="min-h-11 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground"><option value="all">Everyone</option><option value="new_customer">New clients</option><option value="returning_customer">Returning clients</option><option value="members">Members</option></select></div><div><label htmlFor="promotion-status" className="mb-2 block text-sm font-medium text-foreground">Initial status</label><select id="promotion-status" value={promotion.status} onChange={(event) => setPromotion((value) => ({ ...value, status: event.target.value }))} className="min-h-11 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground"><option value="draft">Draft</option><option value="active">Active now</option><option value="scheduled">Scheduled</option></select></div><div><label htmlFor="promotion-total-limit" className="mb-2 block text-sm font-medium text-foreground">Total uses (optional)</label><Input id="promotion-total-limit" inputMode="numeric" value={promotion.totalUsageLimit} onChange={(event) => setPromotion((value) => ({ ...value, totalUsageLimit: event.target.value }))} placeholder="Unlimited" className="min-h-11 rounded-none" /></div><div><label htmlFor="promotion-per-client" className="mb-2 block text-sm font-medium text-foreground">Uses per client</label><Input id="promotion-per-client" inputMode="numeric" value={promotion.perCustomerLimit} onChange={(event) => setPromotion((value) => ({ ...value, perCustomerLimit: event.target.value }))} className="min-h-11 rounded-none" /></div><div><label htmlFor="promotion-start" className="mb-2 block text-sm font-medium text-foreground">Starts at (optional)</label><Input id="promotion-start" type="datetime-local" value={promotion.startsAt} onChange={(event) => setPromotion((value) => ({ ...value, startsAt: event.target.value }))} className="min-h-11 rounded-none" /></div><div><label htmlFor="promotion-end" className="mb-2 block text-sm font-medium text-foreground">Ends at (optional)</label><Input id="promotion-end" type="datetime-local" value={promotion.endsAt} onChange={(event) => setPromotion((value) => ({ ...value, endsAt: event.target.value }))} className="min-h-11 rounded-none" /></div></div>
        {error && <p role="alert" className="mt-5 rounded border border-rose-300/70 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/40 dark:bg-rose-950/40 dark:text-rose-100">{error}</p>}
        <Button type="button" disabled={isPending} onClick={createPromotion} className="mt-5 min-h-11 rounded-none bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-2 size-4" />{saved === 'promotion' ? 'Promotion created' : 'Create promotion'}</Button>

        <div className="mt-8 space-y-3">{initialPromotions.length === 0 ? <p className="rounded border border-dashed border-border p-5 text-sm text-muted-foreground">No consultation promotions yet. Create a campaign above.</p> : initialPromotions.map((row) => <div key={row.id} className="flex flex-col gap-4 rounded-lg border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-foreground">{row.name}</p><span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{row.status}</span></div><p className="mt-1 text-sm text-muted-foreground">{formatPromotion(row)} · {row.audience.replaceAll('_', ' ')} · {serviceTypes(row.serviceTypes)}</p></div><Button type="button" variant="outline" disabled={isPending} onClick={() => changePromotionStatus(row.id, row.status === 'active' ? 'paused' : 'active')} className="min-h-11 shrink-0 rounded-none">{row.status === 'active' ? <Pause className="mr-2 size-4" /> : <Play className="mr-2 size-4" />}{row.status === 'active' ? 'Pause' : 'Activate'}</Button></div>)}</div>
      </section>
    </div>
  )
}
