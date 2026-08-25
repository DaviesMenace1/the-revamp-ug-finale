'use server'

import { db } from '@/lib/db/client'
import { supportTickets, supportTicketMessages } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { getCurrentUserWithRole } from '@/lib/auth/server'

function generateTicketNumber() {
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `TCK-${Date.now().toString(36).toUpperCase()}${rand}`
}

// --- Client-side actions ---

export async function createTicket(data: {
  subject: string
  description: string
  category?: string
  priority?: string
  orderId?: string
}) {
  const user = await getOrCreateCurrentUser()
  if (!user) return { success: false, error: 'Not signed in.' }
  if (!data.subject.trim()) return { success: false, error: 'Subject is required.' }

  try {
    const [ticket] = await db
      .insert(supportTickets)
      .values({
        ticketNumber: generateTicketNumber(),
        userId: user.id,
        subject: data.subject,
        description: data.description || null,
        category: data.category || null,
        priority: data.priority || 'normal',
        orderId: data.orderId || null,
      })
      .returning()

    if (data.description) {
      await db.insert(supportTicketMessages).values({
        ticketId: ticket.id,
        senderType: 'client',
        senderUserId: user.id,
        senderName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
        body: data.description,
      })
    }

    revalidatePath('/client/tickets')
    revalidatePath('/admin/tickets')
    return { success: true, ticket }
  } catch (error) {
    console.error('Failed to create ticket:', error)
    return { success: false, error: 'Failed to create ticket.' }
  }
}

export async function replyToTicketAsClient(ticketId: string, body: string) {
  const user = await getOrCreateCurrentUser()
  if (!user) return { success: false, error: 'Not signed in.' }
  if (!body.trim()) return { success: false, error: 'Message cannot be empty.' }

  try {
    const ticket = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, ticketId) })
    if (!ticket || ticket.userId !== user.id) return { success: false, error: 'Not authorized.' }

    const [message] = await db
      .insert(supportTicketMessages)
      .values({
        ticketId,
        senderType: 'client',
        senderUserId: user.id,
        senderName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
        body,
      })
      .returning()

    await db
      .update(supportTickets)
      .set({ updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId))

    revalidatePath('/client/tickets')
    revalidatePath('/admin/tickets')
    return { success: true, message }
  } catch (error) {
    console.error('Failed to reply to ticket:', error)
    return { success: false, error: 'Failed to send reply.' }
  }
}

export async function getTicketMessages(ticketId: string) {
  const authorization = await getCurrentUserWithRole()
  const user = authorization.user
  if (!authorization.authorized || !user) return { success: false, error: 'Not authorized.', messages: [] }
  try {
    const ticket = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, ticketId) })
    if (!ticket || (user.role !== 'admin' && ticket.userId !== user.id)) return { success: false, error: 'Not authorized.', messages: [] }

    const messages = await db
      .select()
      .from(supportTicketMessages)
      .where(eq(supportTicketMessages.ticketId, ticketId))
      .orderBy(asc(supportTicketMessages.createdAt))

    return {
      success: true,
      messages: messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    }
  } catch (error) {
    console.error('Failed to load ticket messages:', error)
    return { success: false, error: 'Failed to load messages.', messages: [] }
  }
}

// --- Admin-side actions ---

export async function replyToTicketAsAdmin(ticketId: string, body: string, adminName?: string) {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false, error: 'You are not authorized to reply to tickets.' }
  if (!body.trim()) return { success: false, error: 'Message cannot be empty.' }

  try {
    const [message] = await db
      .insert(supportTicketMessages)
      .values({
        ticketId,
        senderType: 'admin',
        senderName: adminName || 'The Revamp UG Team',
        body,
      })
      .returning()

    await db
      .update(supportTickets)
      .set({ updatedAt: new Date(), status: 'in_progress' })
      .where(eq(supportTickets.id, ticketId))

    revalidatePath('/admin/tickets')
    revalidatePath('/client/tickets')
    return { success: true, message }
  } catch (error) {
    console.error('Failed to reply to ticket:', error)
    return { success: false, error: 'Failed to send reply.' }
  }
}

export async function updateTicketStatus(ticketId: string, status: string) {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false, error: 'You are not authorized to update tickets.' }
  try {
    await db
      .update(supportTickets)
      .set({
        status,
        updatedAt: new Date(),
        resolvedAt: status === 'resolved' || status === 'closed' ? new Date() : null,
      })
      .where(eq(supportTickets.id, ticketId))

    revalidatePath('/admin/tickets')
    revalidatePath('/client/tickets')
    return { success: true }
  } catch (error) {
    console.error('Failed to update ticket status:', error)
    return { success: false, error: 'Failed to update status.' }
  }
}

export async function updateTicketPriority(ticketId: string, priority: string) {
  if (!(await getCurrentUserWithRole(['admin'])).authorized) return { success: false, error: 'You are not authorized to update tickets.' }
  try {
    await db
      .update(supportTickets)
      .set({ priority, updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId))

    revalidatePath('/admin/tickets')
    return { success: true }
  } catch (error) {
    console.error('Failed to update ticket priority:', error)
    return { success: false, error: 'Failed to update priority.' }
  }
            }
        
