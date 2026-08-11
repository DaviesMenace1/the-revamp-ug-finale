'use client'

import React, { useState, useEffect } from 'react'
import { X, Mail, CheckCircle2, Download, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Check if the user has already seen or dismissed the popup
    const hasSeenPopup = localStorage.getItem('revamp-newsletter-dismissed')
    
    if (!hasSeenPopup) {
      // Trigger popup 4 seconds after arrival
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('revamp-newsletter-dismissed', 'true')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return

    setIsLoading(true)
    setErrorMessage('')

    try {
      // 🚀 Calls your existing endpoint that saves to DB + Brevo
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Something went wrong. Please try again.')
      }

      setIsSubmitted(true)
      localStorage.setItem('revamp-newsletter-dismissed', 'true')
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to subscribe. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

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
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1">
              <Download className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary font-medium">
                Complimentary Design Guide
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Elevate Your Living Space
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Subscribe today to receive our exclusive <strong className="text-foreground font-semibold">2026 Interior Styling Guide (PDF)</strong> directly to your inbox, plus private access to new collection releases.
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
                    Claim Free Design PDF <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <p className="text-[11px] text-muted-foreground/70">
              Instant PDF download delivered upon subscription. No spam, ever.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6 text-center animate-in fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-500">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-3xl font-bold">Guide Sent to Your Inbox!</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                We’ve synced your subscription to Brevo and sent your complimentary <strong className="text-foreground">Interior Styling Guide PDF</strong>.
              </p>
            </div>

            <Button
              onClick={handleClose}
              variant="outline"
              className="mt-2 border-border"
            >
              Continue Browsing
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
