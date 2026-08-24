import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { orders, projects, consultations, conversations } from '@/lib/db/schema'
import { eq, and, ne, count } from 'drizzle-orm'
import ClientDashboardView from './client-dashboard-view'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function ClientDashboard() {
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/client',
  )

  const [orderResult, projectResult, consultationResult, conversationResult] = await Promise.all([
    safeQuery(db.select({ value: count() }).from(orders).where(eq(orders.userId, user.id)), 'client order count', []),
    safeQuery(
      db
        .select({ value: count() })
        .from(projects)
        .where(and(eq(projects.userId, user.id), ne(projects.status, 'completed'))),
      'client project count',
      [],
    ),
    safeQuery(db.select({ value: count() }).from(consultations).where(eq(consultations.userId, user.id)), 'client consultation count', []),
    safeQuery(db.query.conversations.findFirst({ where: eq(conversations.userId, user.id) }), 'client conversation count', undefined),
  ])

  const orderCount = orderResult.data
  const activeProjectCount = projectResult.data
  const consultationCount = consultationResult.data
  const conversation = conversationResult.data
  const loadError = [orderResult, projectResult, consultationResult, conversationResult].some((result) => result.error)

  return (
    <ClientDashboardView
      firstName={user.firstName}
              loadError={loadError ? 'Some portal metrics are temporarily unavailable. You can retry the page.' : null}
        stats={{

        orders: orderCount[0]?.value ?? 0,
        activeProjects: activeProjectCount[0]?.value ?? 0,
        consultations: consultationCount[0]?.value ?? 0,
        unreadMessages: conversation?.clientUnreadCount ?? 0,
      }}
    />
  )
}