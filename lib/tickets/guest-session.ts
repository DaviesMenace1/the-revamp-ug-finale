import 'server-only'

import { cookies } from 'next/headers'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { supportTickets } from '@/lib/db/schema'

export const GUEST_TICKET_COOKIE = 'revamp_guest_ticket_session'
const GUEST_TICKET_MAX_AGE = 60 * 60 * 24 * 30

function isValidGuestSessionId(value: string | undefined) {
  return Boolean(value && /^[0-9a-f-]{36}$/i.test(value))
}

/**
 * Returns the browser's anonymous support-ticket session. A new identifier is
 * persisted only when called from a Server Action that is creating a ticket.
 */
export async function getGuestTicketSessionId(options: { create?: boolean } = {}) {
  const cookieStore = await cookies()
  const existing = cookieStore.get(GUEST_TICKET_COOKIE)?.value
  if (isValidGuestSessionId(existing)) return existing as string
  if (!options.create) return null

  const sessionId = crypto.randomUUID()
  try {
    cookieStore.set(GUEST_TICKET_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: GUEST_TICKET_MAX_AGE,
    })
  } catch (error) {
    // Server Components cannot mutate cookies, but the generated identifier is
    // still useful to the current action. Normal ticket creation runs in a
    // Server Action where the cookie write is supported.
    console.warn('[tickets] guest session cookie could not be persisted:', error)
  }
  return sessionId
}

/**
 * Claims only unassigned tickets from this browser's anonymous session. The
 * session identifier is cleared from claimed rows so a later signed-out user
 * on the same browser cannot access the now-account-owned tickets.
 */
export async function claimGuestTicketsForUser(userId: string) {
  const guestSessionId = await getGuestTicketSessionId()
  if (!guestSessionId) return 0

  const claimed = await db
    .update(supportTickets)
    .set({
      userId,
      requesterType: 'client',
      guestSessionId: null,
    })
    .where(
      and(
        eq(supportTickets.guestSessionId, guestSessionId),
        isNull(supportTickets.userId),
      ),
    )
    .returning({ id: supportTickets.id })

  return claimed.length
}
