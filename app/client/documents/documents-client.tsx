'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { FileText, Download } from 'lucide-react'

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
      <div className="space-y-8">
                <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">Documents</h1>
          <p className="text-muted-foreground">Contracts, invoices, and files shared with you.</p>
        </div>

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
            <Card key={doc.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.category} · {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </a>
            </Card>
          ))}

          {documents.length === 0 && (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-border/40 p-12 text-center">
              <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No documents shared with you yet.</p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
