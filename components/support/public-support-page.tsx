'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { submitServiceRequest } from '@/lib/actions/service-request'
import { siteContact } from '@/lib/site-config'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowUpRight,
  CheckCircle2,
  LifeBuoy,
  Mail,
  MessageSquare,
  Phone,
} from '@/components/ui/luxury-icons'

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  serviceType: 'support_general',
  projectDescription: '',
}

const supportTopics = [
  ['support_order', 'Order or delivery help'],
  ['support_product', 'Product or collection question'],
  ['support_project', 'Project or consultation help'],
  ['support_account', 'Account or payment help'],
  ['support_general', 'Something else'],
] as const

export default function PublicSupportPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function updateField(key: keyof typeof INITIAL_FORM, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    startTransition(async () => {
      const response = await submitServiceRequest(form)
      if (!response.success) {
        setError(response.error || 'We could not send your support request. Please try again.')
        return
      }
      setSubmitted(true)
      setForm(INITIAL_FORM)
    })
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden bg-obsidian px-5 pb-14 pt-36 text-ivory sm:px-8 sm:pb-20 md:pt-44 lg:px-16">
          <div className="absolute -right-32 -top-32 size-[28rem] rounded-full border border-gold/20" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">The Revamp support desk</p>
              <h1 className="mt-5 max-w-4xl font-serif text-5xl font-light leading-[0.94] sm:text-7xl lg:text-8xl">How can we help?</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-ivory/70 sm:text-lg">Whether you are tracking an order, choosing a piece, or continuing a design conversation, send us the context and we will take it from there.</p>
            </div>
            <div className="flex items-center gap-3 border-l border-gold/45 pl-5 text-sm text-ivory/65"><LifeBuoy className="size-5 shrink-0 text-gold" aria-hidden="true" /><span>Human support<br />Kampala · East Africa</span></div>
          </div>
        </section>

        <section className="px-5 py-10 sm:px-8 sm:py-16 lg:px-16">
          <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12">
            <aside className="space-y-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-primary">Choose your route</p>
                <h2 className="mt-4 font-serif text-4xl font-light sm:text-5xl">A useful answer starts with context.</h2>
                <p className="mt-5 text-sm leading-7 text-muted-foreground">Send a request below for a written response, or use one of the direct channels when your question is time-sensitive.</p>
              </div>

              <div className="grid gap-3 border-t border-border/70 pt-6">
                <a href={`mailto:${siteContact.primaryEmail}`} className="flex min-h-12 items-center gap-3 text-sm text-foreground transition-colors hover:text-primary"><Mail className="size-4 shrink-0 text-gold" aria-hidden="true" />{siteContact.primaryEmail}</a>
                <a href={siteContact.phoneHref} className="flex min-h-12 items-center gap-3 text-sm text-foreground transition-colors hover:text-primary"><Phone className="size-4 shrink-0 text-gold" aria-hidden="true" />{siteContact.phoneDisplay}</a>
                <a href="https://wa.me/256783476807" target="_blank" rel="noreferrer" className="flex min-h-12 items-center gap-3 text-sm text-foreground transition-colors hover:text-primary"><MessageSquare className="size-4 shrink-0 text-gold" aria-hidden="true" />WhatsApp the studio<ArrowUpRight className="ml-auto size-4 shrink-0" aria-hidden="true" /></a>
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-5 shadow-soft">
                <p className="text-[10px] uppercase tracking-[0.22em] text-primary">Already a client?</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in to view private ticket history, replies, and project conversations.</p>
                <Link href="/sign-in?redirect_url=%2Fclient%2Ftickets" className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary hover:underline">View my tickets<ArrowUpRight className="size-4" aria-hidden="true" /></Link>
              </div>
            </aside>

            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft sm:p-8">
              {submitted ? (
                <div className="flex min-h-[25rem] flex-col items-center justify-center text-center">
                  <span className="flex size-16 items-center justify-center rounded-full bg-gold/15 text-primary"><CheckCircle2 className="size-8" aria-hidden="true" /></span>
                  <p className="mt-7 text-[10px] uppercase tracking-[0.28em] text-primary">Request received</p>
                  <h2 className="mt-3 font-serif text-4xl font-light text-foreground">We are on it.</h2>
                  <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">Your support request has reached the studio. We will respond using the contact details you provided.</p>
                  <Button type="button" onClick={() => setSubmitted(false)} variant="outline" className="mt-7 min-h-11 rounded-none">Send another request</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-primary">Public support request</p>
                    <h2 className="mt-3 font-serif text-3xl font-light text-foreground">Tell us what needs attention.</h2>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div><label htmlFor="support-name" className="mb-2 block text-xs font-medium text-foreground">Name</label><Input id="support-name" value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Your name" className="min-h-12 rounded-none" required /></div>
                    <div><label htmlFor="support-email" className="mb-2 block text-xs font-medium text-foreground">Email</label><Input id="support-email" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="you@example.com" className="min-h-12 rounded-none" required /></div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div><label htmlFor="support-phone" className="mb-2 block text-xs font-medium text-foreground">Phone (optional)</label><Input id="support-phone" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+256..." className="min-h-12 rounded-none" /></div>
                    <div><label htmlFor="support-topic" className="mb-2 block text-xs font-medium text-foreground">What can we help with?</label><select id="support-topic" value={form.serviceType} onChange={(event) => updateField('serviceType', event.target.value)} className="min-h-12 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">{supportTopics.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                  </div>
                  <div><label htmlFor="support-message" className="mb-2 block text-xs font-medium text-foreground">Message</label><Textarea id="support-message" value={form.projectDescription} onChange={(event) => updateField('projectDescription', event.target.value)} placeholder="Include an order number, project name, or any useful detail." rows={7} className="rounded-none" required /></div>
                  {error && <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
                  <Button type="submit" disabled={isPending} className="min-h-12 w-full rounded-none text-xs uppercase tracking-[0.18em]">{isPending ? 'Sending request…' : 'Send support request'}<ArrowUpRight className="ml-2 size-4" aria-hidden="true" /></Button>
                  <p className="text-center text-xs leading-5 text-muted-foreground">For private ticket replies and history, <Link href="/sign-in?redirect_url=%2Fclient%2Ftickets" className="text-primary underline underline-offset-4">sign in to your client portal</Link>.</p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
