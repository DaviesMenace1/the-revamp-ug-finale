import { db } from '@/lib/db/client'
import { supportTickets, users } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import TicketsAdminClient from './tickets-admin-client'

export const dynamic = 'force-dynamic'

export default async function AdminTicketsPage() {
  const rows = await db
    .select({
      id: supportTickets.id,
      ticketNumber: supportTickets.ticketNumber,
      subject: supportTickets.subject,
      description: supportTickets.description,
      category: supportTickets.category,
      priority: supportTickets.priority,
      status: supportTickets.status,
      requesterType: supportTickets.requesterType,
      guestEmail: supportTickets.guestEmail,
      guestName: supportTickets.guestName,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
      clientEmail: users.email,
      clientFirstName: users.firstName,
      clientLastName: users.lastName,
    })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.userId, users.id))
    .orderBy(desc(supportTickets.createdAt))

  const formatted = rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))

  return <TicketsAdminClient initialTickets={formatted} />
}
