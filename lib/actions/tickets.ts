'use server'

import { db } from '@/lib/db/client'
import { supportTickets, supportTicketMessages } from '@/lib/db/schema'
import { and, eq, asc, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { getGuestTicketSessionId } from '@/lib/tickets/guest-session'

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
  guestEmail?: string
  guestName?: string
}) {
  const user = await getOrCreateCurrentUser()
  const guestSessionId = user ? null : await getGuestTicketSessionId({ create: true })
  if (!user && !guestSessionId) return { success: false, error: 'Unable to start a guest support session.' }
  if (!data.subject.trim()) return { success: false, error: 'Subject is required.' }

  try {
    const guestName = data.guestName?.trim() || null
    const guestEmail = data.guestEmail?.trim() || null
    const [ticket] = await db
      .insert(supportTickets)
      .values({
        ticketNumber: generateTicketNumber(),
        userId: user?.id ?? null,
        requesterType: user ? 'client' : 'guest',
        guestSessionId,
        guestEmail: user ? null : guestEmail,
        guestName: user ? null : guestName,
        subject: data.subject.trim(),
        description: data.description?.trim() || null,
        category: data.category || null,
        priority: data.priority || 'normal',
        orderId: data.orderId || null,
      })
      .returning()

    if (data.description?.trim()) {
      await db.insert(supportTicketMessages).values({
        ticketId: ticket.id,
        senderType: user ? 'client' : 'guest',
        senderUserId: user?.id ?? null,
        senderName: user
          ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
          : data.guestName?.trim() || data.guestEmail?.trim() || 'Guest visitor',
        body: data.description.trim(),
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
  const guestSessionId = user ? null : await getGuestTicketSessionId()
  if (!user && !guestSessionId) return { success: false, error: 'Not authorized.' }
  if (!body.trim()) return { success: false, error: 'Message cannot be empty.' }

  try {
    const ticket = user
      ? await db.query.supportTickets.findFirst({
          where: and(eq(supportTickets.id, ticketId), eq(supportTickets.userId, user.id)),
        })
      : await db.query.supportTickets.findFirst({
          where: and(
            eq(supportTickets.id, ticketId),
            isNull(supportTickets.userId),
            eq(supportTickets.guestSessionId, guestSessionId as string),
          ),
        })
    if (!ticket) return { success: false, error: 'Not authorized.' }

    const [message] = await db
      .insert(supportTicketMessages)
      .values({
        ticketId,
        senderType: user ? 'client' : 'guest',
        senderUserId: user?.id ?? null,
        senderName: user
          ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
          : ticket.guestName || ticket.guestEmail || 'Guest visitor',
        body: body.trim(),
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
  const isGuest = authorization.reason === 'unauthenticated'
  const guestSessionId = isGuest ? await getGuestTicketSessionId() : null
  if (!user && !guestSessionId) return { success: false, error: 'Not authorized.', messages: [] }
  try {
    const ticket = user
      ? await db.query.supportTickets.findFirst({
          where: user.role === 'admin'
            ? eq(supportTickets.id, ticketId)
            : and(eq(supportTickets.id, ticketId), eq(supportTickets.userId, user.id)),
        })
      : await db.query.supportTickets.findFirst({
          where: and(
            eq(supportTickets.id, ticketId),
            isNull(supportTickets.userId),
            eq(supportTickets.guestSessionId, guestSessionId as string),
          ),
        })
    if (!ticket) return { success: false, error: 'Not authorized.', messages: [] }

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
        
