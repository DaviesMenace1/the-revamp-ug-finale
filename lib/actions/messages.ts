'use server'

import { db } from '@/lib/db/client'
import { conversations, conversationMessages, users } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { notifyUser } from '@/lib/notifications/service'
import { revalidatePath } from 'next/cache'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { getCurrentUserWithRole } from '@/lib/auth/server'

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

export async function sendClientMessage(body: string) {
  const user = await getOrCreateCurrentUser()
  if (!user) return { success: false, error: 'Not signed in.' }
  if (!body.trim()) return { success: false, error: 'Message cannot be empty.' }

  try {
    const conversation = await getOrCreateConversation(user.id)

    const [message] = await db
      .insert(conversationMessages)
      .values({
        conversationId: conversation.id,
        senderType: 'client',
        senderUserId: user.id,
        senderName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
        body,
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

    revalidatePath('/client/messages')
    return { success: true }
  } catch (error) {
    console.error('Failed to mark messages read:', error)
    return { success: false }
  }
}

// --- Admin-side actions ---

export async function getConversationMessages(conversationId: string) {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false, error: 'You are not authorized to view messages.', messages: [] }
  try {
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

export async function sendAdminReply(conversationId: string, body: string, adminName?: string) {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false, error: 'You are not authorized to reply to messages.' }
  if (!body.trim()) return { success: false, error: 'Message cannot be empty.' }

  try {
    const [message] = await db
      .insert(conversationMessages)
      .values({
        conversationId,
        senderType: 'admin',
        senderName: adminName || 'The Revamp UG Team',
        body,
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
