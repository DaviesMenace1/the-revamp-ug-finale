'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { ArrowUpRight, FileText, Download } from 'lucide-react'

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
  category: string | null
  fileUrl: string
  createdAt: string
}

export default function DocumentsClient({ documents = [], loadError = null }: { documents: Document[]; loadError?: string | null }) {

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-8 pb-8">
        <header className="rounded-2xl bg-foreground px-6 py-8 text-background shadow-lift sm:px-10 sm:py-10"><p className="text-[10px] uppercase tracking-[0.28em] text-gold">Your studio archive</p><h1 className="mt-4 font-serif text-4xl sm:text-6xl">Documents</h1><p className="mt-4 max-w-xl text-sm leading-7 text-background/70">Contracts, invoices, estimates, receipts, and files shared with you — kept together and ready when you need them.</p></header>

        {loadError && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <span>{loadError}</span>
            <button type="button" onClick={() => window.location.reload()} className="min-h-11 shrink-0 font-medium underline underline-offset-4">
              Retry
            </button>
          </div>
        )}

        <div className="grid gap-3">

          {documents.map((doc) => (
            <Card key={doc.id} className="flex flex-col gap-4 rounded-xl border-border/70 bg-card p-5 shadow-soft transition-shadow hover:shadow-lift sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-primary"><FileText className="size-5" /></span><div className="min-w-0"><p className="truncate font-serif text-xl text-foreground">{doc.name}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{doc.category} · {new Date(doc.createdAt).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' })}</p></div></div>
              <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded border border-border px-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground hover:border-gold hover:text-primary"><Download className="size-4" /> Open <ArrowUpRight className="size-4" /></a>
            </Card>
          ))}

                    {documents.length === 0 && (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border/40 p-12 text-center">

              <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No documents shared with you yet.</p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
