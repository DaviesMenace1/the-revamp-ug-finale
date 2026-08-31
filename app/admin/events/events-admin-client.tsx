'use client'

import { SingleImageUpload } from '@/components/admin/single-image-upload'
import { useState, useTransition } from 'react'
import { CalendarDays, Pencil, Plus, Trash2, X } from '@/components/ui/luxury-icons'
import { createEvent, deleteEvent, updateEvent } from '@/lib/actions/events'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type EventRecord = {
  id: string
  title: string
  description: string | null
  image: string | null
  location: string | null
  meetingMode: 'virtual' | 'in_person'
  meetingProvider: string | null
  meetingUrl: string | null
  eventDate: string
  capacity: number | null
  membershipTier: string | null
  status: string
  createdAt: string
  updatedAt: string
}

type EventForm = {
  title: string
  description: string
  image: string
  location: string
  meetingMode: string
  eventDate: string
  capacity: string
  membershipTier: string
  status: string
}

const EMPTY_FORM: EventForm = { title: '', description: '', image: '', location: '', meetingMode: 'virtual', eventDate: '', capacity: '', membershipTier: 'all', status: 'draft' }
const AUDIENCE_LABELS: Record<string, string> = { all: 'Membership + trade', membership: 'Membership only', trade: 'Trade only' }
const STATUS_LABELS: Record<string, string> = { draft: 'Draft', published: 'Published', cancelled: 'Cancelled' }

function toDatetimeLocal(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
}

function fromEvent(event: EventRecord): EventForm {
  return {
    title: event.title,
    description: event.description ?? '',
    image: event.image ?? '',
    location: event.location ?? '',
    meetingMode: event.meetingMode || (event.meetingProvider === 'google_meet' ? 'virtual' : 'in_person'),
    eventDate: toDatetimeLocal(event.eventDate),
    capacity: event.capacity?.toString() ?? '',
    membershipTier: event.membershipTier ?? 'all',
    status: event.status,
  }
}

export default function EventsAdminClient({ events: initialEvents }: { events: EventRecord[] }) {
  const [events, setEvents] = useState(initialEvents)
  const [form, setForm] = useState<EventForm>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function setField(field: keyof EventForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  function save() {
    setError(null)
    setMessage(null)
    if (!form.title.trim() || !form.eventDate) {
      setError('Add an event title and date.')
      return
    }
    startTransition(async () => {
      const payload = {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
        description: form.description || null,
        image: form.image || null,
        location: form.location || null,
      }
      const result = editingId ? await updateEvent(editingId, payload) : await createEvent(payload)
      if (!result.success || !result.event) {
        setError(result.error || 'The event could not be saved.')
        return
      }
      const event = { ...result.event, meetingMode: result.event.meetingProvider === 'google_meet' ? 'virtual' as const : 'in_person' as const, eventDate: result.event.eventDate.toISOString(), createdAt: result.event.createdAt.toISOString(), updatedAt: result.event.updatedAt.toISOString() }
      setEvents((current) => editingId ? current.map((item) => item.id === editingId ? event : item) : [...current, event].sort((a, b) => a.eventDate.localeCompare(b.eventDate)))
      setMessage(editingId ? 'Event updated.' : 'Event created.')
      resetForm()
    })
  }

  function remove(eventId: string) {
    if (!window.confirm('Delete this event and its RSVPs?')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteEvent(eventId)
      if (!result.success) {
        setError(result.error || 'The event could not be deleted.')
        return
      }
      setEvents((current) => current.filter((event) => event.id !== eventId))
      if (editingId === eventId) resetForm()
      setMessage('Event deleted.')
    })
  }

  return (
    <main className="min-w-0 space-y-8 p-5 sm:p-8">
      <header className="flex flex-col gap-4 border-b border-border/70 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Portal programming</p><h1 className="mt-2 font-serif text-4xl font-light text-foreground sm:text-5xl">Events</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Create one event record and choose whether it appears to membership, trade, or both audiences.</p></div>
        <CalendarDays className="size-7 text-primary" aria-hidden="true" />
      </header>

      {(error || message) && <div className={`border px-4 py-3 text-sm ${error ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-emerald-300/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100'}`} role={error ? 'alert' : 'status'}>{error || message}</div>}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card className="border-border/20 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-serif text-2xl font-light text-foreground">{editingId ? 'Edit event' : 'Add an event'}</h2><p className="mt-1 text-sm text-muted-foreground">Only administrators can publish changes.</p></div>{editingId ? <button type="button" onClick={resetForm} className="flex size-11 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Cancel editing"><X className="size-5" /></button> : <Plus className="size-5 text-primary" aria-hidden="true" />}</div>
          <div className="mt-6 grid gap-4">
            <Field label="Title" value={form.title} onChange={(value) => setField('title', value)} placeholder="Studio masterclass" />
            <label className="grid gap-2 text-sm font-medium text-foreground"><span>Description</span><textarea value={form.description} onChange={(event) => setField('description', event.target.value)} rows={4} maxLength={4000} placeholder="What will members or trade partners experience?" className="w-full resize-y border border-input bg-background px-3 py-3 text-sm font-normal leading-6 outline-none focus:ring-2 focus:ring-primary/30" /></label>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Date and time" type="datetime-local" value={form.eventDate} onChange={(value) => setField('eventDate', value)} /><SelectField label="Format" value={form.meetingMode} onChange={(value) => setField('meetingMode', value)} options={[['virtual', 'Virtual · Google Meet created automatically'], ['in_person', 'In person · venue required']]} /></div>
            {form.meetingMode === 'in_person' && <Field label="Venue location" value={form.location} onChange={(value) => setField('location', value)} placeholder="Kyanja studio" />}
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Capacity (optional)" type="number" value={form.capacity} onChange={(value) => setField('capacity', value)} placeholder="50" /><div><label className="mb-2 block text-sm font-medium text-foreground">Image (optional)</label><SingleImageUpload value={form.image} onChange={(image) => setField('image', image)} label="Upload event image" /></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><SelectField label="Audience" value={form.membershipTier} onChange={(value) => setField('membershipTier', value)} options={[['all', 'Membership + trade'], ['membership', 'Membership only'], ['trade', 'Trade only']]} /><SelectField label="Status" value={form.status} onChange={(value) => setField('status', value)} options={[['draft', 'Draft'], ['published', 'Published'], ['cancelled', 'Cancelled']]} /></div>
            <Button type="button" onClick={save} disabled={isPending} className="min-h-11 w-full rounded-none sm:w-fit">{isPending ? 'Saving…' : editingId ? 'Save changes' : 'Create event'}</Button>
          </div>
        </Card>

        <section className="space-y-4"><div className="flex items-center justify-between"><h2 className="font-serif text-2xl font-light text-foreground">Scheduled events</h2><span className="text-xs text-muted-foreground">{events.length} total</span></div>{events.map((event) => <article key={event.id} className="border border-border/50 bg-card p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-xl text-foreground">{event.title}</h3><span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{STATUS_LABELS[event.status] ?? event.status}</span></div><p className="mt-2 text-sm text-muted-foreground">{new Date(event.eventDate).toLocaleString('en-UG')} · {event.meetingMode === 'virtual' ? 'Google Meet' : event.location || 'Location to be announced'}</p>{event.meetingUrl && <a href={event.meetingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary underline">Open Google Meet</a>}
<p className="mt-1 text-xs uppercase tracking-[0.12em] text-primary">{AUDIENCE_LABELS[event.membershipTier ?? 'all'] ?? 'Membership + trade'}</p>{event.description && <p className="mt-3 text-sm leading-6 text-muted-foreground">{event.description}</p>}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => { setEditingId(event.id); setForm(fromEvent(event)); setError(null); setMessage(null) }} className="flex min-h-11 items-center gap-2 border border-border px-3 text-xs font-semibold uppercase tracking-[0.12em] text-foreground hover:border-primary" aria-label={`Edit ${event.title}`}><Pencil className="size-3.5" />Edit</button><button type="button" onClick={() => remove(event.id)} className="flex min-h-11 items-center justify-center border border-destructive/30 px-3 text-destructive hover:bg-destructive/5" aria-label={`Delete ${event.title}`}><Trash2 className="size-4" /></button></div></div></article>)}{events.length === 0 && <div className="border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">No events yet. Create the first admin-managed event.</div>}</section>
      </section>
    </main>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="grid gap-2 text-sm font-medium text-foreground"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 w-full border border-input bg-background px-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-primary/30" /></label>
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <label className="grid gap-2 text-sm font-medium text-foreground"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full border border-input bg-background px-3 text-sm font-normal text-foreground"><>{options.map(([option, labelText]) => <option key={option} value={option}>{labelText}</option>)}</></select></label>
}
