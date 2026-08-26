'use server'

import { db } from '@/lib/db/client'
import { conversations, conversationMessages, users } from '@/lib/db/schema'
import { and, eq, desc, asc, sql } from 'drizzle-orm'
import { notifyUser } from '@/lib/notifications/service'
import { revalidatePath } from 'next/cache'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { createMessageUploadUrl, headFromR2, isR2Configured } from '@/lib/storage/r2'

export type MessageFileAttachment = {
  kind: 'file'
  key: string
  filename: string
  mimeType: string
  size: number
}

export type MessageReference = {
  kind: 'link'
  label: string
  href: string
}

export type MessageAttachment = MessageFileAttachment | MessageReference

type PreparedMessageUpload =
  | { success: false; error: string }
  | { success: true; url: string; key: string; expiresAt: string; maxBytes: number }

const MAX_MESSAGE_ATTACHMENTS = 5
const MAX_MESSAGE_ATTACHMENT_BYTES = 15 * 1024 * 1024
const ALLOWED_REFERENCE_PATHS = new Set([
  '/book-consultation',
  '/client/consultations',
  '/client/projects',
  '/client/orders',
  '/client/documents',
  '/account',
])

function isAllowedAttachmentType(mimeType: string) {
  return mimeType.startsWith('image/') || [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/rtf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ].includes(mimeType)
}

async function validateMessageAttachments(input: unknown, ownerUserId: string): Promise<MessageAttachment[]> {
  if (!Array.isArray(input) || input.length === 0) return []
  if (input.length > MAX_MESSAGE_ATTACHMENTS) throw new Error(`You can attach up to ${MAX_MESSAGE_ATTACHMENTS} files per message.`)

  const validated: MessageAttachment[] = []
  for (const item of input) {
    if (!item || typeof item !== 'object') throw new Error('Invalid message attachment.')
    const value = item as Record<string, unknown>
    if (value.kind === 'link') {
      const href = typeof value.href === 'string' ? value.href : ''
      const label = typeof value.label === 'string' ? value.label.trim().slice(0, 120) : ''
      if (!ALLOWED_REFERENCE_PATHS.has(href) || !label) throw new Error('That page reference is not available.')
      validated.push({ kind: 'link', label, href })
      continue
    }

    const key = typeof value.key === 'string' ? value.key : ''
    const filename = typeof value.filename === 'string' ? value.filename.trim().slice(0, 255) : ''
    const mimeType = typeof value.mimeType === 'string' ? value.mimeType.slice(0, 160) : 'application/octet-stream'
    if (!key.startsWith(`messages/${ownerUserId}/`)) throw new Error('Invalid message attachment reference.')
    if (!filename || !isAllowedAttachmentType(mimeType)) throw new Error('This file type is not supported.')
    const object = await headFromR2(key)
    const size = Number(object.ContentLength ?? 0)
    if (!Number.isFinite(size) || size <= 0 || size > MAX_MESSAGE_ATTACHMENT_BYTES) throw new Error('Attachments must be between 1 byte and 15 MB.')
    validated.push({ kind: 'file', key, filename, mimeType, size })
  }
  return validated
}

async function getOrCreateConversation(userId: string, subject = 'General') {
  const existing = await db.query.conversations.findFirst({
    where: eq(conversations.userId, userId),
    orderBy: desc(conversations.lastMessageAt),
  })

  if (existing) return existing

  const [created] = await db
    .insert(conversations)
    .values({ userId, subject })
    .returning()

  return created
}

// --- Client-side actions ---

export async function prepareMessageAttachment(filename: string, mimeType: string): Promise<PreparedMessageUpload> {
  const user = await getOrCreateCurrentUser()
  if (!user) return { success: false, error: 'Not signed in.' }
  if (!isR2Configured()) return { success: false, error: 'File attachments are temporarily unavailable.' }
  const safeFilename = filename.trim().slice(0, 255)
  const safeMimeType = mimeType.slice(0, 160)
  if (!safeFilename || !isAllowedAttachmentType(safeMimeType)) return { success: false, error: 'Attach an image, PDF, text, Word, or RTF file.' }
  try {
    const upload = await createMessageUploadUrl({ userId: user.id, filename: safeFilename, contentType: safeMimeType })
    return { success: true, ...upload, maxBytes: MAX_MESSAGE_ATTACHMENT_BYTES }
  } catch (error) {
    console.error('Failed to prepare message attachment:', error)
    return { success: false, error: 'The attachment upload could not be prepared.' }
  }
}

export async function getClientConversationMessages() {
  const user = await getOrCreateCurrentUser()
  if (!user) return { success: false, error: 'Not signed in.', conversationId: null, messages: [] }

  try {
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.userId, user.id),
      orderBy: desc(conversations.lastMessageAt),
    })
    if (!conversation) return { success: true, conversationId: null, messages: [] }

    await db
      .update(conversationMessages)
      .set({ deliveredAt: new Date(), readAt: new Date() })
      .where(and(eq(conversationMessages.conversationId, conversation.id), eq(conversationMessages.senderType, 'admin')))

    const messages = await db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversation.id))
      .orderBy(asc(conversationMessages.createdAt))

    return {
      success: true,
      conversationId: conversation.id,
      messages: messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString() })),
    }
  } catch (error) {
    console.error('Failed to refresh client messages:', error)
    return { success: false, error: 'Failed to refresh messages.', conversationId: null, messages: [] }
  }
}

export async function sendClientMessage(body: string, attachments: unknown[] = []) {
  const user = await getOrCreateCurrentUser()
  if (!user) return { success: false, error: 'Not signed in.' }
  if (!body.trim() && (!Array.isArray(attachments) || attachments.length === 0)) return { success: false, error: 'Message or attachment is required.' }

  try {
    const messageAttachments = await validateMessageAttachments(attachments, user.id)
    const conversation = await getOrCreateConversation(user.id)

    const [message] = await db
      .insert(conversationMessages)
      .values({
        conversationId: conversation.id,
        senderType: 'client',
        senderUserId: user.id,
        senderName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
        body: body.trim().slice(0, 2000),
        attachments: messageAttachments,
      })
      .returning()

    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        adminUnreadCount: sql`${conversations.adminUnreadCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversation.id))

    const admins = await db.query.users.findMany({ where: eq(users.role, 'admin'), columns: { id: true } })
    await Promise.all(admins.map((admin) => notifyUser({
      userId: admin.id,
      type: 'new_client_message',
      priority: 'important',
      title: 'New client message',
      message: `${user.firstName || user.email} sent a new message.`,
      actionUrl: '/admin/messages',
      metadata: { conversationId: conversation.id, messageId: message.id },
      channels: ['in_app', 'push', 'email'],
    })))

    revalidatePath('/client/messages')
    revalidatePath('/admin/messages')
    return { success: true, message, conversationId: conversation.id }
  } catch (error) {
    console.error('Failed to send message:', error)
    return { success: false, error: 'Failed to send message.' }
  }
}

export async function markClientMessagesRead() {
  const user = await getOrCreateCurrentUser()
  if (!user) return { success: false }

  try {
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.userId, user.id),
    })
    if (!conversation) return { success: true }

    await db
      .update(conversations)
      .set({ clientUnreadCount: 0 })
      .where(eq(conversations.id, conversation.id))
    await db
      .update(conversationMessages)
      .set({ deliveredAt: new Date(), readAt: new Date() })
      .where(and(eq(conversationMessages.conversationId, conversation.id), eq(conversationMessages.senderType, 'admin')))

    revalidatePath('/client/messages')
    return { success: true }
  } catch (error) {
    console.error('Failed to mark messages read:', error)
    return { success: false }
  }
}

// --- Admin-side actions ---

export async function getAdminConversationSummaries() {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false, error: 'You are not authorized to view messages.', conversations: [] }

  try {
    const rows = await db
      .select({
        id: conversations.id,
        subject: conversations.subject,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        adminUnreadCount: conversations.adminUnreadCount,
        clientEmail: users.email,
        clientFirstName: users.firstName,
        clientLastName: users.lastName,
      })
      .from(conversations)
      .leftJoin(users, eq(conversations.userId, users.id))
      .orderBy(desc(conversations.lastMessageAt))

    return {
      success: true,
      conversations: rows.map((row) => ({ ...row, lastMessageAt: row.lastMessageAt.toISOString() })),
    }
  } catch (error) {
    console.error('Failed to refresh admin conversations:', error)
    return { success: false, error: 'Failed to refresh conversations.', conversations: [] }
  }
}

export async function getConversationMessages(conversationId: string) {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false, error: 'You are not authorized to view messages.', messages: [] }
  try {
    await db
      .update(conversationMessages)
      .set({ deliveredAt: new Date() })
      .where(and(eq(conversationMessages.conversationId, conversationId), eq(conversationMessages.senderType, 'client')))

    const messages = await db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversationId))
      .orderBy(conversationMessages.createdAt)

    return {
      success: true,
      messages: messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    }
  } catch (error) {
    console.error('Failed to load conversation messages:', error)
    return { success: false, error: 'Failed to load messages.', messages: [] }
  }
}

export async function sendAdminReply(conversationId: string, body: string, attachments: unknown[] = []) {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (!authorization.authorized || !authorization.user) return { success: false, error: 'You are not authorized to reply to messages.' }
  if (!body.trim() && (!Array.isArray(attachments) || attachments.length === 0)) return { success: false, error: 'Message or attachment is required.' }

  try {
    const messageAttachments = await validateMessageAttachments(attachments, authorization.user.id)
    const [message] = await db
      .insert(conversationMessages)
      .values({
        conversationId,
        senderType: 'admin',
        senderUserId: authorization.user.id,
        senderName: [authorization.user.firstName, authorization.user.lastName].filter(Boolean).join(' ') || 'The Revamp UG Team',
        body: body.trim().slice(0, 2000) || 'Attachment shared by The Revamp UG.',
        attachments: messageAttachments,
      })
      .returning()

    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        clientUnreadCount: sql`${conversations.clientUnreadCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId))

    const conversation = await db.query.conversations.findFirst({ where: eq(conversations.id, conversationId), columns: { userId: true } })
    if (conversation) {
      await notifyUser({
        userId: conversation.userId,
        type: 'new_admin_message',
        priority: 'important',
        title: 'New message from The Revamp UG',
        message: 'The Revamp UG team replied to your conversation.',
        actionUrl: '/client/messages',
        metadata: { conversationId, messageId: message.id },
        channels: ['in_app', 'push', 'email'],
      })
    }

    revalidatePath('/admin/messages')
    revalidatePath('/client/messages')
    return { success: true, message }
  } catch (error) {
    console.error('Failed to send admin reply:', error)
    return { success: false, error: 'Failed to send reply.' }
  }
}

export async function markAdminMessagesRead(conversationId: string) {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false }
  try {
    await db
      .update(conversations)
      .set({ adminUnreadCount: 0 })
      .where(eq(conversations.id, conversationId))
    await db
      .update(conversationMessages)
      .set({ deliveredAt: new Date(), readAt: new Date() })
      .where(and(eq(conversationMessages.conversationId, conversationId), eq(conversationMessages.senderType, 'client')))

    revalidatePath('/admin/messages')
    return { success: true }
  } catch (error) {
    console.error('Failed to mark messages read:', error)
    return { success: false }
  }
}

export async function updateConversationStatus(conversationId: string, status: string) {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false, error: 'You are not authorized to update messages.' }
  try {
    await db
      .update(conversations)
      .set({ status, updatedAt: new Date() })
      .where(eq(conversations.id, conversationId))

    revalidatePath('/admin/messages')
    return { success: true }
  } catch (error) {
    console.error('Failed to update conversation status:', error)
    return { success: false, error: 'Failed to update status.' }
  }
  }
