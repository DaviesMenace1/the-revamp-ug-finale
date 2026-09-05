'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Mail, MessageCircle, Send, Share2, X } from '@/components/ui/luxury-icons'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatMoney } from '@/lib/utils'

export interface ShareableProduct {
  name: string
  price: number | string
  currency?: string
  image?: string
  description?: string
}

const POPUP_WIDTH = 720
const POPUP_HEIGHT = 640

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
    const left = Math.max(0, Math.round((window.screen.width - POPUP_WIDTH) / 2))
    const top = Math.max(0, Math.round((window.screen.height - POPUP_HEIGHT) / 2))
    const popup = window.open(url, '_blank', `popup=yes,width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},noopener,noreferrer`)
    if (!popup) {
      setNotice('Your browser blocked the share window. Allow pop-ups for this site or copy the link instead.')
      return
    }
    popup.opener = null
  }

  const encodedUrl = encodeURIComponent(shareUrl())
  const encodedText = encodeURIComponent(`${shareText} ${shareUrl()}`)
  const channels = [
    {
      label: 'WhatsApp',
      icon: <MessageCircle className="size-5 text-emerald-600" aria-hidden="true" />,
      onClick: () => openChannel(`https://wa.me/?text=${encodedText}`),
    },
    {
      label: 'Facebook',
      icon: <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white" aria-hidden="true">f</span>,
      onClick: () => openChannel(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`),
    },
    {
      label: 'X',
      icon: <span className="text-lg font-semibold leading-none text-foreground" aria-hidden="true">𝕏</span>,
      onClick: () => openChannel(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodedUrl}`),
    },
    {
      label: 'LinkedIn',
      icon: <svg className="size-5 text-blue-700" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.21 0 22.23 0Z" /></svg>,
      onClick: () => openChannel(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`),
    },
    {
      label: 'Email',
      icon: <Mail className="size-5 text-primary" aria-hidden="true" />,
      onClick: () => openChannel(`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodedText}`),
    },
    {
      label: copied ? 'Copied' : 'Copy link',
      icon: copied ? <Check className="size-5 text-emerald-600" aria-hidden="true" /> : <Copy className="size-5 text-primary" aria-hidden="true" />,
      onClick: copyLink,
    },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="safe-bottom max-h-[min(720px,92dvh)] rounded-t-2xl border-border bg-background p-0 sm:inset-x-auto sm:right-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-[38rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:shadow-2xl"
      >
        <SheetClose className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Close share options">
          <X className="size-5" aria-hidden="true" />
        </SheetClose>
        <SheetHeader className="border-b border-border/70 px-5 pb-4 pt-6 sm:px-7 sm:pt-7">
          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-primary">
            <Share2 className="size-3.5" aria-hidden="true" />
            Share a considered piece
          </div>
          <SheetTitle className="font-serif text-3xl font-normal tracking-tight">Share this piece</SheetTitle>
          <SheetDescription>Send this selection to someone who would appreciate it.</SheetDescription>
        </SheetHeader>

        <div className="max-h-[calc(92dvh-9rem)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex gap-4 rounded-xl border border-border/70 bg-card p-3 shadow-lift sm:p-4">
            <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24">
              {product.image ? <img src={product.image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-primary"><Share2 className="size-6" aria-hidden="true" /></div>}
            </div>
            <div className="min-w-0 self-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">The Revamp collection</p>
              <p className="mt-1 line-clamp-2 font-serif text-xl leading-tight text-foreground sm:text-2xl">{product.name}</p>
              <p className="mt-2 text-sm font-medium tabular-nums text-primary">{formatMoney(product.price, product.currency)}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {nativeShareAvailable && (
              <button type="button" onClick={shareNative} aria-label="Share using your device" className="flex min-h-20 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary px-3 text-center text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                <Send className="size-5 shrink-0" aria-hidden="true" />
                <span className="text-xs font-medium">Share via Device</span>
              </button>
            )}
            {channels.map((channel) => (
              <button key={channel.label} type="button" onClick={channel.onClick} aria-label={channel.label} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-border/70 bg-background px-2 text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                {channel.icon}
                <span className="text-xs font-medium">{channel.label}</span>
              </button>
            ))}
          </div>

          <p role="status" aria-live="polite" className="mt-4 min-h-5 text-center text-xs text-muted-foreground">{notice}</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
