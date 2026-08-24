import 'server-only'

import { db } from '@/lib/db/client'
import { notificationDeliveries, notifications, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export type NotificationChannel = 'in_app' | 'push' | 'email' | 'whatsapp'
export type NotificationPriority = 'critical' | 'important' | 'informational' | 'marketing'

export type NotificationInput = {
  userId: string
  type: string
  priority?: NotificationPriority
  title: string
  message: string
  actionUrl?: string | null
  metadata?: Record<string, unknown>
  channels?: NotificationChannel[]
}

const ONE_SIGNAL_ENDPOINT = 'https://api.onesignal.com/notifications'

function oneSignalConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID && process.env.ONESIGNAL_REST_API_KEY)
}

async function sendOneSignalPush(externalId: string, input: NotificationInput) {
  if (!oneSignalConfigured()) {
    console.info('[notifications] OneSignal is not configured; keeping the in-app notification only.')
    return { status: 'skipped' as const, providerMessageId: null, error: null }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7000)
  try {
    const response = await fetch(ONE_SIGNAL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        target_channel: 'push',
        include_aliases: { external_id: [externalId] },
        headings: { en: input.title },
        contents: { en: input.message },
        url: input.actionUrl ? `${process.env.NEXT_PUBLIC_SITE_URL || ''}${input.actionUrl}` : undefined,
        data: input.metadata || {},
      }),
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => ({})) as { id?: string; errors?: unknown }
    if (!response.ok) {
      return { status: 'failed' as const, providerMessageId: null, error: JSON.stringify(payload.errors || `HTTP ${response.status}`) }
    }
    return { status: 'sent' as const, providerMessageId: payload.id || null, error: null }
  } catch (error) {
    return { status: 'failed' as const, providerMessageId: null, error: error instanceof Error ? error.message : 'OneSignal request failed' }
  } finally {
    clearTimeout(timeout)
  }
}

export async function notifyUser(input: NotificationInput) {
  const channels = input.channels?.length ? input.channels : ['in_app']
  try {
    const [notification] = await db.insert(notifications).values({
      userId: input.userId,
      type: input.type,
      priority: input.priority || 'informational',
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl || null,
      metadata: input.metadata || {},
      channels,
    }).returning({ id: notifications.id })

    if (channels.includes('push')) {
      const user = await db.query.users.findFirst({ where: eq(users.id, input.userId), columns: { clerkId: true } })
      if (user?.clerkId) {
        const result = await sendOneSignalPush(user.clerkId, input)
        await db.insert(notificationDeliveries).values({
          notificationId: notification.id,
          provider: 'onesignal',
          channel: 'push',
          providerMessageId: result.providerMessageId,
          status: result.status,
          error: result.error,
          sentAt: result.status === 'sent' ? new Date() : null,
        })
      }
    }
    return { success: true, notificationId: notification.id }
  } catch (error) {
    // Notification delivery must never break the underlying business event.
    console.error('[notifications] failed to create or deliver notification:', error)
    return { success: false, notificationId: null }
  }
}
