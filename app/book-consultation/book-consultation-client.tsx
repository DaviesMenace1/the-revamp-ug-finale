'use client'

import { useState, useMemo, useTransition } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Video, MapPin, Building2, Check } from 'lucide-react'
import { bookConsultationSlot } from '@/lib/actions/consultation-booking'
import { useRouter } from 'next/navigation'

const MODE_META: Record<string, { label: string; icon: any }> = {
  virtual: { label: 'Virtual Call', icon: Video },
  in_person: { label: 'In-Person', icon: MapPin },
  showroom: { label: 'At Our Showroom', icon: Building2 },
}

type Slot = {
  id: string
  startTime: string
  durationMinutes: number
  mode: string
}

export default function BookConsultationClient({ slots = [] }: { slots: Slot[] }) {
  const router = useRouter()
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', serviceType: '', description: '' })
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const slotsByDay = useMemo(() => {
    const groups: Record<string, Slot[]> = {}
    for (const slot of slots) {
      const day = new Date(slot.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
      if (!groups[day]) groups[day] = []
      groups[day].push(slot)
    }
    return groups
  }, [slots])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!selectedSlotId) {
      setError('Please select a time slot.')
      return
    }
    if (!form.title.trim()) {
      setError('Please tell us what the consultation is about.')
      return
    }

    startTransition(async () => {
      const res = await bookConsultationSlot({ slotId: selectedSlotId, ...form })
      if (res.success) {
        setSuccess(true)
      } else {
        setError(res.error || 'Failed to book consultation.')
        if (res.error?.includes('signed in')) {
          router.push('/sign-in?redirect_url=/book-consultation')
        }
      }
    })
  }

  if (success) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="text-center max-w-md space-y-4">
            <Check className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="font-serif text-3xl font-light text-foreground">Consultation Booked</h1>
            <p className="text-muted-foreground">
              We've confirmed your consultation. You can view or manage it anytime from your client
              portal.
            </p>
            <Button asChild className="rounded-none">
              <a href="/client/consultations">View My Consultations</a>
            </Button>
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
        <section className="border-b border-border/20 bg-gradient-to-br from-background via-background to-muted/20 py-24 md:py-32">
          <div className="mx-auto max-w-5xl px-6 md:px-8 space-y-6">
            <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground">
              Book Your Consultation
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground font-light">
              Pick a time that works for you — virtual, in-person, or at our showroom.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-6 md:px-8 space-y-10">
            <div>
              <h2 className="font-serif text-2xl font-light text-foreground mb-4">1. Choose a time</h2>

              {Object.keys(slotsByDay).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No consultation slots are currently available — please check back soon or contact us
                  directly.
                </p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(slotsByDay).map(([day, daySlots]) => (
                    <div key={day}>
                      <p className="text-sm font-medium text-foreground mb-2">{day}</p>
                      <div className="flex flex-wrap gap-2">
                        {daySlots.map((slot) => {
                          const Icon = MODE_META[slot.mode]?.icon ?? Video
                          const isSelected = selectedSlotId === slot.id

                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setSelectedSlotId(slot.id)}
                              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border text-foreground hover:border-primary/40'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {new Date(slot.startTime).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                              <span className="text-xs opacity-70">
                                {MODE_META[slot.mode]?.label ?? slot.mode}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-serif text-2xl font-light text-foreground mb-4">2. Tell us about your project</h2>
              <div className="space-y-4">
                <Input
                  placeholder="What's this consultation about? (e.g. Living room redesign)"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="rounded-none"
                />
                <Input
                  placeholder="Service type (e.g. Interior Design, Furniture Sourcing)"
                  value={form.serviceType}
                  onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}
                  className="rounded-none"
                />
                <Textarea
                  placeholder="Anything else we should know before the call?"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="rounded-none"
                />
              </div>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <Button
              type="submit"
              disabled={isPending || slots.length === 0}
              className="w-full h-12 rounded-none uppercase tracking-widest text-xs"
            >
              {isPending ? 'Booking…' : 'Confirm Consultation'}
            </Button>
          </form>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
