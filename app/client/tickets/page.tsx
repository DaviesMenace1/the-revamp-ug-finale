import { db } from '@/lib/db/client'
import { supportTickets } from '@/lib/db/schema'
import { and, eq, desc, isNull } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/utils'
import { getGuestTicketSessionId, claimGuestTicketsForUser } from '@/lib/tickets/guest-session'
import TicketsClient from './tickets-client'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function ClientTicketsPage() {
  const user = await getCurrentUser()

  // Sign-in is the ownership boundary: anonymous tickets from this browser are
  // claimed before the account list is read, so the user sees one continuous history.
  if (user) await claimGuestTicketsForUser(user.id)

  const guestSessionId = user ? null : await getGuestTicketSessionId()
  const ticketsQuery = user
    ? db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.userId, user.id))
        .orderBy(desc(supportTickets.createdAt))
    : guestSessionId
      ? db
          .select()
          .from(supportTickets)
          .where(and(isNull(supportTickets.userId), eq(supportTickets.guestSessionId, guestSessionId)))
          .orderBy(desc(supportTickets.createdAt))
      : null

  const result = ticketsQuery
    ? await safeQuery(ticketsQuery, user ? 'client tickets' : 'guest tickets', [])
    : { data: [], error: null }

  const formatted = result.data.map((ticket) => ({
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    resolvedAt: ticket.resolvedAt ? ticket.resolvedAt.toISOString() : null,
  }))

  return (
    <TicketsClient
      initialTickets={formatted}
      viewerType={user ? 'client' : 'guest'}
      loadError={result.error ? 'Support tickets are temporarily unavailable. You can retry the page.' : null}
    />
  )
}
