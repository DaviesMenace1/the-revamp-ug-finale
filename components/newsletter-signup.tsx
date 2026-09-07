'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, Check } from '@/components/ui/luxury-icons'

interface NewsletterSignupProps {
  title?: string
  subtitle?: string
  placeholder?: string
  buttonText?: string
  className?: string
}

export function NewsletterSignup({
  title = 'A quieter way to stay close.',
  subtitle = 'Receive considered notes from the studio: new arrivals, room ideas, sourcing stories, and invitations worth opening.',
  placeholder = 'Your email address',
  buttonText = 'Join the journal',
  className = '',
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim()) return
    setIsLoading(true)
    setStatus('idle')
    setMessage('')

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const contentType = response.headers.get('content-type')
      const data: { error?: string; message?: string } = contentType?.includes('application/json') ? await response.json() : {}
      if (!response.ok) throw new Error(data.error || `Server error (${response.status}). Please try again later.`)
      setStatus('success')
      setMessage(data.message || 'You are on the list. Watch your inbox for a note from the studio.')
      setEmail('')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`mt-10 max-w-xl border border-border bg-muted/30 p-5 sm:p-6 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">The studio letter</p>
      <h2 className="mt-3 max-w-sm font-serif text-3xl leading-[0.98] sm:text-4xl">{title}</h2>
      <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{subtitle}</p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Check className="size-3 text-primary" /> New collections</span>
        <span className="inline-flex items-center gap-1.5"><Check className="size-3 text-primary" /> Studio stories</span>
        <span className="inline-flex items-center gap-1.5"><Check className="size-3 text-primary" /> No unnecessary noise</span>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 flex min-h-12 border border-foreground/25 bg-background p-1 focus-within:border-foreground/60">
        <label htmlFor="newsletter-email" className="sr-only">{placeholder}</label>
        <input id="newsletter-email" type="email" placeholder={placeholder} value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isLoading} className="min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60" />
        <button type="submit" disabled={isLoading || !email} className="inline-flex min-h-10 shrink-0 items-center gap-2 bg-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-background transition hover:bg-primary hover:text-primary-foreground disabled:opacity-50"><span className="hidden sm:inline">{isLoading ? 'Joining...' : buttonText}</span><ArrowRight className="size-4" /></button>
      </form>
      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">By subscribing, you agree to receive occasional studio correspondence. Unsubscribe whenever you like.</p>
      <p aria-live="polite" className={`mt-2 min-h-4 text-xs ${status === 'error' ? 'text-red-700' : status === 'success' ? 'text-emerald-700' : 'text-muted-foreground'}`}>{message}</p>
    </div>
  )
}
