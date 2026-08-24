'use client'

import { useCallback, useState, useTransition } from 'react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, FileText, Upload, Loader2, Sparkles, Download, ExternalLink } from 'lucide-react'

import {
  createGeneratedFinancialDocument,
  createQuote,
  createInvoice,
  uploadReceipt,
  updateQuoteStatus,
} from '@/lib/actions/billing'

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

type GeneratedDocument = {
  id: string
  documentNumber: string
  documentType: string
  amount: string | null
  currency: string
  fileUrl: string | null
  createdAt: string
  clientFirstName: string | null
  clientLastName: string | null
  clientEmail: string
}

function formatCurrency(value: string | number | null) {
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
  documents: initialDocuments = [],
    loadError = null,
  storageConfigured = true,
}: {

  quotes: Quote[]
  invoices: Invoice[]
  clients: Client[]
  projects: ProjectOption[]
  documents?: GeneratedDocument[]
  loadError?: string | null
  storageConfigured?: boolean
}) {
  const [tab, setTab] = useState<'quotes' | 'invoices' | 'documents'>('invoices')
  const [quoteList, setQuoteList] = useState(initialQuotes)
  const [invoiceList, setInvoiceList] = useState(initialInvoices)
  const [documentList, setDocumentList] = useState(initialDocuments)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [receiptTarget, setReceiptTarget] = useState<Invoice | null>(null)
  const [isPending, startTransition] = useTransition()
    const [error, setError] = useState('')
  const [clientList, setClientList] = useState(clients)
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [clientLoadError, setClientLoadError] = useState('')

  const loadClients = useCallback(async () => {
    if (isLoadingClients) return
    setIsLoadingClients(true)
    setClientLoadError('')
    try {
      const response = await fetch('/api/admin/billing/clients', { cache: 'no-store' })
      const payload = (await response.json()) as { success?: boolean; clients?: Client[]; error?: string }
      if (!response.ok || !payload.success || !Array.isArray(payload.clients)) {
        throw new Error(payload.error || 'The client list could not be loaded.')
      }
      setClientList(payload.clients)
    } catch (loadError) {
      setClientLoadError(loadError instanceof Error ? loadError.message : 'The client list could not be loaded.')
    } finally {
      setIsLoadingClients(false)
    }
  }, [isLoadingClients])

  function openQuoteForm() {
    setShowQuoteForm(true)
    if (clientList.length === 0 && !clientLoadError) void loadClients()
  }

  function openInvoiceForm() {
    setShowInvoiceForm(true)
    if (clientList.length === 0 && !clientLoadError) void loadClients()
  }

  function openGenerateForm() {
    setShowGenerateForm(true)
    if (clientList.length === 0 && !clientLoadError) void loadClients()
  }

  function clientLabel(c: Client) {

    return `${[c.firstName, c.lastName].filter(Boolean).join(' ') || c.email} (${c.email})`
  }

  function handleQuoteSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await createQuote(formData)
      if (res.success && res.quote) {
        const client = clientList.find((c) => c.id === formData.get('userId'))
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

  function handleInvoiceSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await createInvoice(formData)
      if (res.success && res.invoice) {
        const client = clientList.find((c) => c.id === formData.get('userId'))
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

  function handleReceiptSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await uploadReceipt(formData)
      if (res.success && receiptTarget) {
        setInvoiceList((prev) => prev.map((inv) => (inv.id === receiptTarget.id ? { ...inv, status: 'paid' } : inv)))
        setReceiptTarget(null)
      } else {
        setError(res.error || 'Failed to upload receipt.')
      }
    })
  }

  function handleGeneratedDocumentSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const res = await createGeneratedFinancialDocument(formData)
      if (res.success && res.document) {
        const client = clientList.find((c) => c.id === formData.get('userId'))
        setDocumentList((prev) => [
          {
            id: res.document.id,
            documentNumber: res.document.documentNumber,
            documentType: res.document.documentType,
            amount: res.document.amount,
            currency: 'UGX',
            fileUrl: res.document.fileUrl,
            createdAt: new Date(res.document.createdAt).toISOString(),
            clientFirstName: client?.firstName ?? null,
            clientLastName: client?.lastName ?? null,
            clientEmail: client?.email ?? '',
          },
          ...prev,
        ])
        setShowGenerateForm(false)
        setTab('documents')
      } else {
        setError(res.error || 'Failed to generate the document.')
      }
    })
  }

  return (
        <div className="min-h-screen space-y-8 bg-muted/30 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-primary">The Revamp operations · 02</p>
          <h1 className="mt-3 font-serif text-5xl font-light leading-none text-foreground">Finance workspace</h1>

          <p className="mt-2 text-muted-foreground">Manual uploads and generated financial documents.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded" disabled={!storageConfigured} onClick={openQuoteForm}>

            <Plus className="mr-2 h-4 w-4" />
            Upload Quote
          </Button>
          <Button variant="outline" className="rounded" disabled={!storageConfigured} onClick={openInvoiceForm}>

            <Plus className="mr-2 h-4 w-4" />
            Upload Invoice
          </Button>
          <Button className="rounded" disabled={!storageConfigured} onClick={openGenerateForm}>

            <Sparkles className="mr-2 h-4 w-4" />
            Generate PDF
          </Button>
        </div>
      </div>

            {(loadError || clientLoadError) && (
        <div role="status" className="flex items-center justify-between gap-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <span>{clientLoadError || loadError}</span>
          <button type="button" onClick={() => { if (clientLoadError) void loadClients(); else window.location.reload() }} className="shrink-0 font-medium underline underline-offset-4">
            Retry
          </button>
        </div>
      )}

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {!storageConfigured && <div role="status" className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-foreground"><p className="font-medium">Document storage is not ready.</p><p className="mt-1 text-muted-foreground">Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL in the deployment environment before uploading or generating PDFs.</p></div>}

            <div className="grid gap-3 sm:grid-cols-3"><Card className="rounded-xl border-border/70 bg-card p-5 shadow-soft"><p className="font-serif text-3xl text-foreground">{clientList.length}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">Client profiles ready</p></Card><Card className="rounded-xl border-border/70 bg-card p-5 shadow-soft"><p className="font-serif text-3xl text-foreground">{invoiceList.length + quoteList.length}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">Uploaded records</p></Card><Card className="rounded-xl border-border/70 bg-card p-5 shadow-soft"><p className="font-serif text-3xl text-foreground">{documentList.length}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">Generated PDFs</p></Card></div>

      <div className="flex flex-wrap gap-2">
        {([

          ['invoices', `Invoices (${invoiceList.length})`],
          ['quotes', `Quotes (${quoteList.length})`],
          ['documents', `Generated PDFs (${documentList.length})`],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wider ${tab === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'invoices' && (
        <div className="grid gap-3">
          {invoiceList.map((inv) => (
            <Card key={inv.id} className="flex flex-col gap-4 rounded-xl border-border/70 bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">{inv.invoiceNumber}</p>
                <p className="text-sm text-muted-foreground">{[inv.clientFirstName, inv.clientLastName].filter(Boolean).join(' ') || inv.clientEmail}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium text-foreground">{formatCurrency(inv.total)}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[inv.status] || STATUS_COLORS.draft}`}>{inv.status}</span>
{inv.pdfUrl && <DocumentActions href={inv.pdfUrl} label={inv.invoiceNumber} />}
                {inv.receiptUrl && <DocumentActions href={inv.receiptUrl} label={`${inv.invoiceNumber} receipt`} tone="success" />}

                {inv.status !== 'paid' && <Button size="sm" variant="outline" className="rounded-none" onClick={() => setReceiptTarget(inv)}>Upload Receipt</Button>}
              </div>
            </Card>
          ))}
          {invoiceList.length === 0 && <p className="text-sm text-muted-foreground">No invoices yet.</p>}
        </div>
      )}

      {tab === 'quotes' && (
        <div className="grid gap-3">
          {quoteList.map((q) => (
            <Card key={q.id} className="flex flex-col gap-4 rounded-xl border-border/70 bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">{q.quoteNumber}</p>
                <p className="text-sm text-muted-foreground">{[q.clientFirstName, q.clientLastName].filter(Boolean).join(' ') || q.clientEmail}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium text-foreground">{formatCurrency(q.total)}</span>
                <select
                  aria-label={`Status for ${q.quoteNumber}`}
                  value={q.status ?? 'pending'}
                  onChange={(e) => {
                    const nextStatus = e.target.value
                    setQuoteList((prev) => prev.map((row) => (row.id === q.id ? { ...row, status: nextStatus } : row)))
                    updateQuoteStatus(q.id, nextStatus).then((res) => { if (!res.success) setError(res.error || 'Failed to update quote.') })
                  }}
                  className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[q.status ?? 'pending'] || STATUS_COLORS.draft}`}
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                                {q.pdfUrl && <DocumentActions href={q.pdfUrl} label={q.quoteNumber} />}

              </div>
            </Card>
          ))}
          {quoteList.length === 0 && <p className="text-sm text-muted-foreground">No quotes yet.</p>}
        </div>
      )}

      {tab === 'documents' && (
        <div className="grid gap-3">
          {documentList.map((document) => (
            <Card key={document.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">{document.documentNumber}</p>
                <p className="text-sm capitalize text-muted-foreground">{document.documentType.replace(/_/g, ' ')} · {[document.clientFirstName, document.clientLastName].filter(Boolean).join(' ') || document.clientEmail}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-foreground">{formatCurrency(document.amount)}</span>
                                {document.fileUrl && <DocumentActions href={document.fileUrl} label={document.documentNumber} />}

              </div>
            </Card>
          ))}
          {documentList.length === 0 && <p className="text-sm text-muted-foreground">No generated PDFs yet.</p>}
        </div>
      )}

      {showQuoteForm && <UploadModal title="Upload Quote" action={handleQuoteSubmit} isPending={isPending} onClose={() => setShowQuoteForm(false)} clients={clientList} clientLabel={clientLabel} projects={projects} isLoadingClients={isLoadingClients} clientLoadError={clientLoadError} onRetryClients={loadClients} extraField={{ name: 'validUntil', label: 'Valid until', type: 'date' }} />}
      {showInvoiceForm && <UploadModal title="Upload Invoice" action={handleInvoiceSubmit} isPending={isPending} onClose={() => setShowInvoiceForm(false)} clients={clientList} clientLabel={clientLabel} projects={projects} isLoadingClients={isLoadingClients} clientLoadError={clientLoadError} onRetryClients={loadClients} extraField={{ name: 'dueDate', label: 'Due date', type: 'date' }} />}
      {showGenerateForm && <GenerateDocumentModal action={handleGeneratedDocumentSubmit} isPending={isPending} onClose={() => setShowGenerateForm(false)} clients={clientList} clientLabel={clientLabel} projects={projects} isLoadingClients={isLoadingClients} clientLoadError={clientLoadError} onRetryClients={loadClients} />}

      {receiptTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-lift">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">Upload Receipt — {receiptTarget.invoiceNumber}</h2>
              <button type="button" aria-label="Close receipt upload" onClick={() => setReceiptTarget(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <form action={handleReceiptSubmit} className="mt-4 space-y-3">
              <input type="hidden" name="invoiceId" value={receiptTarget.id} />
              <label className="block text-xs text-muted-foreground" htmlFor="amountPaid">Amount paid</label>
              <Input id="amountPaid" name="amountPaid" type="number" min="0" step="0.01" placeholder={`Amount paid (total: ${receiptTarget.total})`} />
              <input name="file" type="file" accept="application/pdf,image/*" required className="text-sm" />
              <Button type="submit" disabled={isPending} className="w-full rounded-none">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload Receipt'}</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentActions({ href, label, tone = 'default' }: { href: string; label: string; tone?: 'default' | 'success' }) {
  const toneClass = tone === 'success' ? 'border-emerald-200 text-emerald-700 hover:border-emerald-400' : 'border-border text-foreground hover:border-gold hover:text-primary'
  const downloadHref = `/api/documents/download?url=${encodeURIComponent(href)}`
  return <div className="flex flex-wrap gap-2"><a href={href} target="_blank" rel="noreferrer" aria-label={`View ${label}`} className={`inline-flex min-h-10 items-center gap-2 rounded border px-3 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${toneClass}`}><ExternalLink className="size-3.5" />View</a><a href={downloadHref} download aria-label={`Download ${label} to device`} className={`inline-flex min-h-10 items-center gap-2 rounded border px-3 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${toneClass}`}><Download className="size-3.5" />Download</a></div>
}

function UploadModal({ title, action, isPending, onClose, clients, clientLabel, projects, isLoadingClients, clientLoadError, onRetryClients, extraField }: {

  title: string
  action: (formData: FormData) => void
  isPending: boolean
  onClose: () => void
  clients: Client[]
  clientLabel: (c: Client) => string
  projects: ProjectOption[]
  isLoadingClients: boolean
  clientLoadError: string
  onRetryClients: () => Promise<void>
  extraField: { name: string; label: string; type: string }
}) {
  const [selectedClientId, setSelectedClientId] = useState('')
  const visibleProjects = selectedClientId ? projects.filter((project) => project.userId === selectedClientId) : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">

      <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-lift">
        <div className="flex items-center justify-between"><h2 className="text-lg font-medium text-foreground">{title}</h2><button type="button" aria-label={`Close ${title.toLowerCase()} modal`} onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button></div>
        <form action={action} className="mt-4 space-y-3">
          <label className="block text-xs text-muted-foreground" htmlFor={`${extraField.name}-userId`}>Client</label>
          <select id={`${extraField.name}-userId`} name="userId" required disabled={isLoadingClients || clients.length === 0} value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)} className="w-full rounded border border-muted bg-transparent p-2.5 text-sm"><option value="">{isLoadingClients ? 'Loading client profiles…' : clients.length ? 'Select client...' : clientLoadError ? 'Client list unavailable — retry below' : 'No client profiles found'}</option>{clients.map((c) => <option key={c.id} value={c.id}>{clientLabel(c)}</option>)}</select>
          {clientLoadError && <p role="alert" className="text-xs text-rose-700">{clientLoadError} <button type="button" onClick={() => void onRetryClients()} className="font-medium underline underline-offset-4">Retry client list</button></p>}
          <label className="block text-xs text-muted-foreground" htmlFor={`${extraField.name}-projectId`}>Project (optional)</label>
          <select id={`${extraField.name}-projectId`} name="projectId" disabled={!selectedClientId} className="w-full rounded border border-muted bg-transparent p-2.5 text-sm"><option value="">{selectedClientId ? 'No project' : 'Select a client first'}</option>{visibleProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>

          <Input name="total" type="number" min="0" step="0.01" placeholder="Total amount (UGX)" required aria-label="Total amount" />
          <div><label className="text-xs text-muted-foreground" htmlFor={extraField.name}>{extraField.label}</label><Input id={extraField.name} name={extraField.name} type={extraField.type} className="mt-1" /></div>
          <textarea name="notes" placeholder="Notes (optional)" rows={2} className="w-full rounded border border-muted bg-transparent p-2.5 text-sm" />
          <div><label className="text-xs text-muted-foreground">PDF document</label><input name="file" type="file" accept="application/pdf,image/*" required className="mt-1 block text-sm" /></div>
          <Button type="submit" disabled={isPending} className="w-full rounded-none">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="mr-2 h-4 w-4" />Upload</>}</Button>
        </form>
      </div>
    </div>
  )
}

function GenerateDocumentModal({ action, isPending, onClose, clients, clientLabel, projects, isLoadingClients, clientLoadError, onRetryClients }: {
  action: (formData: FormData) => void
  isPending: boolean
  onClose: () => void
  clients: Client[]
  clientLabel: (c: Client) => string
  projects: ProjectOption[]
  isLoadingClients: boolean
  clientLoadError: string
  onRetryClients: () => Promise<void>
}) {
  const [selectedClientId, setSelectedClientId] = useState('')
  const visibleProjects = selectedClientId ? projects.filter((project) => project.userId === selectedClientId) : []

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-background p-6 shadow-lift">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-medium text-foreground">Generate Revamp PDF</h2><p className="mt-1 text-sm text-muted-foreground">Create a reusable, editable financial document.</p></div><button type="button" aria-label="Close document generator" onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button></div>
        <form action={action} className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="block text-xs text-muted-foreground" htmlFor="documentType">Document type</label><select id="documentType" name="documentType" required className="mt-1 w-full rounded border border-muted bg-transparent p-2.5 text-sm"><option value="quote">Quotation</option><option value="proforma_invoice">Proforma Invoice</option><option value="invoice">Invoice</option><option value="receipt">Company Receipt</option><option value="payment_receipt">Payment Receipt</option><option value="estimate">Project Estimate</option></select></div>
            <div><label className="block text-xs text-muted-foreground" htmlFor="userId">Client</label><select id="userId" name="userId" required disabled={isLoadingClients || clients.length === 0} value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)} className="mt-1 w-full rounded border border-muted bg-transparent p-2.5 text-sm"><option value="">{isLoadingClients ? 'Loading client profiles…' : clients.length ? 'Select client...' : clientLoadError ? 'Client list unavailable — retry below' : 'No client profiles found'}</option>{clients.map((c) => <option key={c.id} value={c.id}>{clientLabel(c)}</option>)}</select>
</div>
          </div>
          <div>{clientLoadError && <p role="alert" className="text-xs text-rose-700">{clientLoadError} <button type="button" onClick={() => void onRetryClients()} className="font-medium underline underline-offset-4">Retry client list</button></p>}
          <label className="block text-xs text-muted-foreground" htmlFor="projectId">Project (optional)</label><select id="projectId" name="projectId" disabled={!selectedClientId} className="mt-1 w-full rounded border border-muted bg-transparent p-2.5 text-sm"><option value="">{selectedClientId ? 'No project' : 'Select a client first'}</option>{visibleProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
          <div className="grid gap-3 sm:grid-cols-3"><Input name="description" placeholder="Line item description" required aria-label="Line item description" /><Input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" placeholder="Qty" aria-label="Quantity" /><Input name="unitPrice" type="number" min="0" step="0.01" placeholder="Unit price (UGX)" required aria-label="Unit price" /></div>
          <div className="grid gap-3 sm:grid-cols-4"><Input name="taxRate" type="number" min="0" step="0.01" defaultValue="0" placeholder="Tax %" aria-label="Tax rate" /><Input name="discount" type="number" min="0" step="0.01" defaultValue="0" placeholder="Discount (UGX)" aria-label="Discount" /><Input name="dueDate" type="date" aria-label="Due date" /><Input name="validUntil" type="date" aria-label="Valid until" /></div>
          <Input name="paymentMethod" placeholder="Payment method (optional)" aria-label="Payment method" />
          <textarea name="terms" placeholder="Terms and conditions (optional)" rows={3} className="w-full rounded border border-muted bg-transparent p-2.5 text-sm" />
          <textarea name="notes" placeholder="Notes (optional)" rows={2} className="w-full rounded border border-muted bg-transparent p-2.5 text-sm" />
          <Button type="submit" disabled={isPending} className="w-full rounded-none">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-2 h-4 w-4" />Generate PDF</>}</Button>
        </form>
      </div>
    </div>
  )
}
