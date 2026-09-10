'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { isConsultationHistory } from '@/lib/consultations/lifecycle'
import { Building2, Calendar, CheckCircle2, Clock3, MapPin, MessageSquare, Plus, Search, Trash2, Video, X } from '@/components/ui/luxury-icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { deleteSlot } from '@/lib/actions/consultation-booking'
import { updateConsultationStatus, updateConsultationNotes, deleteConsultation } from '@/lib/actions/consultations'

type Consultation = {
  id: string
  title: string
  description: string | null
  serviceType: string | null
  budget: string | null
  preferredDate: string | null
  status: string | null
  notes: string | null
  createdAt: string
  clientEmail: string | null
  clientFirstName: string | null
  clientLastName: string | null
  clientPhone: string | null
}

type Slot = {
  id: string
  startTime: string
  durationMinutes: number
  mode: string
  location: string | null
  meetingUrl: string | null
  isBooked: boolean
  consultationId: string | null
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-muted text-muted-foreground',
}

const SLOT_REQUEST_TIMEOUT_MS = 15_000

const MODE_META: Record<string, { label: string; icon: typeof Video }> = {
  virtual: { label: 'Virtual', icon: Video },
  on_site: { label: 'On-site', icon: MapPin },
  in_person: { label: 'On-site', icon: MapPin },
  showroom: { label: 'Showroom', icon: Building2 },
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('en-UG', { weekday: 'short', month: 'short', day: 'numeric' })
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' })
}

function clientMessage(description: string | null) {
  const value = description?.trim() || ''
  if (!value) return null
  return value.split(/\n\nBudget range:/i)[0].trim() || value
}

async function parseSlotResponse(response: Response) {
  const text = await response.text()
  try {
    return JSON.parse(text) as { success?: boolean; slots?: Slot[]; error?: string }
  } catch {
    throw new Error(response.ok ? 'The availability service returned an invalid response.' : `The availability request failed (HTTP ${response.status}).`)
  }
}

function localDateTimeMin() {
  const date = new Date(Date.now() + 15 * 60 * 1000)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16)
}

export default function ConsultationsClient({
  initialConsultations = [],
  initialSlots = [],
}: {
  initialConsultations: Consultation[]
  initialSlots: Slot[]
}) {
  const [list, setList] = useState(initialConsultations)
  const [slots, setSlots] = useState(initialSlots)
  const [searchTerm, setSearchTerm] = useState('')
  const [selected, setSelected] = useState<Consultation | null>(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [slotStart, setSlotStart] = useState('')
  const [slotDuration, setSlotDuration] = useState('45')
  const [slotMode, setSlotMode] = useState('virtual')
  const [slotLocation, setSlotLocation] = useState('')
  const [slotMessage, setSlotMessage] = useState('')
  const [slotError, setSlotError] = useState('')
  const [slotSaveState, setSlotSaveState] = useState<'idle' | 'saving' | 'unknown'>('idle')
  const [isPending, startTransition] = useTransition()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const activeList = useMemo(() => list.filter((consultation) => !isConsultationHistory(consultation, now)), [list, now])
  const historyList = useMemo(() => list.filter((consultation) => isConsultationHistory(consultation, now)), [list, now])
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return activeList
    return activeList.filter((consultation) => [consultation.title, consultation.clientEmail, consultation.clientFirstName, consultation.clientLastName, consultation.serviceType].filter(Boolean).some((field) => field!.toLowerCase().includes(term)))
  }, [activeList, searchTerm])
  const filteredHistory = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return historyList
    return historyList.filter((consultation) => [consultation.title, consultation.clientEmail, consultation.clientFirstName, consultation.clientLastName, consultation.serviceType].filter(Boolean).some((field) => field!.toLowerCase().includes(term)))
  }, [historyList, searchTerm])

  function handleCreateSlot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (slotSaveState !== 'idle') return
    setSlotError('')
    setSlotMessage('')
    if (!slotStart) {
      setSlotError('Choose a date and time first.')
      return
    }
    const start = new Date(slotStart)
    if (!Number.isFinite(start.getTime()) || start.getTime() <= Date.now()) {
      setSlotError('Availability must be set in the future.')
      return
    }
    const durationMinutes = Number(slotDuration)
    setSlotSaveState('saving')
    startTransition(async () => {
      let timedOut = false
      let timeoutId: number | undefined
      try {
        const timeout = new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => {
            timedOut = true
            reject(new Error('The availability request timed out.'))
          }, SLOT_REQUEST_TIMEOUT_MS)
        })
        const request = await fetch('/api/admin/consultations/slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startTimes: [start.toISOString()], durationMinutes, mode: slotMode, location: slotLocation }),
        })
        const response = await Promise.race([parseSlotResponse(request), timeout])
        if (!request.ok && response.success !== false) throw new Error(`The availability request failed (HTTP ${request.status}).`)
        if (!response.success) {
          setSlotError(response.error || 'Unable to create this slot.')
          return
        }
        const createdSlots: Slot[] = (response.slots ?? []).map((slot) => ({ ...slot, startTime: slot.startTime, isBooked: Boolean(slot.isBooked), consultationId: slot.consultationId ?? null }))
        setSlots((current) => [...current, ...createdSlots].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()))
        setSlotStart('')
        setSlotLocation('')
        setSlotMessage(slotMode === 'virtual' ? 'Availability added with a Google Meet link.' : slotMode === 'on_site' ? 'On-site availability added. The client will provide their address while booking.' : 'Showroom availability added. It is now visible on the public booking form.')
      } catch (error) {
        if (timedOut) {
          setSlotSaveState('unknown')
          setSlotError('The server did not respond. Refresh this page before trying again so you do not create a duplicate slot.')
        } else {
          setSlotError(error instanceof Error ? error.message : 'Unable to create this slot.')
        }
      } finally {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId)
        if (!timedOut) setSlotSaveState('idle')
      }
    })
  }

  function handleDeleteSlot(slot: Slot) {
    if (slot.isBooked || !confirm(`Remove the ${dateLabel(slot.startTime)} ${timeLabel(slot.startTime)} slot?`)) return
    setSlotError('')
    setSlotMessage('')
    startTransition(async () => {
      const response = await deleteSlot(slot.id)
      if (!response.success) {
        setSlotError(response.error || 'Unable to remove this slot.')
        return
      }
      setSlots((current) => current.filter((item) => item.id !== slot.id))
      setSlotMessage('Availability removed.')
    })
  }

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      const response = await updateConsultationStatus(id, status)
      if (response.success) {
        setList((current) => current.map((consultation) => consultation.id === id ? { ...consultation, status } : consultation))
        setSelected((current) => current?.id === id ? { ...current, status } : current)
      }
    })
  }

  function handleSaveNotes() {
    if (!selected) return
    startTransition(async () => {
      const response = await updateConsultationNotes(selected.id, notesDraft)
      if (response.success) {
        setList((current) => current.map((consultation) => consultation.id === selected.id ? { ...consultation, notes: notesDraft } : consultation))
        setSelected((current) => current ? { ...current, notes: notesDraft } : current)
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this consultation request?')) return
    startTransition(async () => {
      const response = await deleteConsultation(id)
      if (response.success) {
        setList((current) => current.filter((consultation) => consultation.id !== id))
        if (selected?.id === id) setSelected(null)
      }
    })
  }

  return (
    <div className="space-y-8 p-5 sm:p-8">
      <div className="flex flex-col gap-3 border-b border-border/70 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Studio calendar</p><h1 className="mt-2 font-serif text-4xl font-light text-foreground">Consultations</h1><p className="mt-2 text-sm text-muted-foreground">Set availability first, then manage the conversations clients book.</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="size-4 text-gold" />{slots.filter((slot) => !slot.isBooked).length} open slots · {historyList.length} in history</div></div>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card className="rounded-xl border-border/70 bg-card shadow-soft"><CardHeader><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-gold/15 text-primary"><Plus className="size-5" /></span><div><CardTitle>Set availability</CardTitle><CardDescription>Add a time clients can book.</CardDescription></div></div></CardHeader><CardContent><form onSubmit={handleCreateSlot} className="space-y-4"><div><label htmlFor="slot-start" className="mb-2 block text-xs font-medium text-foreground">Date and start time</label><Input id="slot-start" type="datetime-local" min={localDateTimeMin()} value={slotStart} onChange={(event) => setSlotStart(event.target.value)} className="min-h-12 rounded-none" required /></div><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="slot-duration" className="mb-2 block text-xs font-medium text-foreground">Duration</label><select id="slot-duration" value={slotDuration} onChange={(event) => setSlotDuration(event.target.value)} className="min-h-12 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground"><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">2 hours</option></select></div><div><label htmlFor="slot-mode" className="mb-2 block text-xs font-medium text-foreground">Meeting format</label><select id="slot-mode" value={slotMode} onChange={(event) => setSlotMode(event.target.value)} className="min-h-12 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground"><option value="virtual">Virtual</option><option value="on_site">On-site</option><option value="showroom">Showroom</option></select></div></div>{slotMode === 'showroom' && <div><label htmlFor="slot-location" className="mb-2 block text-xs font-medium text-foreground">Showroom location</label><Input id="slot-location" value={slotLocation} onChange={(event) => setSlotLocation(event.target.value)} placeholder="The Revamp showroom" className="min-h-12 rounded-none" required /></div>}{slotError && <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{slotError}</p>}{slotMessage && <p role="status" className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><CheckCircle2 className="size-4" />{slotMessage}</p>}<Button type="submit" disabled={isPending || slotSaveState !== 'idle'} className="min-h-11 w-full rounded-none text-xs uppercase tracking-[0.14em]">{slotSaveState === 'unknown' ? 'Refresh to check availability' : slotSaveState === 'saving' || isPending ? 'Saving availability…' : 'Add bookable slot'}</Button></form></CardContent></Card>

        <Card className="rounded-xl border-border/70 bg-card shadow-soft"><CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>Upcoming availability</CardTitle><CardDescription>Only future slots appear on the public booking page.</CardDescription></div><Clock3 className="size-5 text-gold" /></div></CardHeader><CardContent>{slots.length === 0 ? <div className="rounded-lg border border-dashed border-border p-8 text-center"><p className="font-serif text-2xl">No slots yet.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Use the form beside this panel to publish the first appointment window.</p></div> : <div className="space-y-2">{slots.map((slot) => { const meta = MODE_META[slot.mode] || MODE_META.virtual; const ModeIcon = meta.icon; return <div key={slot.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-background p-3"><div className="flex items-center gap-3"><span className={`flex size-9 items-center justify-center rounded-full ${slot.isBooked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}><ModeIcon className="size-4" /></span><div><p className="text-sm font-medium text-foreground">{dateLabel(slot.startTime)} · {timeLabel(slot.startTime)}</p><p className="mt-1 text-xs text-muted-foreground">{meta.label} · {slot.durationMinutes} minutes{slot.isBooked ? ' · Booked' : ' · Open'}{slot.location ? ` · ${slot.location}` : ''}</p>{slot.meetingUrl && <a href={slot.meetingUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary underline">Open Google Meet</a>}</div></div>{slot.isBooked ? <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Reserved</span> : <button type="button" onClick={() => handleDeleteSlot(slot)} disabled={isPending} className="inline-flex min-h-10 items-center gap-2 px-2 text-xs text-muted-foreground hover:text-rose-700 disabled:opacity-50"><Trash2 className="size-4" />Remove</button>}</div> })}</div>}</CardContent></Card>
      </section>

      <Card className="rounded-xl border-border/70 bg-card shadow-soft"><CardHeader className="pb-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><CardTitle>Active client requests</CardTitle><CardDescription>{activeList.length} active consultations · {historyList.length} in history</CardDescription></div><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Search consultations" placeholder="Search consultations…" className="rounded-none pl-10" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div></div></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[760px]"><thead className="border-b border-border/70"><tr>{['Client', 'Title', 'Service', 'Preferred date', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{heading}</th>)}</tr></thead><tbody>{filtered.map((consultation) => <tr key={consultation.id} className="border-b border-border/50 transition-colors hover:bg-muted/40"><td className="px-4 py-4 text-sm"><div className="font-medium text-foreground">{[consultation.clientFirstName, consultation.clientLastName].filter(Boolean).join(' ') || 'N/A'}</div><div className="text-xs text-muted-foreground">{consultation.clientEmail || 'N/A'}</div></td><td className="px-4 py-4 text-sm text-foreground"><button type="button" className="text-left hover:underline" onClick={() => { setSelected(consultation); setNotesDraft(consultation.notes || '') }}>{consultation.title}</button></td><td className="px-4 py-4 text-sm capitalize text-muted-foreground">{consultation.serviceType?.replaceAll('_', ' ') || 'N/A'}</td><td className="px-4 py-4 text-sm text-muted-foreground">{consultation.preferredDate ? new Date(consultation.preferredDate).toLocaleString() : 'N/A'}</td><td className="px-4 py-4 text-sm"><select aria-label={`Status for ${consultation.title}`} value={consultation.status ?? 'pending'} disabled={isPending} onChange={(event) => handleStatusChange(consultation.id, event.target.value)} className={`rounded-full border-0 px-3 py-1 text-xs font-medium ${STATUS_COLORS[consultation.status ?? 'pending'] || STATUS_COLORS.pending}`}><option value="pending">Pending</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td><td className="px-4 py-4 text-sm"><button type="button" aria-label={`Delete ${consultation.title}`} disabled={isPending} onClick={() => handleDelete(consultation.id)} className="inline-flex min-h-10 items-center justify-center p-2 text-muted-foreground hover:text-rose-700 disabled:opacity-50"><Trash2 className="size-4" /></button></td></tr>)}{filtered.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No active consultations found.</td></tr>}</tbody></table></div>{filteredHistory.length > 0 && <details className="mt-6 rounded-lg border border-border/70 bg-muted/15"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden"><span>Consultation history</span><span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{filteredHistory.length}</span></summary><div className="space-y-2 border-t border-border/70 p-3">{filteredHistory.map((consultation) => <div key={consultation.id} className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-foreground">{consultation.title}</p><p className="mt-1 text-xs text-muted-foreground">{[consultation.clientFirstName, consultation.clientLastName].filter(Boolean).join(' ') || consultation.clientEmail || 'Client'} · {consultation.preferredDate ? `${dateLabel(consultation.preferredDate)} · ${timeLabel(consultation.preferredDate)}` : 'No scheduled time'}</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-muted px-3 py-1 text-xs capitalize text-muted-foreground">{consultation.status || 'past window'}</span><button type="button" onClick={() => { setSelected(consultation); setNotesDraft(consultation.notes || '') }} className="min-h-10 px-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary hover:underline">View</button></div></div>)}</div></details>}</CardContent></Card>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/55 p-4" role="dialog" aria-modal="true" aria-label="Consultation details"><div className="w-full max-w-lg rounded-xl bg-background p-6 shadow-xl"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.2em] text-primary">Consultation brief</p><h2 className="mt-2 font-serif text-2xl font-light text-foreground">{selected.title}</h2><p className="mt-1 text-sm text-muted-foreground">{[selected.clientFirstName, selected.clientLastName].filter(Boolean).join(' ') || 'Client'} · {selected.clientEmail || 'No email'}</p></div><button type="button" aria-label="Close consultation details" onClick={() => setSelected(null)} className="inline-flex size-10 items-center justify-center text-muted-foreground hover:text-foreground"><X className="size-5" /></button></div>{clientMessage(selected.description) && <div className="mt-5 rounded-lg border border-border/70 bg-muted/20 p-4"><p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-primary"><MessageSquare className="size-4" />Client booking message</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground">{clientMessage(selected.description)}</p></div>}<div className="mt-5 space-y-1 text-sm text-muted-foreground">{selected.serviceType && <p>Service: <span className="capitalize text-foreground">{selected.serviceType.replaceAll('_', ' ')}</span></p>}{selected.budget && <p>Budget: <span className="text-foreground">{selected.budget}</span></p>}{selected.clientPhone && <p>Phone: <span className="text-foreground">{selected.clientPhone}</span></p>}</div><div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4"><label htmlFor="internal-notes" className="text-sm font-medium text-foreground">System / internal notes</label><textarea id="internal-notes" value={notesDraft} onChange={(event) => setNotesDraft(event.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-border bg-transparent p-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><Button type="button" className="mt-3 rounded-none" disabled={isPending} onClick={handleSaveNotes}>Save notes</Button></div></div></div>}
    </div>
  )
}
