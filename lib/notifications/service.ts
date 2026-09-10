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

function metadataDetails(metadata: Record<string, unknown> | undefined) {
  if (!metadata) return ''
  const lines: string[] = []
  if (typeof metadata.orderNumber === 'string' && metadata.orderNumber) lines.push(`Order reference: ${metadata.orderNumber}`)
  if (typeof metadata.status === 'string' && metadata.status) lines.push(`Status: ${metadata.status.replaceAll('_', ' ')}`)
  if (typeof metadata.total === 'string' || typeof metadata.total === 'number') lines.push(`Total: ${String(metadata.currency || 'UGX')} ${String(metadata.total)}`)
  if (typeof metadata.trackingCode === 'string' && metadata.trackingCode) lines.push(`Tracking code: ${metadata.trackingCode}`)
  if (typeof metadata.paymentMode === 'string') lines.push(`Payment: ${metadata.paymentMode === 'pay_on_delivery' ? 'Pay on delivery' : 'Pay now'}`)
  if (typeof metadata.paymentMethod === 'string' && metadata.paymentMethod) lines.push(`Payment method: ${metadata.paymentMethod === 'mobile_money' ? 'Mobile money' : metadata.paymentMethod === 'card' ? 'Card' : metadata.paymentMethod}`)
  const address = metadata.deliveryAddress && typeof metadata.deliveryAddress === 'object' && !Array.isArray(metadata.deliveryAddress) ? metadata.deliveryAddress as Record<string, unknown> : null
  if (address?.deliveryMethod === 'pickup_station' && address.pickupStation && typeof address.pickupStation === 'object') {
    const station = address.pickupStation as Record<string, unknown>
    lines.push(`Pickup station: ${String(station.name || 'Selected station')}, ${String(station.address || '')}`)
  } else if (address) {
    lines.push(`Delivery: ${String(address.address || '')}, ${String(address.city || '')}`)
  }
  if (typeof metadata.refundStatus === 'string' && metadata.refundStatus !== 'not_requested') lines.push(`Refund status: ${metadata.refundStatus}`)
  if (Array.isArray(metadata.items) && metadata.items.length > 0) {
    const names = metadata.items.slice(0, 5).map((item) => {
      const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}
      const name = String(row.name || row.title || 'Product')
      const options = [['colour', row.color], ['fabric', row.fabric], ['material', row.material], ['variant', row.variant]]
        .filter(([, value]) => typeof value === 'string' && value.trim())
        .map(([label, value]) => `${label}: ${String(value)}`)
        .join(', ')
      const quantity = Math.max(1, Number(row.quantity) || 1)
      return `${name}${options ? ` (${options})` : ''} x ${quantity}`
    })
    lines.push(`Products: ${names.join(', ')}${metadata.items.length > 5 ? ` and ${metadata.items.length - 5} more` : ''}`)
  }
  return lines.map((line) => `<li style="margin-bottom:6px;">${escapeEmailHtml(line)}</li>`).join('')
}

function oneSignalConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID && process.env.ONESIGNAL_REST_API_KEY)
}

async function sendOneSignalPush(externalId: string, input: NotificationInput) {
  if (!oneSignalConfigured()) {
    console.warn('[notifications] OneSignal push is not configured; keeping the in-app notification only.')
    return { status: 'skipped' as const, providerMessageId: null, error: 'OneSignal push is not configured in the server environment.' }
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
    const payload = await response.json().catch(() => ({})) as { id?: string; recipients?: number; errors?: unknown; warnings?: unknown }
    if (!response.ok) {
      return { status: 'failed' as const, providerMessageId: null, error: JSON.stringify(payload.errors || `HTTP ${response.status}`) }
    }
    if (!payload.id) {
      return { status: 'failed' as const, providerMessageId: null, error: JSON.stringify(payload.errors || payload.warnings || 'OneSignal accepted the request but returned no notification id; the recipient may not have an active browser subscription.') }
    }
    if (payload.recipients === 0) {
      return { status: 'failed' as const, providerMessageId: payload.id, error: 'OneSignal found no active browser subscription for this user.' }
    }
    return { status: 'sent' as const, providerMessageId: payload.id, error: null }
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

    if (channels.includes('push')) {
      const result = user?.clerkId
        ? await sendOneSignalPush(user.clerkId, input)
        : { status: 'skipped' as const, providerMessageId: null, error: 'Recipient has no OneSignal external ID.' }
      if (result.status !== 'sent') {
        console.warn('[notifications] push delivery did not send:', result.error)
      }
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
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://therevampug.com'
      const actionUrl = input.actionUrl ? `${siteUrl}${input.actionUrl}` : null
      const detailsMarkup = metadataDetails(input.metadata)
      const emailResult = user?.email
        ? await sendBrevoNotificationEmail({
            toEmail: user.email,
            toName: recipientName,
            subject: input.title,
            htmlContent: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;background:#f4f1eb;color:#231f1b;font-family:Arial,sans-serif;padding:28px 14px}.card{max-width:620px;margin:0 auto;background:#fff;border:1px solid #e5dfd5}.head{padding:30px;background:#231f1b;color:#fffaf2}.brand{color:#d2ab72;font-size:11px;letter-spacing:3px;text-transform:uppercase}.badge{display:inline-block;margin-top:22px;border:1px solid #d2ab72;color:#f4d49d;padding:7px 10px;font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase}.head h1{font-family:Georgia,serif;font-size:28px;font-weight:400;line-height:1.2;margin:14px 0 8px}.head p{color:#e1d9cd;font-size:14px;line-height:1.7;margin:0}.body{padding:28px 30px 32px}.details{border:1px solid #e5dfd5;background:#fbfaf7;padding:16px}.details ul{font-size:13px;line-height:1.5;margin:10px 0 0;padding-left:20px}.button{display:inline-block;background:#231f1b;color:#fffaf2!important;text-decoration:none;padding:14px 18px;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase}.foot{border-top:1px solid #ebe7df;color:#91887d;font-size:11px;line-height:1.6;margin-top:28px;padding-top:18px}@media(max-width:520px){body{padding:0}.head,.body{padding-left:20px;padding-right:20px}}</style></head><body><main class="card"><header class="head"><div class="brand">The Revamp UG</div><div class="badge">Service update</div><h1>${escapeEmailHtml(input.title)}</h1><p>Hi ${escapeEmailHtml(recipientName)},</p><p style="margin-top:8px">${escapeEmailHtml(input.message)}</p></header><section class="body">${detailsMarkup ? `<div class="details"><strong style="font-size:13px;letter-spacing:1px;text-transform:uppercase">Order update details</strong><ul>${detailsMarkup}</ul></div>` : ''}${actionUrl ? `<p style="margin:24px 0 0"><a class="button" href="${escapeEmailHtml(actionUrl)}">Open order status</a></p>` : ''}<p class="foot">You are receiving this service notification because it relates to your Revamp UG account.</p></section></main></body></html>`,
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
