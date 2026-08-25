'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Bell, CheckCheck, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type Notification = {
  id: string
  title: string
  message: string
  actionUrl: string | null
  readAt: string | null
  createdAt: string
}

type NotificationBellProps = {
  className?: string
}

type PushStatus = {
  permission: NotificationPermission | 'unavailable'
  optedIn: boolean
  subscriptionId: string | null
  hasToken: boolean
}

const INITIAL_PUSH_STATUS: PushStatus = {
  permission: typeof Notification === 'undefined' ? 'unavailable' : Notification.permission,
  optedIn: false,
  subscriptionId: null,
  hasToken: false,
}

export default function NotificationBell({ className }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const [apiAuthenticated, setApiAuthenticated] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [pushStatus, setPushStatus] = useState<PushStatus>(INITIAL_PUSH_STATUS)
  const [pushRequesting, setPushRequesting] = useState(false)
  const [pushMessage, setPushMessage] = useState('')
  const loadingRef = useRef(false)

  const load = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' })
      const payload = await response.json() as { success?: boolean; notifications?: Notification[]; unreadCount?: number; error?: string }
      if (response.status === 401) {
        setApiAuthenticated(false)
        setNotifications([])
        setUnreadCount(0)
        return
      }
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Notifications are temporarily unavailable.')
      setApiAuthenticated(true)
      setNotifications(payload.notifications || [])
      setUnreadCount(Number(payload.unreadCount) || 0)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Notifications are temporarily unavailable.')
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoaded || !isSignedIn) return
    void load()
  }, [authLoaded, isSignedIn, load])

  useEffect(() => {
    if (!authLoaded || !isSignedIn || apiAuthenticated !== true) return
    const refresh = () => {
      if (document.visibilityState === 'visible') void load()
    }
    const interval = window.setInterval(refresh, 30_000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [apiAuthenticated, authLoaded, isSignedIn, load])

  const refreshPushStatus = useCallback(async () => {
    const permission = typeof Notification === 'undefined' ? 'unavailable' : Notification.permission
    if (permission === 'unavailable') {
      setPushStatus({ ...INITIAL_PUSH_STATUS, permission })
      return
    }
    try {
      const getStatus = window.__revampGetNotificationStatus
      if (!getStatus) {
        setPushStatus((current) => ({ ...current, permission }))
        return
      }
      let status = await getStatus()
      for (let attempt = 0; attempt < 4 && status.permission === 'granted' && !status.hasToken; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 500))
        status = await getStatus()
      }
      setPushStatus(status)
    } catch {
      setPushStatus((current) => ({ ...current, permission }))
    }
  }, [])

  async function requestPushPermission() {
    if (typeof Notification === 'undefined') {
      setPushStatus((current) => ({ ...current, permission: 'unavailable', optedIn: false, hasToken: false }))
      setPushMessage('This browser does not support web notifications.')
      return
    }
    if (Notification.permission === 'denied') {
      setPushStatus((current) => ({ ...current, permission: 'denied', optedIn: false, hasToken: false }))
      setPushMessage('Notifications are blocked. Open this site’s browser settings and change Notifications to Allow, then try again.')
      return
    }

    setPushRequesting(true)
    setPushMessage('')
    try {
      const request = window.__revampRequestNotificationPermission
      if (!request) throw new Error('Notification setup is still loading. Try again in a moment.')
      const permission = await request()
      await refreshPushStatus()
      setPushMessage(permission === 'granted' ? 'Checking this device’s OneSignal subscription…' : permission === 'denied' ? 'Notifications are blocked. Allow them in this site’s browser settings.' : 'Permission was not granted. You can try again when ready.')
    } catch (requestError) {
      setPushMessage(requestError instanceof Error ? requestError.message : 'Notifications could not be enabled. Try again.')
    } finally {
      setPushRequesting(false)
    }
  }

  async function markRead(id?: string) {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id } : { markAll: true }),
    }).catch(() => null)
    if (!response?.ok) return
    if (id) {
      setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, readAt: new Date().toISOString() } : notification))
      setUnreadCount((current) => Math.max(0, current - 1))
    } else {
      setNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt || new Date().toISOString() })))
      setUnreadCount(0)
    }
  }

  return (
    <div className="relative">
      <button type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} onClick={() => { setOpen((value) => !value); if (!open) { void load(); void refreshPushStatus() } }} className={cn('relative flex size-11 items-center justify-center rounded-full transition-colors hover:bg-muted hover:text-foreground', className)}>
        <Bell className="size-5" aria-hidden="true" />
        {unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-obsidian">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-background p-4 text-foreground shadow-xl" role="dialog" aria-label="Notifications">
        <div className="flex items-center justify-between gap-3"><p className="font-serif text-xl">Notifications</p>{unreadCount > 0 && <button type="button" onClick={() => void markRead()} className="inline-flex min-h-10 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><CheckCheck className="size-3.5" />Mark all read</button>}</div>
        <div className="mt-4 rounded-lg border border-border/70 bg-muted/30 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-foreground">Browser alerts</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Get reminders and important account updates even when this page is closed.</p></div>{pushStatus.optedIn && pushStatus.hasToken ? <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Enabled</span> : pushStatus.permission === 'denied' ? <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-700">Blocked</span> : pushStatus.permission === 'unavailable' ? <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Unavailable</span> : <button type="button" onClick={() => void requestPushPermission()} disabled={pushRequesting} className="min-h-10 shrink-0 rounded bg-foreground px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-background disabled:opacity-60">{pushRequesting ? 'Enabling…' : pushStatus.permission === 'granted' ? 'Enable device' : 'Allow alerts'}</button>}</div>{pushMessage && <p role="status" aria-live="polite" className="mt-2 text-xs leading-relaxed text-muted-foreground">{pushMessage}</p>}{pushStatus.permission === 'granted' && !pushStatus.optedIn && !pushMessage && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Browser permission is allowed, but this device is not currently subscribed to OneSignal push.</p>}{pushStatus.permission === 'denied' && !pushMessage && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Allow notifications from this site in your browser’s address-bar settings.</p>}</div>
        {!authLoaded || loading || (isSignedIn && apiAuthenticated === null) ? <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-primary" aria-label="Loading notifications" /></div> : (!isSignedIn || apiAuthenticated === false) ? <div className="py-6 text-center"><p className="text-sm text-muted-foreground">Sign in to view your notifications.</p><Link href="/sign-in?redirect_url=%2Faccount" onClick={() => setOpen(false)} className="mt-3 inline-flex min-h-10 items-center justify-center rounded bg-foreground px-4 text-xs uppercase tracking-[0.14em] text-background">Sign in</Link></div> : error ? <div className="py-5 text-center"><p role="alert" className="text-sm text-muted-foreground">{error}</p><button type="button" onClick={() => void load()} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary"><RefreshCw className="size-3.5" />Retry</button></div> : notifications.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">You are all caught up.</p> : <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">{notifications.slice(0, 20).map((notification) => { const content = <div className={`rounded-lg p-3 text-left transition-colors hover:bg-muted/70 ${notification.readAt ? 'opacity-65' : 'bg-primary/5'}`}><p className="text-sm font-medium text-foreground">{notification.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{notification.message}</p><p className="mt-2 text-[10px] text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p></div>; return notification.actionUrl ? <Link key={notification.id} href={notification.actionUrl} onClick={() => { void markRead(notification.id); setOpen(false) }}>{content}</Link> : <button key={notification.id} type="button" onClick={() => void markRead(notification.id)} className="block w-full">{content}</button> })}</div>}
      </div>}
    </div>
  )
}
