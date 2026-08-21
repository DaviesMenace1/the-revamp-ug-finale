'use client'

import { useState } from 'react'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { FileText, Receipt, Download } from 'lucide-react'

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

type Quote = {
  id: string
  quoteNumber: string
  total: string
  status: string | null
  pdfUrl: string | null
  validUntil: string | null
  createdAt: string
}

type Invoice = {
  id: string
  invoiceNumber: string
  total: string
  amountPaid: string
  status: string
  pdfUrl: string | null
  receiptUrl: string | null
  dueDate: string | null
  createdAt: string
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(
    Number(value) || 0,
  )
}

export default function BillingClientView({ quotes = [], invoices = [] }: { quotes: Quote[]; invoices: Invoice[] }) {
  const [tab, setTab] = useState<'invoices' | 'quotes'>('invoices')

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">Billing</h1>
          <p className="text-muted-foreground">Your quotes, invoices, and payment receipts.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTab('invoices')}
            className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-medium ${tab === 'invoices' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setTab('quotes')}
            className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-medium ${tab === 'quotes' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            Quotes ({quotes.length})
          </button>
        </div>

        {tab === 'invoices' && (
          <div className="grid gap-3">
            {invoices.map((inv) => (
              <Card key={inv.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{inv.invoiceNumber}</p>
                    {inv.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        Due {new Date(inv.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[inv.status]}`}>
                    {inv.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-medium text-foreground">{formatCurrency(inv.total)}</p>
                  {Number(inv.amountPaid) > 0 && Number(inv.amountPaid) < Number(inv.total) && (
                    <p className="text-xs text-muted-foreground">Paid: {formatCurrency(inv.amountPaid)}</p>
                  )}
                </div>

                <div className="mt-3 flex gap-4">
                  {inv.pdfUrl && (
                    <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                      <FileText className="h-3.5 w-3.5" />
                      View Invoice
                    </a>
                  )}
                  {inv.receiptUrl && (
                    <a href={inv.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                      <Receipt className="h-3.5 w-3.5" />
                      View Receipt
                    </a>
                  )}
                </div>
              </Card>
            ))}

            {invoices.length === 0 && (
              <div className="flex flex-col items-center rounded-lg border border-dashed border-border/40 p-12 text-center">
                <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No invoices yet.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'quotes' && (
          <div className="grid gap-3">
            {quotes.map((q) => (
              <Card key={q.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{q.quoteNumber}</p>
                    {q.validUntil && (
                      <p className="text-xs text-muted-foreground">
                        Valid until {new Date(q.validUntil).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[q.status ?? 'pending']}`}>
                    {q.status ?? 'pending'}
                  </span>
                </div>
                <p className="mt-3 text-lg font-medium text-foreground">{formatCurrency(q.total)}</p>
                {q.pdfUrl && (
                  <a href={q.pdfUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <Download className="h-3.5 w-3.5" />
                    View Quote
                  </a>
                )}
              </Card>
            ))}

            {quotes.length === 0 && (
              <div className="flex flex-col items-center rounded-lg border border-dashed border-border/40 p-12 text-center">
                <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No quotes yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
