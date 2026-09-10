'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { X, CheckCircle2, Download, ArrowRight } from '@/components/ui/luxury-icons'
import { Button } from '@/components/ui/button'

const NEWSLETTER_DELAY_MS = 2 * 60 * 1000
const NEWSLETTER_DISMISSED_KEY = 'revamp-newsletter-dismissed'

export function NewsletterPopup() {
  const pathname = usePathname()
  const isAuthRoute = pathname === '/sign-in' || pathname.startsWith('/sign-in/') || pathname === '/sign-up' || pathname.startsWith('/sign-up/') || pathname === '/reset-password'
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (isAuthRoute) return
    const hasSeenPopup = window.localStorage.getItem(NEWSLETTER_DISMISSED_KEY)

    if (hasSeenPopup) return

    const timer = window.setTimeout(() => {
      setIsOpen(true)
    }, NEWSLETTER_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [isAuthRoute])

  const handleClose = () => {
    setIsOpen(false)
    window.localStorage.setItem(NEWSLETTER_DISMISSED_KEY, 'true')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return

    setIsLoading(true)
    setErrorMessage('')

    try {
      // Calls your exact API route (DB + Brevo)
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json().catch(() => ({}))

      // Handle server error responses
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to subscribe. Please try again.')
      }

      // Success (New subscriber OR already subscribed)
      setIsSubmitted(true)
      window.localStorage.setItem(NEWSLETTER_DISMISSED_KEY, 'true')
    } catch (error: any) {
      setErrorMessage(error.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthRoute || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300">
      <div
        className="relative w-full max-w-lg bg-background border border-border/80 p-8 sm:p-10 shadow-2xl rounded-lg animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Close newsletter popup"
        >
          <X className="h-5 w-5" />
        </button>

        {!isSubmitted ? (
          <div className="flex flex-col gap-5 text-center">
            {/* Badge */}
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1">
              <Download className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary font-medium">
                Join the Journal
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                A considered note for your inbox
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Subscribe for studio notes on interiors, materials, sourcing, projects, and the details that make a space feel complete.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-2 space-y-3">
              <div className="space-y-1">
                <input
                  type="email"
                  required
                  placeholder="Enter your primary email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                />
                {errorMessage && (
                  <p className="text-xs text-destructive text-left pl-1">{errorMessage}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-sm font-medium tracking-wide"
              >
                {isLoading ? (
                  'Processing...'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Join the newsletter <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <p className="text-[11px] text-muted-foreground/70">
              You can unsubscribe whenever you choose.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6 text-center animate-in fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-500">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-3xl font-bold">You are on the list</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                You are now on the studio newsletter list at <span className="text-foreground font-medium">{email}</span>.
              </p>
            </div>

            <Button
              onClick={handleClose}
              variant="outline"
              className="mt-2 border-border text-xs uppercase tracking-wider"
            >
              Continue Browsing
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
