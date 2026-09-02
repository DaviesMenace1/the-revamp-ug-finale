'use client'

import Link from 'next/link'
import { useState } from 'react'
import { siteContact } from '@/lib/site-config'
import { Button } from '@/components/ui/button'
import {
  LuxuryArrowUpRight,
  LuxuryLifeBuoy,
  LuxuryMail,
  LuxuryMessageSquare,
  LuxuryPhone,
  LuxuryX,
} from '@/components/icons/luxury-icons'

export default function FloatingSupportUtility() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section id="floating-support-card" className="w-[min(22rem,calc(100vw-2rem))] max-h-[min(70vh,32rem)] overflow-y-auto rounded-2xl border border-border/70 bg-background p-4 text-foreground shadow-2xl sm:p-5" aria-label="Support options">
          <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.24em] text-primary">The Revamp support</p>
              <h2 className="mt-1 font-serif text-2xl font-light">Need a hand?</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close support options" className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><LuxuryX className="size-4" aria-hidden="true" /></button>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Choose the quickest route and our team will help with the next useful step.</p>
          <div className="mt-4 grid gap-2">
            <Link href="/support" onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-3 rounded-lg bg-foreground px-4 py-3 text-sm text-background transition-colors hover:bg-primary hover:text-primary-foreground"><LuxuryLifeBuoy className="size-4 shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1">Start a support request</span><LuxuryArrowUpRight className="size-4 shrink-0" aria-hidden="true" /></Link>
            <Link href="/sign-in?redirect_url=%2Fclient%2Ftickets" onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:border-primary hover:text-primary"><LuxuryMessageSquare className="size-4 shrink-0 text-gold" aria-hidden="true" /><span className="min-w-0 flex-1">View my private tickets</span><LuxuryArrowUpRight className="size-4 shrink-0" aria-hidden="true" /></Link>
            <a href="https://wa.me/256783476807" target="_blank" rel="noreferrer" className="flex min-h-12 items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:border-primary hover:text-primary"><LuxuryMessageSquare className="size-4 shrink-0 text-gold" aria-hidden="true" /><span className="min-w-0 flex-1">WhatsApp the studio</span><LuxuryArrowUpRight className="size-4 shrink-0" aria-hidden="true" /></a>
            <div className="grid grid-cols-2 gap-2">
              <a href={siteContact.phoneHref} className="flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs transition-colors hover:border-primary hover:text-primary"><LuxuryPhone className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">Call us</span></a>
              <a href={`mailto:${siteContact.primaryEmail}`} className="flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs transition-colors hover:border-primary hover:text-primary"><LuxuryMail className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">Email us</span></a>
            </div>
          </div>
        </section>
      )}
      <Button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="floating-support-card" className="min-h-12 rounded-full bg-foreground px-4 text-background shadow-xl transition-transform hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground sm:px-5">
        {open ? <LuxuryX className="mr-2 size-4" aria-hidden="true" /> : <LuxuryLifeBuoy className="mr-2 size-4" aria-hidden="true" />}
        <span className="text-xs font-semibold uppercase tracking-[0.14em]">Support</span>
      </Button>
    </div>
  )
}
