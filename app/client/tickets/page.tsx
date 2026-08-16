import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { supportTickets } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import TicketsClient from './tickets-client'

export const dynamic = 'force-dynamic'

export default async function ClientTicketsPage() {
  const user = await getOrCreateCurrentUser()
  if (!user) redirect('/sign-in?redirect_url=/client/tickets')

  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, user.id))
    .orderBy(desc(supportTickets.createdAt))

  const formatted = tickets.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : null,
  }))

  return <TicketsClient initialTickets={formatted} />
}
