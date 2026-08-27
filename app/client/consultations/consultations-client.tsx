'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Building2, Calendar, Clock3, Download, FileText, MapPin, MessageSquare, Receipt, Video } from 'lucide-react'
import { isConsultationHistory } from '@/lib/consultations/lifecycle'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Support', href: '/client/tickets' },
  { label: 'Documents', href: '/client/documents' },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-muted text-muted-foreground',
}

const PAYMENT_COLORS: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-rose-100 text-rose-800',
  verification_failed: 'bg-rose-100 text-rose-800',
  paid_review: 'bg-purple-100 text-purple-800',
}

const MODE_META: Record<string, { label: string; icon: typeof Video }> = {
  virtual: { label: 'Virtual meeting', icon: Video },
  in_person: { label: 'In-person meeting', icon: MapPin },
  showroom: { label: 'Showroom meeting', icon: Building2 },
}

type ConsultationDocument = {
  documentNumber: string
  documentType: string
  fileUrl: string | null
}

type Consultation = {
  id: string
  title: string
  description: string | null
  serviceType: string | null
  status: string | null
  paymentStatus: string
  paymentAmount: string | null
  paymentCurrency: string | null
  paymentReference: string | null
  discountAmount: string | null
  taxAmount: string | null
  promotionCode: string | null
  preferredDate: string | null
  mode: string
  durationMinutes: number
  meetingLink: string | null
  location: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  documents: ConsultationDocument[]
}

function modeMeta(mode: string) {
  return MODE_META[mode] || MODE_META.virtual
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('en-UG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' })
}

function money(value: string | null, currency: string | null) {
  const amount = Number(value)
  return Number.isFinite(amount) ? `${new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(amount)} ${currency || 'UGX'}` : 'N/A'
}

function documentLabel(documentType: string) {
  return documentType === 'consultation_receipt' ? 'Paid receipt' : 'Invoice'
}

function clientMessage(description: string | null) {
  const value = description?.trim() || ''
  if (!value) return null
  return value.split(/\n\nBudget range:/i)[0].trim() || value
}

export default function ConsultationsClient({ consultations = [], loadError = null }: { consultations: Consultation[]; loadError?: string | null }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const activeConsultations = consultations.filter((consultation) => !isConsultationHistory(consultation, now))
  const historyConsultations = consultations.filter((consultation) => isConsultationHistory(consultation, now))

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-8 pb-8">
        <header className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-8 text-background shadow-lift sm:px-10 sm:py-10"><div className="absolute -right-20 -top-24 size-64 rounded-full border border-gold/25" /><div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] uppercase tracking-[0.28em] text-gold">Your studio calendar</p><h1 className="mt-4 font-serif text-4xl sm:text-6xl">Consultations</h1><p className="mt-4 max-w-xl text-sm leading-7 text-background/70">Keep the next conversation, payment status, meeting format, and project brief in one place.</p></div><Link href="/book-consultation" className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-gold/50 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-gold hover:bg-gold hover:text-foreground">Book another conversation <ArrowRight className="size-4" /></Link></div></header>

        {loadError && <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><span>{loadError}</span><button type="button" onClick={() => window.location.reload()} className="min-h-11 shrink-0 font-medium underline underline-offset-4">Retry</button></div>}

        <section className="grid gap-4 sm:grid-cols-3"><Card className="rounded-xl border-border/70 bg-card p-5 shadow-soft"><p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Total conversations</p><p className="mt-4 font-serif text-4xl text-foreground">{consultations.length}</p></Card><Card className="rounded-xl border-border/70 bg-card p-5 shadow-soft"><p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Upcoming</p><p className="mt-4 font-serif text-4xl text-foreground">{activeConsultations.filter((consultation) => consultation.preferredDate && consultation.status !== 'cancelled').length}</p></Card><Card className="rounded-xl border-border/70 bg-card p-5 shadow-soft"><p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Paid consultations</p><p className="mt-4 font-serif text-4xl text-foreground">{consultations.filter((consultation) => consultation.paymentStatus === 'paid').length}</p></Card></section>

        <section className="space-y-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.2em] text-primary">Active schedule</p><h2 className="mt-1 font-serif text-2xl text-foreground">Upcoming and open requests</h2></div><span className="text-xs text-muted-foreground">{activeConsultations.length} active</span></div><div className="grid gap-4">{activeConsultations.map((consultation) => { const meta = modeMeta(consultation.mode); const ModeIcon = meta.icon; const paymentStatus = consultation.paymentStatus || 'pending'; return <Card key={consultation.id} className="rounded-xl border-border/70 bg-card p-6 shadow-soft sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] uppercase tracking-[0.2em] text-primary">Consultation brief</p><h2 className="mt-2 font-serif text-3xl font-light text-foreground">{consultation.title}</h2><p className="mt-2 text-sm capitalize text-muted-foreground">{consultation.serviceType?.replaceAll('_', ' ') || 'Design conversation'}</p></div><div className="flex flex-wrap gap-2"><span className={`w-fit rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_COLORS[consultation.status ?? 'pending'] || STATUS_COLORS.pending}`}>{consultation.status ?? 'pending'}</span><span className={`w-fit rounded-full px-3 py-1 text-xs font-medium capitalize ${PAYMENT_COLORS[paymentStatus] || PAYMENT_COLORS.pending}`}>{paymentStatus.replaceAll('_', ' ')}</span></div></div>{clientMessage(consultation.description) && <div className="mt-6 rounded-xl border border-border/70 bg-muted/20 p-4"><p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-primary"><MessageSquare className="size-4" />Your message</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground line-clamp-3">{clientMessage(consultation.description)}</p>{(clientMessage(consultation.description)?.length || 0) > 240 && <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-primary">Read full message</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{clientMessage(consultation.description)}</p></details>}</div>}<div className="mt-6 grid gap-3 border-y border-border/70 py-5 sm:grid-cols-3"><div className="flex items-start gap-3"><Calendar className="mt-0.5 size-4 text-gold" /><div><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">When</p><p className="mt-1 text-sm text-foreground">{consultation.preferredDate ? `${dateLabel(consultation.preferredDate)} · ${timeLabel(consultation.preferredDate)}` : 'The studio will confirm a time'}</p></div></div><div className="flex items-start gap-3"><ModeIcon className="mt-0.5 size-4 text-gold" /><div><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Format</p><p className="mt-1 text-sm text-foreground">{meta.label}</p></div></div><div className="flex items-start gap-3"><Clock3 className="mt-0.5 size-4 text-gold" /><div><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Duration</p><p className="mt-1 text-sm text-foreground">{consultation.durationMinutes} minutes</p></div></div></div><div className="mt-5 grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-3"><div><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Paid amount</p><p className="mt-1 text-sm font-medium text-foreground">{money(consultation.paymentAmount, consultation.paymentCurrency)}</p></div><div><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Tax included</p><p className="mt-1 text-sm text-foreground">{money(consultation.taxAmount, consultation.paymentCurrency)}</p></div><div><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Promotion</p><p className="mt-1 text-sm text-foreground">{consultation.promotionCode ? `${consultation.promotionCode} · -${money(consultation.discountAmount, consultation.paymentCurrency)}` : 'None applied'}</p></div></div>{consultation.paymentReference && <p className="mt-4 text-xs text-muted-foreground">Payment reference: <span className="font-mono text-foreground">{consultation.paymentReference}</span></p>}{consultation.documents.length > 0 && <div className="mt-5 flex flex-wrap gap-2 border-t border-border/70 pt-5">{consultation.documents.map((document) => document.fileUrl ? <div key={document.documentNumber} className="flex min-h-11 items-center gap-2 rounded border border-border px-3"><span className="flex items-center gap-2 text-xs text-foreground">{document.documentType === 'consultation_receipt' ? <Receipt className="size-4 text-gold" /> : <FileText className="size-4 text-gold" />}{documentLabel(document.documentType)}</span><a href={document.fileUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 border-l border-border pl-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground hover:text-primary" aria-label={`View ${documentLabel(document.documentType)}`}>View <FileText className="size-3" /></a><a href={`/api/documents/download?url=${encodeURIComponent(document.fileUrl)}`} className="inline-flex min-h-9 items-center gap-1 border-l border-border pl-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground hover:text-primary" aria-label={`Download ${documentLabel(document.documentType)}`}>Download <Download className="size-3" /></a></div> : null)}</div>}{consultation.location && <p className="mt-5 text-sm text-muted-foreground">Location: <span className="text-foreground">{consultation.location}</span></p>}{consultation.meetingLink && <a href={consultation.meetingLink} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded border border-border px-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground hover:border-gold hover:text-primary">Open meeting link <ArrowRight className="size-4" /></a>}</Card> })}{activeConsultations.length === 0 && <div className="flex flex-col items-center rounded-xl border border-dashed border-border/70 p-12 text-center"><Calendar className="size-8 text-gold" /><p className="mt-4 font-serif text-2xl text-foreground">No active consultations.</p><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Choose an open time to start a design conversation, or send the studio a brief if no times are currently visible.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Link href="/book-consultation" className="inline-flex min-h-11 items-center gap-2 rounded bg-foreground px-4 text-xs font-semibold uppercase tracking-[0.14em] text-background">View availability <ArrowRight className="size-4" /></Link><Link href="/contact" className="inline-flex min-h-11 items-center rounded border border-border px-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">Send a brief</Link></div></div>}</div>
      {historyConsultations.length > 0 && <details className="rounded-xl border border-border/70 bg-card shadow-soft"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden"><span><span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Archive</span><span className="mt-1 block font-serif text-2xl">Consultation history</span></span><span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{historyConsultations.length}</span></summary><div className="grid gap-3 border-t border-border/70 p-4 sm:p-5">{historyConsultations.map((consultation) => <article key={consultation.id} className="rounded-lg border border-border/70 bg-muted/15 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-medium text-foreground">{consultation.title}</h3><p className="mt-1 text-xs capitalize text-muted-foreground">{consultation.serviceType?.replaceAll('_', ' ') || 'Design conversation'} · {consultation.preferredDate ? `${dateLabel(consultation.preferredDate)} · ${timeLabel(consultation.preferredDate)}` : 'No scheduled time'}</p></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-muted px-3 py-1 capitalize text-muted-foreground">{consultation.status || 'past window'}</span><span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{consultation.durationMinutes} min</span></div></div></article>)}</div></details>}</section>
      </div>
    </PortalLayout>
  )
}
