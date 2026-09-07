'use client'

import { useState, useTransition } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { ArrowRight } from '@/components/ui/luxury-icons'
import { submitTradeApplication } from '@/lib/actions/trade-program'

const groups = [
  ['interior_designer', 'Interior designer'],
  ['architect', 'Architect'],
  ['real_estate_developer', 'Real estate developer'],
  ['hospitality', 'Hospitality group'],
  ['property_professional', 'Property professional'],
  ['other_design_professional', 'Other design professional'],
] as const

type Props = { isMember: boolean }

export default function TradeApplicationClient({ isMember }: Props) {
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
      else setMessage('Your application has been received. The studio will review it and contact you with the next step.')
    })
  }

  if (isMember) {
    return <section className="px-5 py-24 sm:px-8 lg:px-16"><div className="mx-auto max-w-3xl border border-border bg-muted/20 p-8 text-center sm:p-14"><p className="text-[10px] uppercase tracking-[0.28em] text-primary">Trade programme</p><h1 className="mt-4 font-serif text-4xl font-light sm:text-6xl">You are a trade member.</h1><p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-muted-foreground">Your professional access is active. Continue to your trade workspace.</p><Link href="/trade" className="mt-8 inline-flex min-h-12 items-center gap-2 bg-primary px-6 text-xs uppercase tracking-[0.16em] text-primary-foreground">Open trade portal <ArrowRight className="size-4" /></Link></div></section>
  }

  return <section id="apply" className="px-5 py-20 sm:px-8 sm:py-28 lg:px-16"><div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16"><div><p className="text-[10px] uppercase tracking-[0.28em] text-primary">Trade programme</p><h1 className="mt-5 font-serif text-5xl font-light leading-[0.95] sm:text-7xl">You are not a trade member yet.</h1><p className="mt-6 text-sm leading-7 text-muted-foreground">Complete the application to request professional access.</p></div><div className="border border-border bg-muted/20 p-5 sm:p-8">{!isSignedIn ? <div className="py-5"><h2 className="font-serif text-3xl font-light">Sign in to apply.</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Your application is connected to your Revamp account.</p><Link href="/sign-in?redirect_url=%2Ftrade-program%23apply" className="mt-6 inline-flex min-h-12 items-center gap-2 bg-primary px-5 text-xs uppercase tracking-[0.14em] text-primary-foreground">Sign in or create an account <ArrowRight className="size-4" /></Link></div> : <form onSubmit={submit} className="space-y-5"><div><h2 className="font-serif text-3xl font-light">Trade application</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Tell us who you are and what you do.</p></div><label className="grid gap-2 text-sm font-medium">Practice or company name<input required value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} className="min-h-12 border border-input bg-background px-3 text-sm" /></label><label className="grid gap-2 text-sm font-medium">Professional group<select required value={form.businessCategory} onChange={(event) => setForm({ ...form, businessCategory: event.target.value })} className="min-h-12 border border-input bg-background px-3 text-sm"><option value="">Choose one</option>{groups.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="grid gap-2 text-sm font-medium">Practice focus or trade type<input value={form.tradeType} onChange={(event) => setForm({ ...form, tradeType: event.target.value })} placeholder="Residential, hospitality, commercial" className="min-h-12 border border-input bg-background px-3 text-sm" /></label><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Tax or registration number<input value={form.taxNumber} onChange={(event) => setForm({ ...form, taxNumber: event.target.value })} className="min-h-12 border border-input bg-background px-3 text-sm" /></label><label className="grid gap-2 text-sm font-medium">Business licence link<input type="url" value={form.businessLicense} onChange={(event) => setForm({ ...form, businessLicense: event.target.value })} placeholder="https://" className="min-h-12 border border-input bg-background px-3 text-sm" /></label></div><label className="grid gap-2 text-sm font-medium">Certificate or portfolio link<input type="url" value={form.certificate} onChange={(event) => setForm({ ...form, certificate: event.target.value })} placeholder="https://" className="min-h-12 border border-input bg-background px-3 text-sm" /></label>{(error || message) && <p role={error ? 'alert' : 'status'} className={`border px-3 py-3 text-sm leading-6 ${error ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-emerald-300 bg-emerald-50 text-emerald-800'}`}>{error || message}</p>}<button type="submit" disabled={isPending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-primary px-5 text-xs uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-50">{isPending ? 'Sending application...' : 'Submit application'} <ArrowRight className="size-4" /></button></form>}</div></div></section>
}
