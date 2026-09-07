'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Lock, X } from '@/components/ui/luxury-icons'
import { Button } from '@/components/ui/button'

type Props = {
  paymentUrl: string
  title?: string
  onClose: () => void
}

export default function PesapalEmbeddedCheckout({ paymentUrl, title = 'Secure payment', onClose }: Props) {
  const [frameError, setFrameError] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const safeUrl = useMemo(() => {
    try {
      const parsed = new URL(paymentUrl)
      if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('pesapal.com')) return ''
      return parsed.toString()
    } catch {
      return ''
    }
  }, [paymentUrl])

  useEffect(() => {
    if (!safeUrl) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const timeout = window.setTimeout(() => setShowFallback(true), 8000)
    return () => {
      document.body.style.overflow = previous
      window.clearTimeout(timeout)
    }
  }, [safeUrl])

  if (!safeUrl) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-foreground/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex h-full w-full flex-col overflow-hidden bg-background shadow-2xl sm:h-[min(900px,calc(100dvh-40px))] sm:max-w-5xl sm:rounded-xl sm:border sm:border-border/70">
        <div className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-card px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700"><Lock className="size-4" aria-hidden="true" /></span>
            <div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{title}</p><p className="text-xs text-muted-foreground">Secure payment powered by Pesapal</p></div>
          </div>
          <Button type="button" variant="ghost" onClick={onClose} className="size-10 shrink-0 rounded-full p-0" aria-label="Close payment"><X className="size-5" aria-hidden="true" /></Button>
        </div>
        <div className="relative min-h-0 flex-1 bg-white">
          {frameError ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center"><p className="font-serif text-3xl text-foreground">Payment could not be displayed here.</p><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Open the secure Pesapal payment page in a new tab to continue. Your order will remain pending until payment is verified.</p><a href={safeUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-md bg-primary px-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground">Open secure payment <ExternalLink className="size-4" aria-hidden="true" /></a></div>
          ) : <><iframe title={title} src={safeUrl} className="h-full w-full border-0" onError={() => setFrameError(true)} allow="payment *; fullscreen *" referrerPolicy="strict-origin-when-cross-origin" />{showFallback && <div className="absolute inset-x-4 bottom-4 flex flex-col gap-3 rounded-lg border border-border/80 bg-card/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-muted-foreground">Having trouble loading the secure payment page?</p><a href={safeUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground">Open in new tab <ExternalLink className="size-4" aria-hidden="true" /></a></div>}</>}
        </div>
      </div>
    </div>
  )
}
