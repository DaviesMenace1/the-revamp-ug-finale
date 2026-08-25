'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check, Clock3, MapPin, Video } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import ConsultationNotificationPrompt from '@/components/notifications/consultation-notification-prompt'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const MODE_META: Record<string, { label: string; icon: LucideIcon; detail: string }> = {
  virtual: { label: 'Virtual consultation', icon: Video, detail: 'A private video call with the studio.' },
  in_person: { label: 'In-person consultation', icon: MapPin, detail: 'Meet with the studio at your project location.' },
  showroom: { label: 'Showroom consultation', icon: Building2, detail: 'A guided session at The Revamp showroom.' },
}

type Slot = {
  id: string
  startTime: string
  durationMinutes: number
  mode: string
}

type BookingForm = {
  title: string
  serviceType: string
  budget: string
  description: string
}

type Pricing = {
  baseFee: number
  currency: string
  taxRate: number
  taxInclusive: boolean
  terms: string
}

type Quote = {
  baseFee: number
  discount: number
  tax: number
  total: number
  currency: string
  taxRate: number
  taxInclusive: boolean
  promoCode: string | null
  promoName: string | null
}

type PromoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'applied'; quote: Quote }

type PaymentState = { status: 'success' | 'review' | 'pending'; consultationId?: string; message?: string } | null

const DEFAULT_PRICING: Pricing = {
  baseFee: 200000,
  currency: 'UGX',
  taxRate: 18,
  taxInclusive: true,
  terms: 'Consultation bookings are confirmed after successful payment. Please contact the studio if you need to change your appointment.',
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('en-UG', { weekday: 'long', month: 'long', day: 'numeric' })
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' })
}

function money(value: number, currency: string) {
  return `${new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(Math.max(0, value))} ${currency}`
}

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `00000000-0000-4000-8000-${Math.random().toString(16).slice(2).padEnd(12, '0').slice(0, 12)}`
}

async function readResponse(response: Response) {
  try {
    return await response.json() as Record<string, unknown>
  } catch {
    return {}
  }
}

export default function BookConsultationClient({ slots = [], loadError = null }: { slots: Slot[]; loadError?: string | null }) {
  const router = useRouter()
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [form, setForm] = useState<BookingForm>({ title: '', serviceType: '', budget: '', description: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [paymentState, setPaymentState] = useState<PaymentState>(null)
  const [error, setError] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoState, setPromoState] = useState<PromoState>({ status: 'idle' })
  const [pricing, setPricing] = useState<Pricing>(DEFAULT_PRICING)
  const [idempotencyKey] = useState(createIdempotencyKey)

  useEffect(() => {
    let active = true
    fetch('/api/consultations/pricing', { cache: 'no-store' })
      .then((response) => response.json() as Promise<Pricing>)
      .then((value) => {
        if (!active || !value || typeof value.baseFee !== 'number') return
        setPricing({ ...DEFAULT_PRICING, ...value })
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      const payment = params.get('payment')
      if (!payment) return
      if (payment === 'success') setPaymentState({ status: 'success', consultationId: params.get('consultationId') || undefined })
      if (payment === 'review') setPaymentState({ status: 'review', message: 'Your payment was verified, but the selected time needs studio confirmation. We will contact you shortly.' })
      if (payment === 'pending') setPaymentState({ status: 'pending', message: 'Your payment is still being verified. Please check your client portal shortly.' })
      if (payment === 'failed') setError(params.get('message') || 'Payment was cancelled or failed. Your consultation has not been confirmed.')
      window.history.replaceState({}, document.title, window.location.pathname)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const slotsByDay = useMemo(() => {
    const groups: Record<string, Slot[]> = {}
    for (const slot of slots) {
      const day = dateLabel(slot.startTime)
      if (!groups[day]) groups[day] = []
      groups[day].push(slot)
    }
    return groups
  }, [slots])

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) || null
  const selectedMode = selectedSlot ? MODE_META[selectedSlot.mode] || MODE_META.virtual : null
  const appliedQuote = promoState.status === 'applied' ? promoState.quote : null
  const totalAmount = appliedQuote?.total ?? pricing.baseFee

  function updateForm<K extends keyof BookingForm>(key: K, value: BookingForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    if (key === 'serviceType') setPromoState({ status: 'idle' })
  }

  async function applyPromotion() {
    const code = promoCode.trim()
    if (!code) {
      setPromoState({ status: 'error', message: 'Enter a promotion code first.' })
      return
    }
    setIsApplyingPromo(true)
    setPromoState({ status: 'loading' })
    try {
      const response = await fetch('/api/consultations/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCode: code, serviceType: form.serviceType }),
      })
      const payload = await readResponse(response)
      if (!response.ok) {
        setPromoState({ status: 'error', message: typeof payload.error === 'string' ? payload.error : 'That promotion could not be applied.' })
        return
      }
      setPromoState({
        status: 'applied',
        quote: {
          baseFee: Number(payload.baseFee) || pricing.baseFee,
          discount: Number(payload.discount) || 0,
          tax: Number(payload.tax) || 0,
          total: Number(payload.total) || pricing.baseFee,
          currency: typeof payload.currency === 'string' ? payload.currency : pricing.currency,
          taxRate: Number(payload.taxRate) || pricing.taxRate,
          taxInclusive: payload.taxInclusive !== false,
          promoCode: typeof payload.promoCode === 'string' ? payload.promoCode : code.toUpperCase(),
          promoName: typeof payload.promoName === 'string' ? payload.promoName : null,
        },
      })
    } catch {
      setPromoState({ status: 'error', message: 'We could not check that code. Please try again.' })
    } finally {
      setIsApplyingPromo(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!selectedSlot) {
      setError('Please select an available time and meeting format.')
      return
    }
    if (!form.title.trim()) {
      setError('Please tell us what the consultation is about.')
      return
    }
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/consultations/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          slotId: selectedSlot.id,
          mode: selectedSlot.mode,
          promoCode: promoCode.trim(),
          idempotencyKey,
        }),
      })
      const payload = await readResponse(response)
      if (!response.ok || typeof payload.paymentUrl !== 'string') {
        setError(typeof payload.error === 'string' ? payload.error : 'We could not prepare payment. Please try again.')
        return
      }
      window.location.assign(payload.paymentUrl)
    } catch {
      setError('We could not reach payment securely. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (paymentState?.status === 'success') {
    return (
      <>
        <SiteHeader />
        <main className="flex min-h-[75vh] items-center justify-center bg-background px-5 py-20 sm:px-8">
          <div className="motion-reveal w-full max-w-2xl rounded-2xl border border-border/70 bg-card p-8 text-center shadow-lift sm:p-12">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-gold/15 text-primary"><Check className="size-8" /></span>
            <p className="mt-7 text-[10px] uppercase tracking-[0.28em] text-primary">Payment confirmed</p>
            <h1 className="mt-3 font-serif text-4xl font-light text-foreground sm:text-5xl">Your consultation is confirmed.</h1>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-muted-foreground">Your payment was verified securely. Your appointment, invoice, and paid receipt will be available in your client portal.</p>
            {paymentState.consultationId && <p className="mt-5 text-xs text-muted-foreground">Consultation reference: <span className="font-mono text-foreground">{paymentState.consultationId}</span></p>}
            <Button type="button" onClick={() => router.push('/client/consultations')} className="mt-7 min-h-11 rounded-none px-6 text-xs uppercase tracking-[0.16em]">View my consultation</Button>
          </div>
        </main>
        <SiteFooter />
        <ConsultationNotificationPrompt />
      </>
    )
  }


  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden bg-obsidian px-5 pb-16 pt-36 text-ivory sm:px-8 md:pb-24 md:pt-48 lg:px-16">
          <div className="absolute right-[-12%] top-[-30%] size-[40rem] rounded-full border border-gold/20" aria-hidden="true" />
          <div className="relative mx-auto max-w-[1440px] motion-reveal"><p className="text-[10px] uppercase tracking-[0.3em] text-gold">The Revamp studio / private appointment</p><h1 className="mt-5 max-w-4xl font-serif text-5xl font-light leading-[0.95] sm:text-8xl lg:text-[8rem]">Let’s shape the brief.</h1><p className="mt-7 max-w-2xl text-base leading-7 text-ivory/65 sm:text-lg">Choose how you would like to meet, then give us enough context to make the first conversation useful.</p></div>
        </section>

        <section className="px-5 py-12 sm:px-8 md:py-20 lg:px-16">
          <form onSubmit={handleSubmit} className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="motion-reveal"><p className="text-[10px] uppercase tracking-[0.24em] text-primary">01 / Choose your format</p><h2 className="mt-4 font-serif text-4xl font-light sm:text-5xl">A meeting that suits the project.</h2><p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">Every available slot carries its own meeting format. Select a time to see whether it is virtual, at your project, or at the showroom.</p>{selectedSlot && selectedMode && <div className="mt-8 rounded-xl border border-gold/45 bg-gold/10 p-5"><p className="flex items-center gap-2 text-sm font-medium text-foreground">{(() => { const Icon = selectedMode.icon; return <Icon className="size-4 text-primary" /> })()}{selectedMode.label}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedMode.detail}</p><p className="mt-4 flex items-center gap-2 text-xs text-foreground"><Clock3 className="size-4 text-gold" />{dateLabel(selectedSlot.startTime)} · {timeLabel(selectedSlot.startTime)} · {selectedSlot.durationMinutes} minutes</p></div>}</div>
            <div className="space-y-10">
              <div className="motion-reveal" style={{ animationDelay: '80ms' }}>
                {loadError && <div role="status" className="mb-5 flex flex-col items-start justify-between gap-3 rounded border border-amber-300/70 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-50 sm:flex-row sm:items-center"><span>{loadError}</span><button type="button" onClick={() => window.location.reload()} className="min-h-10 font-medium underline underline-offset-4">Retry</button></div>}
                {Object.keys(slotsByDay).length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-sm leading-7 text-muted-foreground">No consultation slots are currently available. Please check back soon or <a href="/contact" className="text-primary underline underline-offset-4">contact the studio</a> directly.</div> : <div className="space-y-6">{Object.entries(slotsByDay).map(([day, daySlots]) => <div key={day}><p className="mb-3 text-sm font-medium text-foreground">{day}</p><div className="grid gap-2 sm:grid-cols-2">{daySlots.map((slot) => { const meta = MODE_META[slot.mode] || MODE_META.virtual; const Icon = meta.icon; const isSelected = selectedSlotId === slot.id; return <button key={slot.id} type="button" onClick={() => setSelectedSlotId(slot.id)} aria-pressed={isSelected} className={`flex min-h-16 items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground hover:border-primary/60 hover:bg-muted/40'}`}><span className="flex items-center gap-3"><Icon className="size-4 shrink-0" /><span><span className="block text-sm font-medium">{timeLabel(slot.startTime)}</span><span className="mt-1 block text-[10px] uppercase tracking-[0.1em] opacity-70">{meta.label} · {slot.durationMinutes} min</span></span></span>{isSelected && <Check className="size-4" />}</button> })}</div></div>)}</div>}
              </div>

              <div className="motion-reveal space-y-5" style={{ animationDelay: '140ms' }}><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">02 / Tell us about it</p><h2 className="mt-3 font-serif text-3xl font-light">Give the conversation a starting point.</h2></div><div><label htmlFor="consultation-title" className="mb-2 block text-xs font-medium text-foreground">What should we call this project?</label><Input id="consultation-title" placeholder="e.g. Kyanja living room redesign" value={form.title} onChange={(event) => updateForm('title', event.target.value)} className="min-h-12 rounded-none" required /></div><div><label htmlFor="consultation-service" className="mb-2 block text-xs font-medium text-foreground">What would you like help with?</label><select id="consultation-service" name="serviceType" value={form.serviceType} onChange={(event) => updateForm('serviceType', event.target.value)} className="min-h-12 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"><option value="">Choose a service (optional)</option><option value="interior_design">Interior design</option><option value="architecture">Architecture</option><option value="furniture_sourcing">Furniture & object sourcing</option><option value="renovation">Renovation & styling</option><option value="commercial">Commercial or hospitality space</option><option value="other">Something else</option></select></div><div><label htmlFor="consultation-budget" className="mb-2 block text-xs font-medium text-foreground">What is the project range?</label><select id="consultation-budget" name="budget" value={form.budget} onChange={(event) => updateForm('budget', event.target.value)} className="min-h-12 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"><option value="">Choose a range (optional)</option><option value="under_10m">Under UGX 10 million</option><option value="10m_30m">UGX 10–30 million</option><option value="30m_75m">UGX 30–75 million</option><option value="75m_plus">UGX 75 million and above</option><option value="not_sure">I am not sure yet</option></select></div><div><label htmlFor="consultation-description" className="mb-2 block text-xs font-medium text-foreground">What should we know before we meet?</label><Textarea id="consultation-description" placeholder="Tell us about the space, what is not working, and what you would like it to become." value={form.description} onChange={(event) => updateForm('description', event.target.value)} rows={5} className="rounded-none" /></div></div>

              <div className="rounded-xl border border-border/70 bg-card p-5 motion-reveal" style={{ animationDelay: '180ms' }}>
                <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.22em] text-primary">03 / Consultation fee</p><h2 className="mt-2 font-serif text-2xl font-light text-foreground">A clear price before you pay.</h2></div><p className="text-right text-xl font-medium text-foreground">{money(totalAmount, appliedQuote?.currency || pricing.currency)}</p></div>
                <div className="mt-5 space-y-2 border-y border-border/70 py-4 text-sm"><div className="flex justify-between gap-4 text-muted-foreground"><span>Consultation fee</span><span>{money(appliedQuote?.baseFee ?? pricing.baseFee, appliedQuote?.currency || pricing.currency)}</span></div>{appliedQuote && <div className="flex justify-between gap-4 text-primary"><span>{appliedQuote.promoName || appliedQuote.promoCode || 'Promotion'}</span><span>-{money(appliedQuote.discount, appliedQuote.currency)}</span></div>}<div className="flex justify-between gap-4 text-muted-foreground"><span>{pricing.taxInclusive ? `Includes ${pricing.taxRate}% tax` : `Tax ${pricing.taxRate}%`}</span><span>{money(appliedQuote?.tax ?? pricing.baseFee * pricing.taxRate / (100 + pricing.taxRate), appliedQuote?.currency || pricing.currency)}</span></div></div>
                <p className="mt-4 text-xs leading-5 text-muted-foreground">{pricing.taxInclusive ? 'The amount shown is the final amount payable, including tax.' : 'Tax will be calculated at checkout.'} Payment is required before the appointment is confirmed.</p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row"><Input aria-label="Promotion code" placeholder="Promo code (optional)" value={promoCode} onChange={(event) => { setPromoCode(event.target.value); setPromoState({ status: 'idle' }) }} className="min-h-11 rounded-none uppercase" /><Button type="button" variant="outline" onClick={applyPromotion} disabled={isApplyingPromo || !promoCode.trim()} className="min-h-11 rounded-none px-5 text-xs uppercase tracking-[0.12em]">{isApplyingPromo ? 'Checking…' : 'Apply code'}</Button></div>
                {promoState.status === 'error' && <p role="alert" className="mt-2 text-xs text-rose-700 dark:text-rose-300">{promoState.message}</p>}
                {promoState.status === 'applied' && <p role="status" className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">Promotion applied. The final amount will be checked again securely before payment.</p>}
              </div>

              {paymentState && <p role="status" className="border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-50">{paymentState.message}</p>}
              {error && <p role="alert" className="border border-rose-300/70 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/40 dark:bg-rose-950/40 dark:text-rose-100">{error}</p>}
              {slots.length === 0 ? <Button type="button" onClick={() => router.push('/contact')} className="motion-reveal min-h-12 w-full rounded-none text-xs uppercase tracking-[0.18em]" style={{ animationDelay: '220ms' }}>Request a consultation window</Button> : <Button type="submit" disabled={isSubmitting} className="motion-reveal min-h-12 w-full rounded-none text-xs uppercase tracking-[0.18em]" style={{ animationDelay: '220ms' }}>{isSubmitting ? `Preparing ${money(totalAmount, appliedQuote?.currency || pricing.currency)} payment…` : `Pay ${money(totalAmount, appliedQuote?.currency || pricing.currency)} & confirm`}</Button>}
              <p className="text-center text-xs leading-5 text-muted-foreground">You will continue to Flutterwave’s secure checkout. Your slot is held briefly while payment is completed.</p>
            </div>
          </form>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
