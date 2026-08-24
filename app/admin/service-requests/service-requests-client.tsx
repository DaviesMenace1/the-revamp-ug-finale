'use client'

import { useMemo, useState, useTransition } from 'react'
import { ArrowRight, Mail, MessageSquare, Phone, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateServiceRequestNotes, updateServiceRequestStatus } from '@/lib/actions/service-request'

type ServiceRequest = {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  serviceType: string
  budget: string | null
  timeline: string | null
  projectDescription: string | null
  status: string | null
  notes: string | null
  createdAt: string
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  contacted: 'bg-blue-100 text-blue-800',
  qualified: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-muted text-muted-foreground',
}

function serviceLabel(value: string) {
  return value.replaceAll('_', ' ')
}

export default function ServiceRequestsClient({ initialRequests = [], loadError = null }: { initialRequests: ServiceRequest[]; loadError?: string | null }) {
  const [requests, setRequests] = useState(initialRequests)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ServiceRequest | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return requests
    return requests.filter((request) => [request.name, request.email, request.company, request.serviceType, request.projectDescription].filter(Boolean).some((value) => value!.toLowerCase().includes(term)))
  }, [requests, search])

  function changeStatus(request: ServiceRequest, status: string) {
    setError('')
    startTransition(async () => {
      const response = await updateServiceRequestStatus(request.id, status)
      if (!response.success) {
        setError(response.error || 'Unable to update request.')
        return
      }
      setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status } : item))
      setSelected((current) => current?.id === request.id ? { ...current, status } : current)
    })
  }

  function saveNotes() {
    if (!selected) return
    setError('')
    startTransition(async () => {
      const response = await updateServiceRequestNotes(selected.id, notes)
      if (!response.success) {
        setError(response.error || 'Unable to save notes.')
        return
      }
      setRequests((current) => current.map((item) => item.id === selected.id ? { ...item, notes } : item))
      setSelected((current) => current ? { ...current, notes } : current)
    })
  }

  return (
    <div className="space-y-8 p-5 sm:p-8">
      <header className="flex flex-col gap-4 border-b border-border/70 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Lead desk</p><h1 className="mt-2 font-serif text-4xl font-light text-foreground">Studio inquiries</h1><p className="mt-2 text-sm text-muted-foreground">Turn contact briefs into the next useful conversation.</p></div><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Search studio inquiries" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search inquiries…" className="rounded-none pl-10" /></div></header>
      {loadError && <p role="status" className="border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{loadError}</p>}
      {error && <p role="alert" className="border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div className="grid gap-4">{filtered.map((request) => <Card key={request.id} className="rounded-xl border-border/70 bg-card p-5 shadow-soft"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h2 className="font-serif text-2xl font-light text-foreground">{request.name}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${STATUS_STYLES[request.status || 'pending'] || STATUS_STYLES.pending}`}>{request.status || 'pending'}</span></div><p className="mt-2 text-sm capitalize text-muted-foreground">{serviceLabel(request.serviceType)}{request.company ? ` · ${request.company}` : ''}</p><p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{request.projectDescription || 'No project description provided.'}</p></div><div className="flex shrink-0 flex-wrap gap-2"><a href={`mailto:${request.email}`} className="inline-flex min-h-10 items-center gap-2 rounded border border-border px-3 text-xs text-foreground hover:border-gold hover:text-primary"><Mail className="size-3.5" />Email</a>{request.phone && <a href={`tel:${request.phone}`} className="inline-flex min-h-10 items-center gap-2 rounded border border-border px-3 text-xs text-foreground hover:border-gold hover:text-primary"><Phone className="size-3.5" />Call</a>}<Button type="button" onClick={() => { setSelected(request); setNotes(request.notes || '') }} variant="outline" className="min-h-10 rounded-none text-xs">Open brief <ArrowRight className="ml-2 size-3.5" /></Button></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4"><p className="text-xs text-muted-foreground">Received {new Date(request.createdAt).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' })}{request.timeline ? ` · ${request.timeline}` : ''}</p><select aria-label={`Status for ${request.name}`} value={request.status || 'pending'} disabled={isPending} onChange={(event) => changeStatus(request, event.target.value)} className="min-h-10 rounded border border-border bg-background px-3 text-xs capitalize text-foreground"><option value="pending">Pending</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="closed">Closed</option></select></div></Card>)}{filtered.length === 0 && <div className="rounded-xl border border-dashed border-border/70 p-12 text-center"><MessageSquare className="mx-auto size-8 text-gold" /><p className="mt-4 text-sm text-muted-foreground">No studio inquiries match this search.</p></div>}</div>
      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/55 p-4" role="dialog" aria-modal="true" aria-label="Studio inquiry details"><div className="w-full max-w-2xl rounded-xl bg-background p-6 shadow-xl"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.2em] text-primary">Inquiry brief</p><h2 className="mt-2 font-serif text-3xl font-light text-foreground">{selected.name}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.email}{selected.phone ? ` · ${selected.phone}` : ''}</p></div><button type="button" aria-label="Close inquiry details" onClick={() => setSelected(null)} className="text-sm text-muted-foreground hover:text-foreground">Close</button></div><div className="mt-6 grid gap-3 border-y border-border/70 py-5 text-sm sm:grid-cols-3"><p><span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Interest</span><span className="mt-1 block capitalize text-foreground">{serviceLabel(selected.serviceType)}</span></p><p><span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Budget</span><span className="mt-1 block text-foreground">{selected.budget || 'Not supplied'}</span></p><p><span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Timeline</span><span className="mt-1 block text-foreground">{selected.timeline || 'Not supplied'}</span></p></div><p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{selected.projectDescription || 'No project description provided.'}</p><label htmlFor="service-request-notes" className="mt-6 block text-sm font-medium text-foreground">Internal follow-up notes</label><textarea id="service-request-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="mt-2 w-full rounded border border-border bg-transparent p-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><div className="mt-4 flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={() => setSelected(null)} className="rounded-none">Close</Button><Button type="button" onClick={saveNotes} disabled={isPending} className="rounded-none">{isPending ? 'Saving…' : 'Save notes'}</Button></div></div></div>}
    </div>
  )
}
