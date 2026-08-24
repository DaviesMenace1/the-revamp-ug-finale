import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { getCurrentUserWithRole } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

const ROLES = ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'] as const

async function currentUser() {
  const authorization = await getCurrentUserWithRole([...ROLES])
  return authorization.authorized ? authorization.user : null
}

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 })
    const rows = await db.select({ id: notifications.id, type: notifications.type, priority: notifications.priority, title: notifications.title, message: notifications.message, actionUrl: notifications.actionUrl, channels: notifications.channels, readAt: notifications.readAt, createdAt: notifications.createdAt }).from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(50)
    const unreadCount = rows.filter((notification) => !notification.readAt).length
    return NextResponse.json({ success: true, notifications: rows, unreadCount })
  } catch (error) {
    console.error('[notifications] failed to load notifications:', error)
    return NextResponse.json({ success: false, error: 'Notifications are temporarily unavailable.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 })
    const body = await request.json().catch(() => ({})) as { id?: string; markAll?: boolean }
    if (body.markAll) {
      await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)))
    } else if (body.id) {
      await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, body.id), eq(notifications.userId, user.id)))
    } else {
      return NextResponse.json({ success: false, error: 'Notification id is required.' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[notifications] failed to mark notification read:', error)
    return NextResponse.json({ success: false, error: 'Failed to update notification.' }, { status: 500 })
  }
}
