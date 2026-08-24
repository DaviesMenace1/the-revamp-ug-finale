'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'

type Notification = {
  id: string
  title: string
  message: string
  actionUrl: string | null
  readAt: string | null
  createdAt: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const unreadCount = notifications.filter((notification) => !notification.readAt).length

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' })
      const payload = await response.json() as { notifications?: Notification[] }
      setNotifications(payload.notifications || [])
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }


  async function markRead(id?: string) {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(id ? { id } : { markAll: true }) }).catch(() => undefined)
    setNotifications((current) => current.map((notification) => id && notification.id !== id ? notification : { ...notification, readAt: new Date().toISOString() }))
  }

  return <div className="relative"><button type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} onClick={() => { setOpen((value) => !value); if (!open) void load() }} className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Bell className="h-5 w-5" />{unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>{open && <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-border bg-background p-3 shadow-xl"><div className="flex items-center justify-between gap-3"><p className="font-serif text-lg">Notifications</p>{unreadCount > 0 && <button type="button" onClick={() => void markRead()} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><CheckCheck className="h-3.5 w-3.5" />Mark all read</button>}</div>{loading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : notifications.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">You are all caught up.</p> : <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">{notifications.slice(0, 20).map((notification) => { const content = <div className={`rounded p-3 text-left hover:bg-muted/70 ${notification.readAt ? 'opacity-65' : 'bg-primary/5'}`}><p className="text-sm font-medium text-foreground">{notification.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{notification.message}</p><p className="mt-2 text-[10px] text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p></div>; return notification.actionUrl ? <Link key={notification.id} href={notification.actionUrl} onClick={() => { void markRead(notification.id); setOpen(false) }}>{content}</Link> : <button key={notification.id} type="button" onClick={() => void markRead(notification.id)} className="block w-full">{content}</button> })}</div>}</div>}</div>
}
