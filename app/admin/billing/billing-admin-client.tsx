'use client'

import { useState, useRef, useTransition } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, FileText, Upload, Loader2 } from 'lucide-react'
import { createQuote, createInvoice, uploadReceipt, updateQuoteStatus } from '@/lib/actions/billing'

type Client = { id: string; firstName: string | null; lastName: string | null; email: string }
type ProjectOption = { id: string; title: string; userId: string | null }

type Quote = {
  id: string
  quoteNumber: string
  total: string
  status: string | null
  pdfUrl: string | null
  validUntil: string | null
  createdAt: string
  clientFirstName: string | null
  clientLastName: string | null
  clientEmail: string
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
  clientFirstName: string | null
  clientLastName: string | null
  clientEmail: string
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(
    Number(value) || 0,
  )
}

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

export default function BillingAdminClient({
  quotes: initialQuotes = [],
  invoices: initialInvoices = [],
  clients = [],
  projects = [],
}: {
  quotes: Quote[]
  invoices: Invoice[]
  clients: Client[]
  projects: ProjectOption[]
}) {
  const [tab, setTab] = useState<'quotes' | 'invoices'>('invoices')
  const [quoteList, setQuoteList] = useState(initialQuotes)
  const [invoiceList, setInvoiceList] = useState(initialInvoices)

  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [receiptTarget, setReceiptTarget] = useState<Invoice | null>(null)

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function clientLabel(c: Client) {
    return `${[c.firstName, c.lastName].filter(Boolean).join(' ') || c.email} (${c.email})`
  }

  async function handleQuoteSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await createQuote(formData)
      if (res.success && res.quote) {
        const client = clients.find((c) => c.id === formData.get('userId'))
        setQuoteList((prev) => [
          {
            id: res.quote.id,
            quoteNumber: res.quote.quoteNumber,
            total: res.quote.total,
            status: res.quote.status,
            pdfUrl: res.quote.pdfUrl,
            validUntil: res.quote.validUntil ? new Date(res.quote.validUntil).toISOString() : null,
            createdAt: new Date().toISOString(),
            clientFirstName: client?.firstName ?? null,
            clientLastName: client?.lastName ?? null,
            clientEmail: client?.email ?? '',
          },
          ...prev,
        ])
        setShowQuoteForm(false)
      } else {
        setError(res.error || 'Failed to upload quote.')
      }
    })
  }

  async function handleInvoiceSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await createInvoice(formData)
      if (res.success && res.invoice) {
        const client = clients.find((c) => c.id === formData.get('userId'))
        setInvoiceList((prev) => [
          {
            id: res.invoice.id,
            invoiceNumber: res.invoice.invoiceNumber,
            total: res.invoice.total,
            amountPaid: res.invoice.amountPaid,
            status: res.invoice.status,
            pdfUrl: res.invoice.pdfUrl,
            receiptUrl: null,
            dueDate: res.invoice.dueDate ? new Date(res.invoice.dueDate).toISOString() : null,
            createdAt: new Date().toISOString(),
            clientFirstName: client?.firstName ?? null,
            clientLastName: client?.lastName ?? null,
            clientEmail: client?.email ?? '',
          },
          ...prev,
        ])
        setShowInvoiceForm(false)
      } else {
        setError(res.error || 'Failed to upload invoice.')
      }
    })
  }

  async function handleReceiptSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await uploadReceipt(formData)
      if (res.success && receiptTarget) {
        setInvoiceList((prev) =>
          prev.map((inv) => (inv.id === receiptTarget.id ? { ...inv, status: 'paid' } : inv)),
        )
        setReceiptTarget(null)
      } else {
        setError(res.error || 'Failed to upload receipt.')
      }
    })
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground">Billing</h1>
          <p className="text-muted-foreground mt-2">
            Quotes, invoices, and receipts — uploaded documents, scoped per client.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-none" onClick={() => setShowQuoteForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Quote
          </Button>
          <Button className="rounded-none" onClick={() => setShowInvoiceForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Invoice
          </Button>
        </div>
      </div>

      {error && <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <div className="flex gap-2">
        <button
          onClick={() => setTab('invoices')}
          className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-medium ${tab === 'invoices' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
        >
          Invoices ({invoiceList.length})
        </button>
        <button
          onClick={() => setTab('quotes')}
          className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-medium ${tab === 'quotes' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
        >
          Quotes ({quoteList.length})
        </button>
      </div>

      {tab === 'invoices' && (
        <div className="grid gap-3">
          {invoiceList.map((inv) => (
            <Card key={inv.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{inv.invoiceNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {[inv.clientFirstName, inv.clientLastName].filter(Boolean).join(' ') || inv.clientEmail}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-foreground">{formatCurrency(inv.total)}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[inv.status]}`}>
                  {inv.status}
                </span>
                {inv.pdfUrl && (
                  <a href={inv.pdfUrl} target="_blank" rel="noreferrer">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
                {inv.status !== 'paid' && (
                  <Button size="sm" variant="outline" className="rounded-none" onClick={() => setReceiptTarget(inv)}>
                    Upload Receipt
                  </Button>
                )}
              </div>
            </Card>
          ))}
          {invoiceList.length === 0 && <p className="text-sm text-muted-foreground">No invoices yet.</p>}
        </div>
      )}

      {tab === 'quotes' && (
        <div className="grid gap-3">
          {quoteList.map((q) => (
            <Card key={q.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{q.quoteNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {[q.clientFirstName, q.clientLastName].filter(Boolean).join(' ') || q.clientEmail}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-foreground">{formatCurrency(q.total)}</span>
                <select
                  value={q.status ?? 'pending'}
                  onChange={(e) => {
                    updateQuoteStatus(q.id, e.target.value)
                    setQuoteList((prev) => prev.map((row) => (row.id === q.id ? { ...row, status: e.target.value } : row)))
                  }}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium border-0 ${STATUS_COLORS[q.status ?? 'pending']}`}
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {q.pdfUrl && (
                  <a href={q.pdfUrl} target="_blank" rel="noreferrer">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
              </div>
            </Card>
          ))}
          {quoteList.length === 0 && <p className="text-sm text-muted-foreground">No quotes yet.</p>}
        </div>
      )}

      {showQuoteForm && (
        <UploadModal
          title="Upload Quote"
          action={handleQuoteSubmit}
          isPending={isPending}
          onClose={() => setShowQuoteForm(false)}
          clients={clients}
          clientLabel={clientLabel}
          extraField={{ name: 'validUntil', label: 'Valid until', type: 'date' }}
        />
      )}

      {showInvoiceForm && (
        <UploadModal
          title="Upload Invoice"
          action={handleInvoiceSubmit}
          isPending={isPending}
          onClose={() => setShowInvoiceForm(false)}
          clients={clients}
          clientLabel={clientLabel}
          extraField={{ name: 'dueDate', label: 'Due date', type: 'date' }}
        />
      )}

      {receiptTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">Upload Receipt — {receiptTarget.invoiceNumber}</h2>
              <button onClick={() => setReceiptTarget(null)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form action={handleReceiptSubmit} className="mt-4 space-y-3">
              <input type="hidden" name="invoiceId" value={receiptTarget.id} />
              <Input name="amountPaid" type="number" placeholder={`Amount paid (total: ${receiptTarget.total})`} />
              <input name="file" type="file" accept="application/pdf,image/*" required className="text-sm" />
              <Button type="submit" disabled={isPending} className="w-full rounded-none">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload Receipt'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function UploadModal({
  title,
  action,
  isPending,
  onClose,
  clients,
  clientLabel,
  extraField,
}: {
  title: string
  action: (formData: FormData) => void
  isPending: boolean
  onClose: () => void
  clients: Client[]
  clientLabel: (c: Client) => string
  extraField: { name: string; label: string; type: string }
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">{title}</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <form action={action} className="mt-4 space-y-3">
          <select name="userId" required className="w-full rounded border border-muted bg-transparent p-2.5 text-sm">
            <option value="">Select client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {clientLabel(c)}
              </option>
            ))}
          </select>
          <Input name="total" type="number" step="0.01" placeholder="Total amount (UGX)" required />
          <div>
            <label className="text-xs text-muted-foreground">{extraField.label}</label>
            <Input name={extraField.name} type={extraField.type} className="mt-1" />
          </div>
          <textarea name="notes" placeholder="Notes (optional)" rows={2} className="w-full rounded border border-muted bg-transparent p-2.5 text-sm" />
          <div>
            <label className="text-xs text-muted-foreground">PDF document</label>
            <input name="file" type="file" accept="application/pdf,image/*" required className="mt-1 text-sm block" />
          </div>
          <Button type="submit" disabled={isPending} className="w-full rounded-none">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}