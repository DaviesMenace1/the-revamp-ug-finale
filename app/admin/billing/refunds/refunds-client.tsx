'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, RefreshCw, XCircle } from '@/components/ui/luxury-icons'
import { reconcileRefundRequest, reviewRefundRequest } from '@/lib/actions/order-lifecycle'

interface RefundRow {
  request: { id: string; orderId: string; amount: string; currency: string; reason: string; status: string; providerRefundId: string | null; providerStatus: string | null; createdAt: Date | string }
  order: { orderNumber: string; paymentStatus: string | null; paymentMode: string; userId: string }
  requester: { email: string | null; firstName: string | null; lastName: string | null } | null
}

function money(value: string, currency: string) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value) || 0)
}

function label(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function RefundsClient({ initialRequests }: { initialRequests: RefundRow[] }) {
  const [requests, setRequests] = useState(initialRequests)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const updateRequest = (requestId: string, patch: Partial<RefundRow['request']>) => {
    setRequests((current) => current.map((row) => row.request.id === requestId ? { ...row, request: { ...row.request, ...patch } } : row))
  }

  const review = (requestId: string, decision: 'approve' | 'reject') => {
    const note = window.prompt(decision === 'approve' ? 'Optional note for this refund:' : 'Reason for rejecting this request:')
    if (note === null && decision === 'reject') return
    setBusyId(requestId)
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await reviewRefundRequest(requestId, decision, note || undefined)
      if (result.success) {
        updateRequest(requestId, { status: result.status || (decision === 'approve' ? 'processing' : 'rejected') })
        setMessage(result.error || (decision === 'approve' ? 'Refund review submitted.' : 'Refund request rejected.'))
      } else {
        setError(result.error || 'The refund review could not be completed.')
      }
      setBusyId(null)
    })
  }

  const refreshStatus = (requestId: string) => {
    setBusyId(requestId)
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await reconcileRefundRequest(requestId)
      if (result.success) {
        updateRequest(requestId, { status: result.status })
        setMessage(result.status === 'completed' ? 'Refund completed and the customer was notified.' : result.status === 'failed' ? 'The provider marked this refund as failed.' : 'The refund is still processing with the provider.')
      } else {
        setError(result.error || 'The provider refund status could not be refreshed.')
      }
      setBusyId(null)
    })
  }

  return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><div><p className="text-[10px] uppercase tracking-[0.28em] text-primary">Finance operations</p><h1 className="mt-2 font-serif text-4xl font-light text-foreground sm:text-5xl">Refund requests</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Review customer requests before a provider refund is sent. Processing refunds can be refreshed here until Flutterwave reports a final status.</p></div>{(error || message) && <div role={error ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${error ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'}`}>{error || message}</div>}<div className="grid gap-4">{requests.map((row) => { const pending = row.request.status === 'requested'; const processing = row.request.status === 'processing'; const busy = isPending && busyId === row.request.id; const name = [row.requester?.firstName, row.requester?.lastName].filter(Boolean).join(' ') || row.requester?.email || 'Customer'; return <article key={row.request.id} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-medium text-foreground">{row.order.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">{name} · {row.requester?.email || 'No email'}</p><p className="mt-2 text-sm text-muted-foreground">{row.request.reason}</p></div><div className="text-left sm:text-right"><p className="font-semibold tabular-nums text-foreground">{money(row.request.amount, row.request.currency)}</p><span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${processing ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : row.request.status === 'completed' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-primary/10 text-primary'}`}>{label(row.request.status)}</span></div></div><div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3"><p>Payment: <span className="font-medium text-foreground">{label(row.order.paymentMode || 'pay_now')}</span></p><p>Requested: <span className="font-medium text-foreground">{new Date(row.request.createdAt).toLocaleString('en-UG')}</span></p><p>Provider: <span className="font-medium text-foreground">{row.request.providerStatus || row.request.providerRefundId || 'Not submitted'}</span></p></div>{pending && <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => review(row.request.id, 'approve')} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded bg-primary px-4 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground hover:bg-primary/90">{busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />} Approve and refund</button><button type="button" onClick={() => review(row.request.id, 'reject')} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded border border-destructive/40 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-destructive hover:bg-destructive/5"><XCircle className="size-4" aria-hidden="true" /> Reject</button></div>}{processing && <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={() => refreshStatus(row.request.id)} disabled={busy || !row.request.providerRefundId} className="inline-flex min-h-11 items-center gap-2 rounded border border-primary/40 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />} Refresh provider status</button><span className="text-xs text-muted-foreground">{row.request.providerRefundId ? 'Flutterwave is processing this refund. Refresh after the provider updates it.' : 'Waiting for Flutterwave to return a refund ID.'}</span></div>}</article>})}</div>{requests.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground"><RefreshCw className="mx-auto mb-3 size-6" aria-hidden="true" />No refund requests yet.</div>}</div>
}
