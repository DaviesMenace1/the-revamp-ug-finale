import 'server-only'

import { db } from '@/lib/db/client'
import { notificationDeliveries, notifications, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { escapeEmailHtml, sendBrevoNotificationEmail } from '@/lib/email/send-notification'

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
        ...(process.env.NEXT_PUBLIC_SITE_URL ? {
          chrome_web_icon: `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/brand/revamp-icon-192.png`,
        } : {}),
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

    const needsContact = channels.includes('push') || channels.includes('email')
    const user = needsContact
      ? await db.query.users.findFirst({
          where: eq(users.id, input.userId),
          columns: { clerkId: true, email: true, firstName: true, lastName: true },
        })
      : null

    if (channels.includes('push') && user?.clerkId) {
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

    if (channels.includes('email')) {
      const recipientName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'there'
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || ''
      const actionUrl = input.actionUrl ? `${siteUrl}${input.actionUrl}` : null
      const emailResult = user?.email
        ? await sendBrevoNotificationEmail({
            toEmail: user.email,
            toName: recipientName,
            subject: input.title,
            htmlContent: `<!doctype html><html><body style="margin:0;background:#f6f4ef;color:#1e1c19;font-family:Arial,sans-serif;padding:32px 16px"><main style="max-width:600px;margin:0 auto;background:#fff;padding:32px;border:1px solid #e5e0d8"><p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8b6b3f">The Revamp UG</p><h1 style="font-size:26px;font-weight:400;margin:18px 0 10px">${escapeEmailHtml(input.title)}</h1><p style="font-size:15px;line-height:1.7">Hi ${escapeEmailHtml(recipientName)},</p><p style="font-size:15px;line-height:1.7">${escapeEmailHtml(input.message)}</p>${actionUrl ? `<p style="margin-top:28px"><a href="${escapeEmailHtml(actionUrl)}" style="display:inline-block;background:#1e1c19;color:#fff;text-decoration:none;padding:13px 18px;font-size:12px;letter-spacing:1px;text-transform:uppercase">Open your portal</a></p>` : ''}<p style="margin-top:34px;color:#6f6a62;font-size:12px;line-height:1.6">You are receiving this service notification because it relates to your Revamp UG account.</p></main></body></html>`,
          })
        : { status: 'failed' as const, providerMessageId: null, error: 'Recipient email is unavailable.' }

      await db.insert(notificationDeliveries).values({
        notificationId: notification.id,
        provider: 'brevo',
        channel: 'email',
        providerMessageId: emailResult.providerMessageId,
        status: emailResult.status,
        error: emailResult.error,
        sentAt: emailResult.status === 'sent' ? new Date() : null,
      })
    }
    return { success: true, notificationId: notification.id }
  } catch (error) {
    // Notification delivery must never break the underlying business event.
    console.error('[notifications] failed to create or deliver notification:', error)
    return { success: false, notificationId: null }
  }
}
