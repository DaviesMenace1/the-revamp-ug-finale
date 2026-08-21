import { requirePortalUser } from '@/lib/auth/portal-auth'
import AdminDashboard from './_components/admin-dashboard'
import { db } from '@/lib/db/client'
import { orders, projects, products, categories, consultations, users } from '@/lib/db/schema'
import { sql, desc, gte } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const fourWeeksAgo = new Date()
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  const [
    revenueTotalRow,
    orderCountRow,
    activeClientsRow,
    pendingProjectsRow,
    revenueByMonth,
    ordersByWeek,
    productsByCategory,
    recentOrders,
    recentProjects,
    recentConsultations,
  ] = await Promise.all([
    db.execute(sql`SELECT COALESCE(SUM(${orders.total}), 0) AS total FROM ${orders}`),
    db.execute(sql`SELECT COUNT(*) AS count FROM ${orders}`),
    db.execute(sql`SELECT COUNT(DISTINCT ${orders.userId}) AS count FROM ${orders}`),
    db.execute(
      sql`SELECT COUNT(*) AS count FROM ${projects} WHERE COALESCE(${projects.progress}, 0) < 100 AND ${projects.projectKind} = 'client'`,
    ),
    db.execute(sql`
      SELECT to_char(date_trunc('month', ${orders.createdAt}), 'Mon') AS month,
             date_trunc('month', ${orders.createdAt}) AS month_start,
             COALESCE(SUM(${orders.total}), 0) AS revenue
      FROM ${orders}
      WHERE ${orders.createdAt} >= ${sixMonthsAgo.toISOString()}
      GROUP BY month_start, month
      ORDER BY month_start ASC
    `),
    db.execute(sql`
      SELECT date_trunc('week', ${orders.createdAt}) AS week_start,
             COUNT(*) AS orders
      FROM ${orders}
      WHERE ${orders.createdAt} >= ${fourWeeksAgo.toISOString()}
      GROUP BY week_start
      ORDER BY week_start ASC
    `),
    db.execute(sql`
      SELECT c.name AS category, COUNT(p.id) AS count
      FROM ${products} p
      JOIN sub_categories sc ON sc.id = p.sub_category_id
      JOIN ${categories} c ON c.id = sc.category_id
      WHERE p.status = 'published'
      GROUP BY c.name
      ORDER BY count DESC
    `),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(3),
    db
      .select({
        id: projects.id,
        title: projects.title,
        status: projects.publishStatus,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .orderBy(desc(projects.createdAt))
      .limit(3),
    db
      .select({
        id: consultations.id,
        title: consultations.title,
        createdAt: consultations.createdAt,
      })
      .from(consultations)
      .orderBy(desc(consultations.createdAt))
      .limit(3),
  ])

  const activity = [
    ...recentOrders.map((o) => ({
      action: 'New order placed',
      detail: `Order ${o.orderNumber}`,
      time: o.createdAt,
    })),
    ...recentProjects.map((p) => ({
      action: 'Project updated',
      detail: p.title,
      time: p.createdAt,
    })),
    ...recentConsultations.map((c) => ({
      action: 'New consultation booked',
      detail: c.title,
      time: c.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5)

  return {
    kpis: {
      totalRevenue: Number((revenueTotalRow as any).rows?.[0]?.total ?? (revenueTotalRow as any)[0]?.total ?? 0),
      totalOrders: Number((orderCountRow as any).rows?.[0]?.count ?? (orderCountRow as any)[0]?.count ?? 0),
      activeClients: Number((activeClientsRow as any).rows?.[0]?.count ?? (activeClientsRow as any)[0]?.count ?? 0),
      pendingProjects: Number((pendingProjectsRow as any).rows?.[0]?.count ?? (pendingProjectsRow as any)[0]?.count ?? 0),
    },
    revenueByMonth: ((revenueByMonth as any).rows ?? revenueByMonth ?? []).map((row: any) => ({
      month: row.month,
      revenue: Number(row.revenue),
    })),
    ordersByWeek: ((ordersByWeek as any).rows ?? ordersByWeek ?? []).map((row: any, idx: number) => ({
      week: `Week ${idx + 1}`,
      orders: Number(row.orders),
    })),
    productsByCategory: ((productsByCategory as any).rows ?? productsByCategory ?? []).map((row: any) => ({
      category: row.category,
      count: Number(row.count),
    })),
    activity: activity.map((a) => ({
      action: a.action,
      detail: a.detail,
      time: new Date(a.time).toISOString(),
    })),
  }
}

export default async function AdminPage() {
  // Protect route on the server: admin role required.
  await requirePortalUser(['admin'], '/admin')

  const data = await getDashboardData()

  return <AdminDashboard data={data} />
}
