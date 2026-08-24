'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Mail, MessageCircle, Send, Share2, X } from 'lucide-react'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatMoney } from '@/lib/utils'

export interface ShareableProduct {
  name: string
  price: number | string
  currency?: string
  image?: string
  description?: string
}

export function ProductShareSheet({
  product,
  open,
  onOpenChange,
}: {
  product: ShareableProduct
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [copied, setCopied] = useState(false)
  const [nativeShareAvailable, setNativeShareAvailable] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setNativeShareAvailable(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  useEffect(() => {
    if (!open) {
      setCopied(false)
      setNotice(null)
    }
  }, [open])

  const shareUrl = () => (typeof window === 'undefined' ? '' : window.location.href)
  const shareText = `Discover “${product.name}” at The Revamp UG.`

  const shareNative = async () => {
    if (!nativeShareAvailable) {
      setNotice('Native sharing is not available here. Choose a channel or copy the link.')
      return
    }

    try {
      await navigator.share({
        title: product.name,
        text: shareText,
        url: shareUrl(),
      })
      onOpenChange(false)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setNotice('Native sharing could not open. Choose a channel or copy the link.')
    }
  }

  const copyLink = async () => {
    const url = shareUrl()
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const input = document.createElement('textarea')
        input.value = url
        input.setAttribute('readonly', '')
        input.style.position = 'fixed'
        input.style.opacity = '0'
        document.body.appendChild(input)
        input.select()
        const copiedWithFallback = document.execCommand('copy')
        document.body.removeChild(input)
        if (!copiedWithFallback) throw new Error('Clipboard fallback failed')
      }
      setCopied(true)
      setNotice('Link copied. Share it wherever you like.')
      window.setTimeout(() => setCopied(false), 2400)
    } catch {
      setNotice('We could not copy the link. Select the page address and copy it manually.')
    }
  }

  const openChannel = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const encodedUrl = encodeURIComponent(shareUrl())
  const encodedText = encodeURIComponent(`${shareText} ${shareUrl()}`)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="safe-bottom max-h-[min(720px,92dvh)] rounded-t-2xl border-border bg-background p-0 sm:bottom-1/2 sm:left-1/2 sm:right-auto sm:top-auto sm:w-[calc(100%-2rem)] sm:max-w-xl sm:translate-x-[-50%] sm:translate-y-[50%] sm:rounded-2xl sm:border"
      >
        <SheetClose className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Close share options">
          <X className="size-5" aria-hidden="true" />
        </SheetClose>
        <SheetHeader className="border-b border-border/70 px-5 pb-4 pt-6 sm:px-7">
          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-primary">
            <Share2 className="size-3.5" aria-hidden="true" />
            Share a considered piece
          </div>
          <SheetTitle className="font-serif text-3xl font-normal tracking-tight">Share this piece</SheetTitle>
          <SheetDescription>Choose how you would like to send this Revamp selection.</SheetDescription>
        </SheetHeader>

        <div className="max-h-[calc(92dvh-9rem)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex gap-4 rounded-xl border border-border/70 bg-card p-3 shadow-lift">
            <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24">
              {product.image ? <img src={product.image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-primary"><Share2 className="size-6" aria-hidden="true" /></div>}
            </div>
            <div className="min-w-0 self-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">The Revamp collection</p>
              <p className="mt-1 truncate font-serif text-2xl leading-tight text-foreground">{product.name}</p>
              <p className="mt-2 text-sm font-medium tabular-nums text-primary">{formatMoney(product.price, product.currency)}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {nativeShareAvailable && (
              <button type="button" onClick={shareNative} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                <Send className="size-5" aria-hidden="true" />
                <span className="text-xs font-medium">Share via Device</span>
              </button>
            )}
            <button type="button" onClick={() => openChannel(`https://wa.me/?text=${encodedText}`)} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-border/70 bg-background text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <MessageCircle className="size-5 text-emerald-600" aria-hidden="true" />
              <span className="text-xs font-medium">WhatsApp</span>
            </button>
            <button type="button" onClick={() => openChannel(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-border/70 bg-background text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <span className="text-lg font-semibold text-blue-600" aria-hidden="true">f</span>
              <span className="text-xs font-medium">Facebook</span>
            </button>
            <button type="button" onClick={() => openChannel(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodedUrl}`)} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-border/70 bg-background text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <span className="text-lg font-semibold" aria-hidden="true">𝕏</span>
              <span className="text-xs font-medium">X</span>
            </button>
            <button type="button" onClick={() => openChannel(`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodedText}`)} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-border/70 bg-background text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <Mail className="size-5 text-primary" aria-hidden="true" />
              <span className="text-xs font-medium">Email</span>
            </button>
            <button type="button" onClick={copyLink} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-border/70 bg-muted/50 text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              {copied ? <Check className="size-5 text-emerald-600" aria-hidden="true" /> : <Copy className="size-5 text-primary" aria-hidden="true" />}
              <span className="text-xs font-medium">{copied ? 'Copied' : 'Copy link'}</span>
            </button>
          </div>

          <p role="status" aria-live="polite" className="mt-4 min-h-5 text-center text-xs text-muted-foreground">{notice}</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
