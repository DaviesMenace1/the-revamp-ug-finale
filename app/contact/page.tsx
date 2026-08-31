'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Mail, MapPin, MessageCircle, Phone } from '@/components/ui/luxury-icons'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { submitServiceRequest } from '@/lib/actions/service-request'
import { siteContact } from '@/lib/site-config'

const INITIAL_FORM = { name: '', email: '', phone: '', company: '', serviceType: 'consultation', budget: '', timeline: '', projectDescription: '' }

export default function ContactPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const interest = params.get('interest')
    const product = params.get('product')
    const service = params.get('service')
    const allowedInterests = new Set(['consultation', 'interior_design', 'architecture', 'hospitality', 'sourcing', 'trade', 'trade_application', 'membership_waitlist', 'quote_request', 'product_inquiry', 'other'])
    if (interest && allowedInterests.has(interest)) {
      setForm((current) => ({
        ...current,
        serviceType: interest,
        projectDescription: product ? `I would like to discuss ${product}. ` : service ? `I would like to discuss ${service}. ` : current.projectDescription,
      }))
    }
  }, [])
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function updateField(key: keyof typeof INITIAL_FORM, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    startTransition(async () => {
      const response = await submitServiceRequest(form)
      if (!response.success) {
        setError(response.error || 'We could not send your inquiry. Please try again.')
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
        <section className="relative overflow-hidden bg-obsidian px-5 pb-16 pt-36 text-ivory sm:px-8 md:pb-24 md:pt-48 lg:px-16"><div className="absolute right-[-12%] top-[-30%] size-[40rem] rounded-full border border-gold/20" aria-hidden="true" /><div className="relative mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1fr_auto] lg:items-end"><div className="motion-reveal"><p className="text-[10px] uppercase tracking-[0.3em] text-gold">The Revamp studio / start a conversation</p><h1 className="mt-5 max-w-4xl font-serif text-6xl font-light leading-[0.9] sm:text-8xl lg:text-[8rem]">Tell us what is next.</h1><p className="mt-7 max-w-2xl text-base leading-7 text-ivory/65 sm:text-lg">A room, a property, a collection, or a question worth exploring. Give us the context and we will bring the right conversation to the table.</p></div><div className="flex items-center gap-3 border-l border-gold/45 pl-5 text-sm text-ivory/60"><span className="font-serif text-4xl text-ivory">01</span><span>Studio inquiry<br />Kampala · East Africa</span></div></div></section>

        <section className="px-5 py-12 sm:px-8 md:py-20 lg:px-16"><div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.72fr_1.28fr]"><aside className="motion-reveal space-y-8"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">The studio</p><h2 className="mt-4 font-serif text-4xl font-light sm:text-5xl">Useful context makes a better first meeting.</h2><p className="mt-5 text-sm leading-7 text-muted-foreground">Tell us where you are, what is not working, and what you want the space to become. If availability is not open, this form is the fastest way to request a consultation window.</p></div><div className="space-y-5 border-t border-border/70 pt-6 text-sm"><a href={siteContact.phoneHref} className="flex items-center gap-3 text-foreground hover:text-primary"><Phone className="size-4 text-gold" />{siteContact.phoneDisplay}</a><a href={`mailto:${siteContact.primaryEmail}`} className="flex items-center gap-3 text-foreground hover:text-primary"><Mail className="size-4 text-gold" />{siteContact.primaryEmail}</a><a href="https://wa.me/256783476807" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-foreground hover:text-primary"><MessageCircle className="size-4 text-gold" />WhatsApp the studio</a><p className="flex items-start gap-3 text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0 text-gold" />{siteContact.location}<br />Monday to Friday · 9:00–18:00</p></div></aside>

          <div className="motion-reveal rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-9" style={{ animationDelay: '100ms' }}>{submitted ? <div className="flex min-h-[28rem] flex-col items-center justify-center text-center"><span className="flex size-16 items-center justify-center rounded-full bg-gold/15 text-primary"><CheckCircle2 className="size-8" /></span><p className="mt-7 text-[10px] uppercase tracking-[0.28em] text-primary">Inquiry received</p><h2 className="mt-3 font-serif text-4xl font-light text-foreground">We will be in touch.</h2><p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">Your brief is with the studio. We will respond with the next useful step.</p><Button type="button" onClick={() => setSubmitted(false)} variant="outline" className="mt-7 min-h-11 rounded-none">Send another inquiry</Button></div> : <form onSubmit={handleSubmit} className="space-y-6"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Start here</p><h2 className="mt-3 font-serif text-3xl font-light text-foreground">A considered first brief.</h2></div><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="contact-name" className="mb-2 block text-xs font-medium text-foreground">Name</label><Input id="contact-name" value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Your name" className="min-h-12 rounded-none" required /></div><div><label htmlFor="contact-email" className="mb-2 block text-xs font-medium text-foreground">Email</label><Input id="contact-email" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="you@example.com" className="min-h-12 rounded-none" required /></div></div><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="contact-phone" className="mb-2 block text-xs font-medium text-foreground">Phone</label><Input id="contact-phone" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+256..." className="min-h-12 rounded-none" /></div><div><label htmlFor="contact-company" className="mb-2 block text-xs font-medium text-foreground">Company (optional)</label><Input id="contact-company" value={form.company} onChange={(event) => updateField('company', event.target.value)} placeholder="Company or property" className="min-h-12 rounded-none" /></div></div><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="contact-service" className="mb-2 block text-xs font-medium text-foreground">I am interested in</label><select id="contact-service" value={form.serviceType} onChange={(event) => updateField('serviceType', event.target.value)} className="min-h-12 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"><option value="consultation">A design consultation</option><option value="interior_design">Interior design</option><option value="architecture">Architecture or new build</option><option value="hospitality">Hospitality or commercial design</option><option value="sourcing">Sourcing and procurement</option><option value="trade">Trade partnership</option><option value="trade_application">Trade application</option><option value="membership_waitlist">Membership waiting list</option><option value="quote_request">Request a quote</option><option value="product_inquiry">A collection piece</option><option value="other">Something else</option></select></div><div><label htmlFor="contact-budget" className="mb-2 block text-xs font-medium text-foreground">Project range (optional)</label><select id="contact-budget" value={form.budget} onChange={(event) => updateField('budget', event.target.value)} className="min-h-12 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"><option value="">Choose a range</option><option value="under_10m">Under UGX 10 million</option><option value="10m_30m">UGX 10–30 million</option><option value="30m_75m">UGX 30–75 million</option><option value="75m_plus">UGX 75 million and above</option><option value="not_sure">Not sure yet</option></select></div></div><div><label htmlFor="contact-timeline" className="mb-2 block text-xs font-medium text-foreground">Timeline (optional)</label><Input id="contact-timeline" value={form.timeline} onChange={(event) => updateField('timeline', event.target.value)} placeholder="e.g. Planning to begin in October" className="min-h-12 rounded-none" /></div><div><label htmlFor="contact-message" className="mb-2 block text-xs font-medium text-foreground">Tell us about the brief</label><Textarea id="contact-message" value={form.projectDescription} onChange={(event) => updateField('projectDescription', event.target.value)} placeholder="Tell us about the space, what is not working, and what you would like it to become." rows={6} className="rounded-none" required /></div>{error && <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}<Button type="submit" disabled={isPending} className="min-h-12 w-full rounded-none text-xs uppercase tracking-[0.18em]">{isPending ? 'Sending your brief…' : 'Send inquiry'}<ArrowRight className="ml-2 size-4" /></Button><p className="text-center text-xs leading-5 text-muted-foreground">Prefer a scheduled appointment? <Link href="/book-consultation" className="text-primary underline underline-offset-4">See available consultation times</Link></p></form>}</div></div></section>
      </main>
      <SiteFooter />
    </>
  )
}
