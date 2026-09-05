'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight } from '@/components/ui/luxury-icons'

interface NewsletterSignupProps { title?: string; subtitle?: string; placeholder?: string; buttonText?: string; className?: string }

export function NewsletterSignup({ title = 'Ideas live better in conversation.', subtitle = 'Join our journal for design insights, new arrivals, and stories from our world.', placeholder = 'Your email address', buttonText = 'Subscribe', className = '' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim()) return
    setIsLoading(true); setStatus('idle'); setMessage('')
    try {
      const response = await fetch('/api/newsletter/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) })
      const contentType = response.headers.get('content-type')
      const data: { error?: string; message?: string } = contentType?.includes('application/json') ? await response.json() : {}
      if (!response.ok) throw new Error(data.error || `Server error (${response.status}). Please try again later.`)
      setStatus('success'); setMessage(data.message || 'Thank you for subscribing.'); setEmail('')
    } catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : 'Something went wrong.') } finally { setIsLoading(false) }
  }

  return <div className={`mt-8 max-w-md ${className}`}><h2 className="font-serif text-3xl leading-none">{title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{subtitle}</p><form onSubmit={handleSubmit} className="mt-5 flex min-h-12 border-b border-foreground/40"><label htmlFor="newsletter-email" className="sr-only">{placeholder}</label><input id="newsletter-email" type="email" placeholder={placeholder} value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isLoading} className="min-w-0 flex-1 bg-transparent px-0 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60" /><button type="submit" aria-label={buttonText} disabled={isLoading || !email} className="inline-flex size-10 shrink-0 items-center justify-center text-foreground transition hover:text-gilded disabled:opacity-50"><ArrowRight className="size-4" /></button></form><p aria-live="polite" className={`mt-2 min-h-4 text-xs ${status === 'error' ? 'text-red-700' : 'text-muted-foreground'}`}>{message}</p></div>
}
