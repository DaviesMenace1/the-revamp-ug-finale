'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check, Clock3, MapPin, Video } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { bookConsultationSlot } from '@/lib/actions/consultation-booking'

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

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('en-UG', { weekday: 'long', month: 'long', day: 'numeric' })
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' })
}

export default function BookConsultationClient({ slots = [], loadError = null }: { slots: Slot[]; loadError?: string | null }) {
  const router = useRouter()
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [form, setForm] = useState<BookingForm>({ title: '', serviceType: '', budget: '', description: '' })
  const [isPending, startTransition] = useTransition()
  const [bookedSlot, setBookedSlot] = useState<Slot | null>(null)
  const [error, setError] = useState('')

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

  function updateForm<K extends keyof BookingForm>(key: K, value: BookingForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    const slotForBooking = selectedSlot
    startTransition(async () => {
      const response = await bookConsultationSlot({ ...form, slotId: slotForBooking.id, mode: slotForBooking.mode })
      if (response.success) {
        setBookedSlot(slotForBooking)
      } else {
        setError(response.error || 'We could not complete the booking. Please try another slot.')
      }
    })
  }

  if (bookedSlot) {
    const meta = MODE_META[bookedSlot.mode] || MODE_META.virtual
    const ModeIcon = meta.icon
    return (
      <>
        <SiteHeader />
        <main className="flex min-h-[75vh] items-center justify-center bg-background px-5 py-20 sm:px-8">
          <div className="motion-reveal w-full max-w-2xl rounded-2xl border border-border/70 bg-card p-8 text-center shadow-lift sm:p-12">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-gold/15 text-primary"><Check className="size-8" /></span>
            <p className="mt-7 text-[10px] uppercase tracking-[0.28em] text-primary">Your studio appointment</p>
            <h1 className="mt-3 font-serif text-4xl font-light text-foreground sm:text-5xl">Consultation booked.</h1>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-muted-foreground">We have reserved this time for your brief. You can view the appointment and any updates from your client portal.</p>
            <div className="mx-auto mt-8 grid max-w-md gap-3 border-y border-border/70 py-5 text-left sm:grid-cols-2"><div><p className="text-[10px] uppercase tracking-[0.18em] text-primary">When</p><p className="mt-1 text-sm text-foreground">{dateLabel(bookedSlot.startTime)} · {timeLabel(bookedSlot.startTime)}</p></div><div><p className="text-[10px] uppercase tracking-[0.18em] text-primary">Format</p><p className="mt-1 flex items-center gap-2 text-sm text-foreground"><ModeIcon className="size-4 text-gold" />{meta.label}</p></div></div>
            <Button type="button" onClick={() => router.push('/client/consultations')} className="mt-7 min-h-11 rounded-none px-6 text-xs uppercase tracking-[0.16em]">View my consultations</Button>
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden bg-obsidian px-5 pb-16 pt-36 text-ivory sm:px-8 md:pb-24 md:pt-48 lg:px-16">
          <div className="absolute right-[-12%] top-[-30%] size-[40rem] rounded-full border border-gold/20" aria-hidden="true" />
          <div className="relative mx-auto max-w-[1440px] motion-reveal"><p className="text-[10px] uppercase tracking-[0.3em] text-gold">The Revamp studio / private appointment</p><h1 className="mt-5 max-w-4xl font-serif text-6xl font-light leading-[0.9] sm:text-8xl lg:text-[8rem]">Let’s shape the brief.</h1><p className="mt-7 max-w-2xl text-base leading-7 text-ivory/65 sm:text-lg">Choose how you would like to meet, then give us enough context to make the first conversation useful.</p></div>
        </section>

        <section className="px-5 py-12 sm:px-8 md:py-20 lg:px-16">
          <form onSubmit={handleSubmit} className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="motion-reveal"><p className="text-[10px] uppercase tracking-[0.24em] text-primary">01 / Choose your format</p><h2 className="mt-4 font-serif text-4xl font-light sm:text-5xl">A meeting that suits the project.</h2><p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">Every available slot carries its own meeting format. Select a time to see whether it is virtual, at your project, or at the showroom.</p>{selectedSlot && selectedMode && <div className="mt-8 rounded-xl border border-gold/45 bg-gold/10 p-5"><p className="flex items-center gap-2 text-sm font-medium text-foreground">{(() => { const Icon = selectedMode.icon; return <Icon className="size-4 text-primary" /> })()}{selectedMode.label}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedMode.detail}</p><p className="mt-4 flex items-center gap-2 text-xs text-foreground"><Clock3 className="size-4 text-gold" />{dateLabel(selectedSlot.startTime)} · {timeLabel(selectedSlot.startTime)} · {selectedSlot.durationMinutes} minutes</p></div>}</div>
            <div className="space-y-10">
              <div className="motion-reveal" style={{ animationDelay: '80ms' }}>
                {loadError && <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><span>{loadError}</span><button type="button" onClick={() => window.location.reload()} className="min-h-10 font-medium underline underline-offset-4">Retry</button></div>}
                {Object.keys(slotsByDay).length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-sm leading-7 text-muted-foreground">No consultation slots are currently available. Please check back soon or <a href="/contact" className="text-primary underline underline-offset-4">contact the studio</a> directly.</div> : <div className="space-y-6">{Object.entries(slotsByDay).map(([day, daySlots]) => <div key={day}><p className="mb-3 text-sm font-medium text-foreground">{day}</p><div className="grid gap-2 sm:grid-cols-2">{daySlots.map((slot) => { const meta = MODE_META[slot.mode] || MODE_META.virtual; const Icon = meta.icon; const isSelected = selectedSlotId === slot.id; return <button key={slot.id} type="button" onClick={() => setSelectedSlotId(slot.id)} aria-pressed={isSelected} className={`flex min-h-16 items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground hover:border-primary/60 hover:bg-muted/40'}`}><span className="flex items-center gap-3"><Icon className="size-4 shrink-0" /><span><span className="block text-sm font-medium">{timeLabel(slot.startTime)}</span><span className="mt-1 block text-[10px] uppercase tracking-[0.1em] opacity-70">{meta.label} · {slot.durationMinutes} min</span></span></span>{isSelected && <Check className="size-4" />}</button> })}</div></div>)}</div>}
              </div>

              <div className="motion-reveal space-y-5" style={{ animationDelay: '140ms' }}><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">02 / Tell us about it</p><h2 className="mt-3 font-serif text-3xl font-light">Give the conversation a starting point.</h2></div><div><label htmlFor="consultation-title" className="mb-2 block text-xs font-medium text-foreground">What should we call this project?</label><Input id="consultation-title" placeholder="e.g. Kyanja living room redesign" value={form.title} onChange={(event) => updateForm('title', event.target.value)} className="min-h-12 rounded-none" required /></div><div><label htmlFor="consultation-service" className="mb-2 block text-xs font-medium text-foreground">What would you like help with?</label><select id="consultation-service" name="serviceType" value={form.serviceType} onChange={(event) => updateForm('serviceType', event.target.value)} className="min-h-12 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"><option value="">Choose a service (optional)</option><option value="interior_design">Interior design</option><option value="architecture">Architecture</option><option value="furniture_sourcing">Furniture & object sourcing</option><option value="renovation">Renovation & styling</option><option value="commercial">Commercial or hospitality space</option><option value="other">Something else</option></select></div><div><label htmlFor="consultation-budget" className="mb-2 block text-xs font-medium text-foreground">What is the project range?</label><select id="consultation-budget" name="budget" value={form.budget} onChange={(event) => updateForm('budget', event.target.value)} className="min-h-12 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"><option value="">Choose a range (optional)</option><option value="under_10m">Under UGX 10 million</option><option value="10m_30m">UGX 10–30 million</option><option value="30m_75m">UGX 30–75 million</option><option value="75m_plus">UGX 75 million and above</option><option value="not_sure">I am not sure yet</option></select></div><div><label htmlFor="consultation-description" className="mb-2 block text-xs font-medium text-foreground">What should we know before we meet?</label><Textarea id="consultation-description" placeholder="Tell us about the space, what is not working, and what you would like it to become." value={form.description} onChange={(event) => updateForm('description', event.target.value)} rows={5} className="rounded-none" /></div></div>

              {error && <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
              {slots.length === 0 ? <Button type="button" onClick={() => router.push('/contact')} className="motion-reveal min-h-12 w-full rounded-none text-xs uppercase tracking-[0.18em]" style={{ animationDelay: '220ms' }}>Request a consultation window</Button> : <Button type="submit" disabled={isPending} className="motion-reveal min-h-12 w-full rounded-none text-xs uppercase tracking-[0.18em]" style={{ animationDelay: '220ms' }}>{isPending ? 'Reserving your time…' : 'Confirm consultation'}</Button>}
            </div>
          </form>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
