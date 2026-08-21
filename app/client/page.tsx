import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { orders, projects, consultations, conversations } from '@/lib/db/schema'
import { eq, and, ne, count } from 'drizzle-orm'
import ClientDashboardView from './client-dashboard-view'

export const dynamic = 'force-dynamic'

export default async function ClientDashboard() {
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/client',
  )

  const [orderCount, activeProjectCount, consultationCount, conversation] = await Promise.all([
    db.select({ value: count() }).from(orders).where(eq(orders.userId, user.id)),
    db
      .select({ value: count() })
      .from(projects)
      .where(and(eq(projects.userId, user.id), ne(projects.status, 'completed'))),
    db.select({ value: count() }).from(consultations).where(eq(consultations.userId, user.id)),
    db.query.conversations.findFirst({ where: eq(conversations.userId, user.id) }),
  ])

  return (
    <ClientDashboardView
      firstName={user.firstName}
      stats={{
        orders: orderCount[0]?.value ?? 0,
        activeProjects: activeProjectCount[0]?.value ?? 0,
        consultations: consultationCount[0]?.value ?? 0,
        unreadMessages: conversation?.clientUnreadCount ?? 0,
      }}
    />
  )
}