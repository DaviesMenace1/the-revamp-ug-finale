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

export default function NotificationBell({ className }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const [apiAuthenticated, setApiAuthenticated] = useState<boolean | null>(null)
  const [error, setError] = useState('')
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
      <button type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} onClick={() => { setOpen((value) => !value); if (!open) void load() }} className={cn('relative flex size-11 items-center justify-center rounded-full transition-colors hover:bg-muted hover:text-foreground', className)}>
        <Bell className="size-5" aria-hidden="true" />
        {unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-obsidian">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-background p-4 text-foreground shadow-xl" role="dialog" aria-label="Notifications">
        <div className="flex items-center justify-between gap-3"><p className="font-serif text-xl">Notifications</p>{unreadCount > 0 && <button type="button" onClick={() => void markRead()} className="inline-flex min-h-10 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><CheckCheck className="size-3.5" />Mark all read</button>}</div>
        {!authLoaded || loading || (isSignedIn && apiAuthenticated === null) ? <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-primary" aria-label="Loading notifications" /></div> : (!isSignedIn || apiAuthenticated === false) ? <div className="py-6 text-center"><p className="text-sm text-muted-foreground">Sign in to view your notifications.</p><Link href="/sign-in?redirect_url=%2Faccount" onClick={() => setOpen(false)} className="mt-3 inline-flex min-h-10 items-center justify-center rounded bg-foreground px-4 text-xs uppercase tracking-[0.14em] text-background">Sign in</Link></div> : error ? <div className="py-5 text-center"><p role="alert" className="text-sm text-muted-foreground">{error}</p><button type="button" onClick={() => void load()} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary"><RefreshCw className="size-3.5" />Retry</button></div> : notifications.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">You are all caught up.</p> : <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">{notifications.slice(0, 20).map((notification) => { const content = <div className={`rounded-lg p-3 text-left transition-colors hover:bg-muted/70 ${notification.readAt ? 'opacity-65' : 'bg-primary/5'}`}><p className="text-sm font-medium text-foreground">{notification.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{notification.message}</p><p className="mt-2 text-[10px] text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p></div>; return notification.actionUrl ? <Link key={notification.id} href={notification.actionUrl} onClick={() => { void markRead(notification.id); setOpen(false) }}>{content}</Link> : <button key={notification.id} type="button" onClick={() => void markRead(notification.id)} className="block w-full">{content}</button> })}</div>}
      </div>}
    </div>
  )
}
