'use client'

import { useEffect, useState } from 'react'
import { Bell, Check, ShieldCheck, X } from '@/components/ui/luxury-icons'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

type PushStatus = {
  permission: NotificationPermission | 'unavailable'
  optedIn: boolean
  subscriptionId: string | null
  hasToken: boolean
}

type PromptContext = 'membership' | 'trade' | 'account'

const MAX_STATUS_ATTEMPTS = 12
const STATUS_INTERVAL_MS = 500
const DISMISS_KEY = 'revamp-browser-push-prompt-dismissed'

function contextCopy(context: PromptContext) {
  if (context === 'membership') {
    return {
      eyebrow: 'Membership updates',
      title: 'Keep your membership close.',
      description: 'Enable browser alerts for membership events, community updates, and important account messages from The Revamp UG.',
    }
  }
  if (context === 'trade') {
    return {
      eyebrow: 'Trade updates',
      title: 'Do not miss a trade update.',
      description: 'Enable browser alerts for trade events, partner updates, and important account messages from The Revamp UG.',
    }
  }
  return {
    eyebrow: 'Account updates',
    title: 'Stay up to date.',
    description: 'Enable browser alerts for important updates from The Revamp UG, even when this page is closed.',
  }
}

async function readPushStatus(): Promise<PushStatus | null> {
  const getStatus = window.__revampGetNotificationStatus
  if (!getStatus) return null

  let status = await getStatus()
  for (let attempt = 0; attempt < MAX_STATUS_ATTEMPTS && status.permission === 'granted' && !status.hasToken; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, STATUS_INTERVAL_MS))
    status = await getStatus()
  }
  return status
}

export default function BrowserNotificationPrompt({ context }: { context: PromptContext }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<PushStatus | null>(null)
  const [requesting, setRequesting] = useState(false)
  const [message, setMessage] = useState('')
  const copy = contextCopy(context)

  useEffect(() => {
    let cancelled = false
    let timeoutId: number | undefined

    const check = async (attempt = 0) => {
      if (cancelled) return
      try {
        const current = await readPushStatus()
        if (current) {
          if (cancelled) return
          setStatus(current)
          const dismissed = window.sessionStorage.getItem(DISMISS_KEY) === '1'
          if (!dismissed && current.permission !== 'unavailable' && current.permission !== 'denied' && !current.optedIn) setOpen(true)
          return
        }
      } catch {
        // The SDK may still be loading. Retry briefly without affecting the page.
      }
      if (!cancelled && attempt < MAX_STATUS_ATTEMPTS) timeoutId = window.setTimeout(() => void check(attempt + 1), STATUS_INTERVAL_MS)
    }

    void check()
    return () => {
      cancelled = true
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [])

  async function enableNotifications() {
    if (typeof Notification === 'undefined') {
      setMessage('This browser does not support push alerts. You can still view updates in your portal.')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus((current) => current ? { ...current, permission: 'denied', optedIn: false, hasToken: false } : current)
      setMessage('Notifications are blocked for this site. Open the browser site settings, set Notifications to Allow, then return and try again.')
      return
    }

    setRequesting(true)
    setMessage('')
    try {
      const request = window.__revampRequestNotificationPermission
      if (!request) throw new Error('Notification setup is still loading. Please try again in a moment.')
      await request()
      const current = await readPushStatus()
      if (!current) throw new Error('We could not verify the browser subscription yet. Please try again.')
      setStatus(current)
      if (current.optedIn && current.hasToken) {
        setMessage('Browser alerts are enabled on this device.')
        window.sessionStorage.removeItem(DISMISS_KEY)
        window.setTimeout(() => setOpen(false), 900)
      } else if (current.permission === 'denied') {
        setMessage('Notifications are blocked for this site. Allow them in browser site settings, then return and try again.')
      } else {
        setMessage('Permission was allowed, but the browser subscription is still finishing. Tap the button again in a moment.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not enable browser alerts. Please try again.')
    } finally {
      setRequesting(false)
    }
  }

  function dismiss() {
    window.sessionStorage.setItem(DISMISS_KEY, '1')
    setOpen(false)
  }

  if (!open) return null

  const blocked = status?.permission === 'denied'
  const enabled = Boolean(status?.optedIn && status.hasToken)

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) dismiss(); else setOpen(true) }}>
      <SheetContent side="bottom" showCloseButton={false} className="safe-bottom max-h-[min(680px,92dvh)] rounded-t-2xl border-border bg-background p-0 sm:inset-x-auto sm:right-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-[34rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:shadow-2xl">
        <SheetClose onClick={dismiss} className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Close browser notification prompt">
          <X className="size-5" aria-hidden="true" />
        </SheetClose>
        <SheetHeader className="border-b border-border/70 px-5 pb-5 pt-7 sm:px-7 sm:pt-8">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-gold/15 text-primary">{enabled ? <Check className="size-6" aria-hidden="true" /> : <Bell className="size-6" aria-hidden="true" />}</div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-primary">{copy.eyebrow}</p>
          <SheetTitle className="mt-2 max-w-sm font-serif text-3xl font-normal tracking-tight">{copy.title}</SheetTitle>
          <SheetDescription className="max-w-md leading-6">{copy.description}</SheetDescription>
        </SheetHeader>
        <div className="px-5 py-5 sm:px-7 sm:py-6">
          <div className="rounded-xl border border-border/70 bg-card p-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><p className="text-sm leading-6 text-muted-foreground">You stay in control. The browser will ask you to allow notifications, and you can change this permission at any time.</p></div></div>
          {message && <p role="status" aria-live="polite" className="mt-4 rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm leading-6 text-muted-foreground">{message}</p>}
          {blocked && !message && <p className="mt-4 text-sm leading-6 text-muted-foreground">Notifications are currently blocked for this site. Allow them in browser site settings, then return here.</p>}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={dismiss} className="min-h-11 rounded-lg px-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Not now</button>
            {!enabled && <button type="button" onClick={() => void enableNotifications()} disabled={requesting || blocked} className="min-h-11 rounded-lg bg-primary px-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{requesting ? 'Enabling alerts…' : blocked ? 'Allow in browser settings' : 'Enable browser alerts'}</button>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
