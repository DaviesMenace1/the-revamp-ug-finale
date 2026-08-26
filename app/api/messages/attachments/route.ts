import { and, eq, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { conversationMessages, conversations } from '@/lib/db/schema'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { getFromR2 } from '@/lib/storage/r2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STAFF_ROLES = new Set(['admin', 'designer', 'architect', 'interior_designer', 'trade_member'])

type StoredAttachment = { kind?: string; key?: string; filename?: string; mimeType?: string }

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180) || 'message-attachment'
}

export async function GET(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get('key') || ''
    const authorization = await getCurrentUserWithRole(['customer', 'admin', 'designer', 'architect', 'interior_designer', 'trade_member'])
    if (!authorization.authorized || !authorization.user) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
    if (!key.startsWith('messages/')) return NextResponse.json({ success: false, error: 'Invalid attachment reference.' }, { status: 400 })

    const attachmentFilter = sql`${conversationMessages.attachments} @> ${JSON.stringify([{ kind: 'file', key }])}::jsonb`
    const rows = STAFF_ROLES.has(authorization.user.role || '')
      ? await db.select({ attachments: conversationMessages.attachments }).from(conversationMessages).where(attachmentFilter).limit(1)
      : await db.select({ attachments: conversationMessages.attachments }).from(conversationMessages).innerJoin(conversations, eq(conversationMessages.conversationId, conversations.id)).where(and(eq(conversations.userId, authorization.user.id), attachmentFilter)).limit(1)
    const attachments = (rows[0]?.attachments as StoredAttachment[] | null) || []
    const attachment = attachments.find((item) => item?.kind === 'file' && item.key === key)
    if (!attachment) return NextResponse.json({ success: false, error: 'Attachment not found.' }, { status: 404 })

    const object = await getFromR2(key)
    if (!object.Body) return NextResponse.json({ success: false, error: 'Attachment is empty.' }, { status: 404 })
    return new NextResponse(object.Body.transformToWebStream() as ReadableStream, {
      headers: {
        'Content-Type': attachment.mimeType || object.ContentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${safeFilename(attachment.filename || 'message-attachment')}"`,
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Failed to stream message attachment:', error)
    return NextResponse.json({ success: false, error: 'Failed to load attachment.' }, { status: 500 })
  }
}

