import { db } from '@/lib/db/client'
import { orders, projects, consultations, conversations } from '@/lib/db/schema'
import { eq, and, ne, count, desc } from 'drizzle-orm'
import ClientDashboardView from './client-dashboard-view'
import { safeQuery } from '@/lib/server/safe-query'
import { requirePortalUser } from '@/lib/auth/portal-auth'

export const dynamic = 'force-dynamic'

export default async function ClientDashboard() {
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/client',
  )

  const [orderCountResult, projectCountResult, consultationCountResult, conversationResult, recentOrdersResult, recentProjectsResult, recentConsultationsResult] = await Promise.all([
    safeQuery(
      db.select({ value: count() }).from(orders).where(eq(orders.userId, user.clerkId)),
      'client order count',
      [],
    ),
    safeQuery(
      db
        .select({ value: count() })
        .from(projects)
        .where(and(eq(projects.userId, user.id), ne(projects.status, 'completed'))),
      'client project count',
      [],
    ),
    safeQuery(
      db.select({ value: count() }).from(consultations).where(eq(consultations.userId, user.id)),
      'client consultation count',
      [],
    ),
    safeQuery(
      db.query.conversations.findFirst({ where: eq(conversations.userId, user.id) }),
      'client conversation count',
      undefined,
    ),
    safeQuery(
      db
        .select({ id: orders.id, orderNumber: orders.orderNumber, total: orders.total, status: orders.status, paymentStatus: orders.paymentStatus, createdAt: orders.createdAt })
        .from(orders)
        .where(eq(orders.userId, user.clerkId))
        .orderBy(desc(orders.createdAt))
        .limit(5),
      'recent client orders',
      [],
    ),
    safeQuery(
      db
        .select({ id: projects.id, title: projects.title, slug: projects.slug, status: projects.status, progress: projects.progress, updatedAt: projects.updatedAt })
        .from(projects)
        .where(eq(projects.userId, user.id))
        .orderBy(desc(projects.updatedAt))
        .limit(5),
      'recent client projects',
      [],
    ),
    safeQuery(
      db
        .select({ id: consultations.id, title: consultations.title, status: consultations.status, preferredDate: consultations.preferredDate, createdAt: consultations.createdAt })
        .from(consultations)
        .where(eq(consultations.userId, user.id))
        .orderBy(desc(consultations.createdAt))
        .limit(5),
      'recent client consultations',
      [],
    ),
  ])

  const conversation = conversationResult.data
  const loadError = [orderCountResult, projectCountResult, consultationCountResult, conversationResult, recentOrdersResult, recentProjectsResult, recentConsultationsResult].some((result) => result.error)

  return (
    <ClientDashboardView
      firstName={user.firstName}
      loadError={loadError ? 'Some portal data is temporarily unavailable. The available history is still shown; retry to refresh.' : null}
      stats={{
        orders: orderCountResult.data[0]?.value ?? 0,
        activeProjects: projectCountResult.data[0]?.value ?? 0,
        consultations: consultationCountResult.data[0]?.value ?? 0,
        unreadMessages: conversation?.clientUnreadCount ?? 0,
      }}
      recentOrders={recentOrdersResult.data.map((order) => ({
        ...order,
        createdAt: new Date(order.createdAt).toISOString(),
      }))}
      recentProjects={recentProjectsResult.data.map((project) => ({
        ...project,
        updatedAt: new Date(project.updatedAt).toISOString(),
      }))}
      recentConsultations={recentConsultationsResult.data.map((consultation) => ({
        ...consultation,
        preferredDate: consultation.preferredDate ? new Date(consultation.preferredDate).toISOString() : null,
        createdAt: new Date(consultation.createdAt).toISOString(),
      }))}
    />
  )
}
