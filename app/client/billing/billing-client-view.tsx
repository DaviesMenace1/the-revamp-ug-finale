'use client'

import { useState } from 'react'
import { Download, FileText, Receipt, Wallet } from 'lucide-react'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { formatMoney } from '@/lib/utils'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Billing', href: '/client/billing' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Support', href: '/client/tickets' },
  { label: 'Documents', href: '/client/documents' },
]

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800',
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  partial: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  overdue: 'bg-rose-100 text-rose-800',
  expired: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-muted text-muted-foreground',
}

type Quote = { id: string; quoteNumber: string; total: string; status: string | null; pdfUrl: string | null; validUntil: string | null; createdAt: string }
type GeneratedDocument = { id: string; documentNumber: string; documentType: string; amount: string | null; currency: string; fileUrl: string | null; createdAt: string }
type Invoice = { id: string; invoiceNumber: string; total: string; amountPaid: string; status: string; pdfUrl: string | null; receiptUrl: string | null; dueDate: string | null; createdAt: string }

type Tab = 'invoices' | 'quotes' | 'documents'

function prettyStatus(status: string | null | undefined) {
  return (status || 'pending').replace(/_/g, ' ')
}

function dateLabel(value: string | null) {
  return value ? new Date(value).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date to be confirmed'
}

export default function BillingClientView({ quotes = [], invoices = [], documents = [], loadError = null }: { quotes: Quote[]; invoices: Invoice[]; documents?: GeneratedDocument[]; loadError?: string | null }) {
  const [tab, setTab] = useState<Tab>('invoices')
  const totals = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0)
  const openInvoices = invoices.filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled').length

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-8 pb-8">
        <header className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-8 text-background shadow-lift sm:px-10 sm:py-10"><div className="absolute -right-20 -top-24 size-64 rounded-full border border-gold/25" /><div className="relative"><p className="text-[10px] uppercase tracking-[0.28em] text-gold">Your studio finance</p><h1 className="mt-4 font-serif text-4xl sm:text-6xl">Billing</h1><p className="mt-4 max-w-xl text-sm leading-7 text-background/70">Quotes, invoices, receipts, and generated documents from your work with The Revamp.</p></div></header>

        {loadError && <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><span>{loadError}</span><button type="button" onClick={() => window.location.reload()} className="min-h-11 font-medium underline underline-offset-4">Retry</button></div>}

        <section className="grid gap-3 sm:grid-cols-3"><Card className="rounded-xl border-border/70 bg-card p-5 shadow-soft"><div className="flex size-10 items-center justify-center rounded-lg bg-gold/15 text-primary"><Wallet className="size-4" /></div><p className="mt-6 font-serif text-3xl text-foreground">{formatMoney(totals, 'UGX')}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">Invoice value</p></Card><Card className="rounded-xl border-border/70 bg-card p-5 shadow-soft"><div className="flex size-10 items-center justify-center rounded-lg bg-foreground text-background"><Receipt className="size-4" /></div><p className="mt-6 font-serif text-3xl text-foreground">{openInvoices}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">Open invoices</p></Card><Card className="rounded-xl border-border/70 bg-card p-5 shadow-soft"><div className="flex size-10 items-center justify-center rounded-lg bg-muted text-primary"><FileText className="size-4" /></div><p className="mt-6 font-serif text-3xl text-foreground">{documents.length + quotes.length}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">Documents available</p></Card></section>

        <section className="rounded-xl border border-border/70 bg-card shadow-soft"><div role="tablist" aria-label="Billing records" className="flex overflow-x-auto border-b border-border/70 px-5 sm:px-7">{([['invoices', `Invoices (${invoices.length})`], ['quotes', `Quotes (${quotes.length})`], ['documents', `Generated PDFs (${documents.length})`]] as const).map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`min-h-14 shrink-0 border-b-2 px-2 mr-6 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${tab === value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{label}</button>)}</div><div className="p-5 sm:p-7">
          {tab === 'invoices' && <RecordList empty="No invoices have been shared with you yet." icon={<Receipt className="size-5" />} records={invoices.map((invoice) => <Card key={invoice.id} className="rounded-xl border-border/70 bg-background p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-serif text-2xl text-foreground">{invoice.invoiceNumber}</p><p className="mt-1 text-xs text-muted-foreground">Issued {dateLabel(invoice.createdAt)}{invoice.dueDate ? ` · Due ${dateLabel(invoice.dueDate)}` : ''}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-xs capitalize ${STATUS_COLORS[invoice.status] || STATUS_COLORS.pending}`}>{prettyStatus(invoice.status)}</span></div><div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-border/70 pt-5"><div><p className="font-serif text-3xl text-foreground">{formatMoney(invoice.total, 'UGX')}</p>{Number(invoice.amountPaid) > 0 && <p className="mt-1 text-xs text-muted-foreground">Paid {formatMoney(invoice.amountPaid, 'UGX')}</p>}</div><div className="flex flex-wrap gap-2">{invoice.pdfUrl && <DocumentActions href={invoice.pdfUrl} label="Invoice" icon={<FileText className="size-4" />} />}{invoice.receiptUrl && <DocumentActions href={invoice.receiptUrl} label="Receipt" icon={<Receipt className="size-4" />} />}
</div></div></Card>)} />}
          {tab === 'quotes' && <RecordList empty="No quotes have been shared with you yet." icon={<FileText className="size-5" />} records={quotes.map((quote) => <Card key={quote.id} className="rounded-xl border-border/70 bg-background p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-serif text-2xl text-foreground">{quote.quoteNumber}</p><p className="mt-1 text-xs text-muted-foreground">Issued {dateLabel(quote.createdAt)}{quote.validUntil ? ` · Valid until ${dateLabel(quote.validUntil)}` : ''}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-xs capitalize ${STATUS_COLORS[quote.status || 'pending'] || STATUS_COLORS.pending}`}>{prettyStatus(quote.status)}</span></div><div className="mt-6 flex items-end justify-between gap-4 border-t border-border/70 pt-5"><p className="font-serif text-3xl text-foreground">{formatMoney(quote.total, 'UGX')}</p>{quote.pdfUrl && <DocumentActions href={quote.pdfUrl} label="Quote" icon={<FileText className="size-4" />} />}
</div></Card>)} />}
          {tab === 'documents' && <RecordList empty="No generated documents are available yet." icon={<FileText className="size-5" />} records={documents.map((document) => <Card key={document.id} className="rounded-xl border-border/70 bg-background p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-serif text-2xl capitalize text-foreground">{prettyStatus(document.documentType)}</p><p className="mt-1 text-xs text-muted-foreground">{document.documentNumber} · Issued {dateLabel(document.createdAt)}</p></div><p className="font-serif text-2xl text-foreground">{formatMoney(document.amount || 0, document.currency)}</p></div>{document.fileUrl && <div className="mt-6 border-t border-border/70 pt-5"><DocumentActions href={document.fileUrl} label="Document" icon={<FileText className="size-4" />} /></div>}
</Card>)} />}
        </div></section>
      </div>
    </PortalLayout>
  )
}

function RecordList({ records, empty, icon }: { records: React.ReactNode[]; empty: string; icon: React.ReactNode }) {
  return records.length ? <div className="grid gap-4">{records}</div> : <div className="flex flex-col items-center rounded-xl border border-dashed border-border/70 p-12 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-gold/15 text-primary">{icon}</span><p className="mt-4 text-sm text-muted-foreground">{empty}</p></div>
}

function DocumentActions({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  const downloadHref = `/api/documents/download?url=${encodeURIComponent(href)}`
  return <div className="flex flex-wrap gap-2"><a href={href} target="_blank" rel="noreferrer" aria-label={`View ${label}`} className="inline-flex min-h-11 items-center gap-2 rounded border border-border px-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-gold hover:text-primary">{icon}View</a><a href={downloadHref} download aria-label={`Download ${label} to device`} className="inline-flex min-h-11 items-center gap-2 rounded border border-border px-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-gold hover:text-primary"><Download className="size-4" />Download</a></div>
}
