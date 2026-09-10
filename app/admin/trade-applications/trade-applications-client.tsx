'use client'

import { useState, useTransition } from 'react'
import { Save, Users } from '@/components/ui/luxury-icons'
import { reviewTradeApplication } from '@/lib/actions/trade-program'

type Application = {
  id: string
  userId: string
  businessName: string
  businessCategory: string | null
  tradeType: string | null
  taxNumber: string | null
  businessLicense: string | null
  certificate: string | null
  status: string | null
  tier: string | null
  discountRate: string | null
  appliedAt: string
  approvedAt: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
}

export default function TradeApplicationsClient({ initialApplications }: { initialApplications: Application[] }) {
  const [applications, setApplications] = useState(initialApplications)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function save(application: Application) {
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await reviewTradeApplication({ id: application.id, status: application.status || 'pending', tier: application.tier || 'approved', discountRate: Number(application.discountRate || 0) })
      if (!result.success) setError(result.error || 'The application could not be saved.')
      else setMessage(`${application.businessName} was updated.`)
    })
  }

  return <div className="min-w-0 space-y-8 p-5 sm:p-8"><header className="flex flex-col gap-4 border-b border-border/70 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.24em] text-primary">Studio workspace</p><h1 className="mt-3 font-serif text-4xl font-light text-foreground sm:text-5xl">Trade applications</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Review qualifying professional practices, approve access, and set the default account relationship. Product discounts remain editable on each product.</p></div><Users className="size-8 text-primary" /></header>{(error || message) && <div role={error ? 'alert' : 'status'} className={`border px-4 py-3 text-sm ${error ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-emerald-300 bg-emerald-50 text-emerald-800'}`}>{error || message}</div>}<div className="grid gap-5">{applications.map((application) => <article key={application.id} className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-7"><div className="flex flex-col gap-4 border-b border-border/60 pb-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-primary">{application.businessCategory?.replaceAll('_', ' ') || 'Professional practice'}</p><h2 className="mt-2 font-serif text-3xl font-light text-foreground">{application.businessName}</h2><p className="mt-2 text-sm text-muted-foreground">{[application.firstName, application.lastName].filter(Boolean).join(' ') || 'Applicant'} · {application.email || 'No email'} · Applied {new Date(application.appliedAt).toLocaleDateString('en-UG')}</p></div><span className="inline-flex w-fit rounded-full bg-muted px-3 py-1 text-xs capitalize text-foreground">{application.status || 'pending'}</span></div><div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><p><span className="block text-xs uppercase tracking-[0.14em] text-muted-foreground">Practice focus</span><span className="mt-1 block text-foreground">{application.tradeType || 'Not provided'}</span></p><p><span className="block text-xs uppercase tracking-[0.14em] text-muted-foreground">Tax / registration</span><span className="mt-1 block text-foreground">{application.taxNumber || 'Not provided'}</span></p><p><span className="block text-xs uppercase tracking-[0.14em] text-muted-foreground">Business licence</span>{application.businessLicense ? <a href={application.businessLicense} target="_blank" rel="noreferrer" className="mt-1 block break-all text-primary underline">Open link</a> : <span className="mt-1 block text-foreground">Not provided</span>}</p><p><span className="block text-xs uppercase tracking-[0.14em] text-muted-foreground">Portfolio / certificate</span>{application.certificate ? <a href={application.certificate} target="_blank" rel="noreferrer" className="mt-1 block break-all text-primary underline">Open link</a> : <span className="mt-1 block text-foreground">Not provided</span>}</p></div><div className="mt-6 grid gap-4 border-t border-border/60 pt-5 sm:grid-cols-3"><label className="grid gap-2 text-sm font-medium"><span>Review status</span><select value={application.status || 'pending'} onChange={(event) => setApplications((current) => current.map((item) => item.id === application.id ? { ...item, status: event.target.value } : item))} className="min-h-11 border border-input bg-background px-3 text-sm"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label><label className="grid gap-2 text-sm font-medium"><span>Trade tier label</span><input value={application.tier || ''} onChange={(event) => setApplications((current) => current.map((item) => item.id === application.id ? { ...item, tier: event.target.value } : item))} className="min-h-11 border border-input bg-background px-3 text-sm" placeholder="Approved trade" /></label><label className="grid gap-2 text-sm font-medium"><span>Default discount (%)</span><input type="number" min="0" max="100" step="0.5" value={application.discountRate || ''} onChange={(event) => setApplications((current) => current.map((item) => item.id === application.id ? { ...item, discountRate: event.target.value } : item))} className="min-h-11 border border-input bg-background px-3 text-sm" /></label></div><button type="button" onClick={() => save(application)} disabled={isPending} className="mt-5 inline-flex min-h-11 items-center gap-2 bg-primary px-5 text-xs uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-50"><Save className="size-4" />{isPending ? 'Saving...' : 'Save review'}</button></article>)}{applications.length === 0 && <div className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No trade applications have been submitted.</div>}</div></div>
}
