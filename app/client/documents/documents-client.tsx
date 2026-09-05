'use client'

import { useMemo, useState } from 'react'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { ArrowUpRight, CalendarDays, Download, FileText, Search } from '@/components/ui/luxury-icons'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Support', href: '/client/tickets' },
  { label: 'Documents', href: '/client/documents' },
]

type Document = {
  id: string
  name: string
  documentType: string
  category: string | null
  fileUrl: string
  createdAt: string
}

type DateFilter = 'all' | '30' | '90' | '365'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' })
}

function documentTypeLabel(value: string) {
  return value || 'Shared file'
}

export default function DocumentsClient({ documents = [], loadError = null }: { documents: Document[]; loadError?: string | null }) {
  const [search, setSearch] = useState('')
  const [now] = useState(() => Date.now())
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  const documentTypes = useMemo(
    () => Array.from(new Set(documents.map((document) => document.documentType || 'Shared file'))).sort(),
    [documents],
  )

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase()
    const cutoff = dateFilter === 'all' ? null : now - Number(dateFilter) * 24 * 60 * 60 * 1000
    return documents.filter((document) => {
      const matchesType = typeFilter === 'all' || document.documentType === typeFilter
      const searchable = `${document.name} ${document.documentType} ${document.category || ''}`.toLowerCase()
      const matchesSearch = !query || searchable.includes(query)
      const matchesDate = cutoff === null || new Date(document.createdAt).getTime() >= cutoff
      return matchesType && matchesSearch && matchesDate
    })
  }, [dateFilter, documents, now, search, typeFilter])

  const groupedDocuments = useMemo(() => {
    const groups = new Map<string, Document[]>()
    for (const document of filteredDocuments) {
      const type = document.documentType || 'Shared file'
      groups.set(type, [...(groups.get(type) || []), document])
    }
    return Array.from(groups.entries())
  }, [filteredDocuments])

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-8 pb-8">
        <header className="rounded-2xl bg-foreground px-6 py-8 text-background shadow-lift sm:px-10 sm:py-10">
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold">Your studio archive</p>
          <h1 className="mt-4 font-serif text-4xl sm:text-6xl">Documents</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-background/70">Contracts, invoices, estimates, receipts, and files shared with you are kept together and ready when you need them.</p>
        </header>

        {loadError && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <span>{loadError}</span>
            <button type="button" onClick={() => window.location.reload()} className="min-h-11 shrink-0 font-medium underline underline-offset-4">Retry</button>
          </div>
        )}

        <section aria-label="Filter documents" className="rounded-xl border border-border/70 bg-card p-4 shadow-soft sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="min-w-0 flex-1">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Search archive</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or type" className="min-h-11 w-full rounded border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary" />
              </span>
            </label>
            <label className="lg:w-52">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Document type</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="min-h-11 w-full rounded border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary">
                <option value="all">All types</option>
                {documentTypes.map((type) => <option key={type} value={type}>{documentTypeLabel(type)}</option>)}
              </select>
            </label>
            <label className="lg:w-48">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Date range</span>
              <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)} className="min-h-11 w-full rounded border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary">
                <option value="all">Any date</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground">
            <span>{filteredDocuments.length} of {documents.length} documents shown</span>
            {(search || typeFilter !== 'all' || dateFilter !== 'all') && <button type="button" onClick={() => { setSearch(''); setTypeFilter('all'); setDateFilter('all') }} className="font-medium text-primary underline underline-offset-4">Clear filters</button>}
          </div>
        </section>

        <div className="space-y-8">
          {groupedDocuments.map(([type, group]) => (
            <section key={type} aria-labelledby={`documents-${type.replace(/\s+/g, '-').toLowerCase()}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-primary">Archive section</p>
                  <h2 id={`documents-${type.replace(/\s+/g, '-').toLowerCase()}`} className="mt-1 font-serif text-2xl text-foreground">{documentTypeLabel(type)}</h2>
                </div>
                <span className="text-xs text-muted-foreground">{group.length} {group.length === 1 ? 'file' : 'files'}</span>
              </div>
              <div className="grid gap-3">
                {group.map((document) => (
                  <Card key={document.id} className="flex flex-col gap-4 rounded-xl border-border/70 bg-card p-5 shadow-soft transition-shadow hover:shadow-lift sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-primary"><FileText className="size-5" /></span>
                      <div className="min-w-0">
                        <p className="break-words font-serif text-xl text-foreground">{document.name}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"><span className="font-medium text-primary">{documentTypeLabel(document.documentType)}</span><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1"><CalendarDays className="size-3" aria-hidden="true" />{formatDate(document.createdAt)}</span></p>
                        {document.category && document.category !== document.documentType && <p className="mt-1 break-words text-xs text-muted-foreground">{document.category}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href={document.fileUrl} target="_blank" rel="noreferrer" aria-label={`View ${document.name}`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded border border-border px-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground hover:border-gold hover:text-primary"><FileText className="size-4" /> View <ArrowUpRight className="size-4" /></a>
                      <a href={`/api/documents/download?url=${encodeURIComponent(document.fileUrl)}`} download aria-label={`Download ${document.name} to device`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded border border-border px-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground hover:border-gold hover:text-primary"><Download className="size-4" /> Download</a>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}

          {groupedDocuments.length === 0 && (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border/40 p-12 text-center">
              <FileText className="mb-3 size-8 text-muted-foreground" />
              <p className="font-serif text-2xl text-foreground">No matching documents</p>
              <p className="mt-2 text-sm text-muted-foreground">Try another search term, type, or date range.</p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
