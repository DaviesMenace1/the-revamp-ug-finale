'use client'

import { useState, useTransition } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { ArrowRight, Check } from '@/components/ui/luxury-icons'
import { submitTradeApplication } from '@/lib/actions/trade-program'

const groups = [
  ['interior_designer', 'Interior designer'],
  ['architect', 'Architect'],
  ['real_estate_developer', 'Real estate developer'],
  ['hospitality', 'Hospitality group'],
  ['property_professional', 'Property professional'],
  ['other_design_professional', 'Other design professional'],
] as const

export default function TradeApplicationClient() {
  const { isSignedIn } = useUser()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ businessName: '', businessCategory: '', tradeType: '', taxNumber: '', businessLicense: '', certificate: '' })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await submitTradeApplication(form)
      if (!result.success) setError(result.error || 'The application could not be submitted.')
      else setMessage('Your trade application has been received. The studio will review it and contact you with the next step.')
    })
  }

  return <section id="apply" className="border-t border-border/70 bg-muted/20 px-5 py-16 sm:px-8 md:py-24 lg:px-16"><div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24"><div><p className="text-xs uppercase tracking-[0.24em] text-primary">Request access</p><h2 className="mt-4 max-w-xl font-serif text-4xl font-light leading-tight sm:text-6xl">For practices shaping considered spaces.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">Trade access is reviewed for qualifying professionals and property teams. There is no programme fee. Approved applicants see product-specific trade pricing in the protected Trade Collections view.</p><div className="mt-7 space-y-3 text-sm text-foreground"><p className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-primary" />Interior designers, architects, developers, hospitality, and related practices.</p><p className="flex gap-3"><Check className="mt-5 size-4 shrink-0 text-primary" />Discounts are controlled per product by the studio.</p><p className="flex gap-3"><Check className="mt-5 size-4 shrink-0 text-primary" />Applications are reviewed before access is granted.</p></div></div><div className="rounded-xl border border-border/70 bg-background p-5 sm:p-8">{!isSignedIn ? <div className="py-8"><h3 className="font-serif text-3xl font-light">Sign in to begin.</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">A trade application is connected to your Revamp account so your approved collection and pricing remain private.</p><Link href="/sign-in?redirect_url=%2Ftrade-program%23apply" className="mt-6 inline-flex min-h-12 items-center gap-2 bg-primary px-5 text-xs uppercase tracking-[0.14em] text-primary-foreground">Sign in or create an account <ArrowRight className="size-4" /></Link></div> : <form onSubmit={submit} className="space-y-5"><div><h3 className="font-serif text-3xl font-light">Tell us about your practice.</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">The studio uses this information to review your request.</p></div><label className="grid gap-2 text-sm font-medium">Practice or company name<input required value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} className="min-h-12 border border-input bg-background px-3 text-sm" /></label><label className="grid gap-2 text-sm font-medium">Professional group<select required value={form.businessCategory} onChange={(event) => setForm({ ...form, businessCategory: event.target.value })} className="min-h-12 border border-input bg-background px-3 text-sm"><option value="">Choose one</option>{groups.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="grid gap-2 text-sm font-medium">Practice focus or trade type<input value={form.tradeType} onChange={(event) => setForm({ ...form, tradeType: event.target.value })} placeholder="Residential, hospitality, commercial" className="min-h-12 border border-input bg-background px-3 text-sm" /></label><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Tax or registration number<input value={form.taxNumber} onChange={(event) => setForm({ ...form, taxNumber: event.target.value })} className="min-h-12 border border-input bg-background px-3 text-sm" /></label><label className="grid gap-2 text-sm font-medium">Business licence link<input type="url" value={form.businessLicense} onChange={(event) => setForm({ ...form, businessLicense: event.target.value })} placeholder="https://" className="min-h-12 border border-input bg-background px-3 text-sm" /></label></div><label className="grid gap-2 text-sm font-medium">Certificate or portfolio link<input type="url" value={form.certificate} onChange={(event) => setForm({ ...form, certificate: event.target.value })} placeholder="https://" className="min-h-12 border border-input bg-background px-3 text-sm" /></label>{(error || message) && <p role={error ? 'alert' : 'status'} className={`border px-3 py-3 text-sm leading-6 ${error ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-emerald-300 bg-emerald-50 text-emerald-800'}`}>{error || message}</p>}<button type="submit" disabled={isPending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-primary px-5 text-xs uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-50">{isPending ? 'Sending application...' : 'Request trade access'} <ArrowRight className="size-4" /></button></form>}</div></div></section>
}
