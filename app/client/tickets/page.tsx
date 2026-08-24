import { db } from '@/lib/db/client'
import { supportTickets } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { requirePortalUser } from '@/lib/auth/portal-auth'
import TicketsClient from './tickets-client'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function ClientTicketsPage() {
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/client/tickets',
  )

  const result = await safeQuery(
    db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, user.id))
      .orderBy(desc(supportTickets.createdAt)),
    'client tickets',
    [],
  )

  const formatted = result.data.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : null,
  }))

  return <TicketsClient initialTickets={formatted} loadError={result.error ? 'Support tickets are temporarily unavailable. You can retry the page.' : null} />
}
