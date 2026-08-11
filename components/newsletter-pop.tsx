'use client'

import React, { useState, useEffect } from 'react'
import { X, Mail, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if the user has already seen/dismissed the popup
    const hasSeenPopup = localStorage.getItem('revamp-newsletter-dismissed')
    
    if (!hasSeenPopup) {
      // Delay prompt by 3.5 seconds so it's not jarring immediately on load
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 3500)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    // Save preference so popup doesn't reappear
    localStorage.setItem('revamp-newsletter-dismissed', 'true')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return

    setIsLoading(true)

    try {
      // Optional: Call your email subscription API route here
      // await fetch('/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) })

      // Simulate quick network delay
      await new Promise((resolve) => setTimeout(resolve, 600))

      setIsSubmitted(true)
      localStorage.setItem('revamp-newsletter-dismissed', 'true')

      // Auto-close 2 seconds after success
      setTimeout(() => {
        setIsOpen(false)
      }, 2500)
    } catch (error) {
      console.error('Newsletter error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="relative w-full max-w-md bg-background border border-border/80 p-8 shadow-2xl rounded-lg animate-in fade-in zoom-in-95 duration-200"
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
          <div className="flex flex-col gap-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/30">
              <Mail className="h-5 w-5 text-primary" />
            </div>

            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                Join The Circle
              </p>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground">
                Stay Inspired
              </h2>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Subscribe to receive curated interior design notes, exclusive project reveals, and early access to new collections.
            </p>

            <form onSubmit={handleSubmit} className="mt-2 space-y-3">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6"
              >
                {isLoading ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>

            <p className="text-[11px] text-muted-foreground/70">
              No spam, ever. Unsubscribe at any time.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center animate-in fade-in">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h3 className="font-serif text-2xl font-bold">You’re on the list.</h3>
            <p className="text-sm text-muted-foreground">
              Thank you for subscribing to The Revamp UG.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
