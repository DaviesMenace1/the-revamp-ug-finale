import AdminDashboard from './_components/admin-dashboard'
import { db } from '@/lib/db/client'
import { sql } from 'drizzle-orm'
import { safeQuery } from '@/lib/server/safe-query'
import { requirePortalUser } from '@/lib/auth/portal-auth'

export const dynamic = 'force-dynamic'

type QueryRow = Record<string, unknown>

async function getDashboardData() {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const fourWeeksAgo = new Date()
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  const kpiResult = await safeQuery(
    db.execute(sql`
      SELECT
        (SELECT COALESCE(SUM(total), 0) FROM orders) AS total_revenue,
        (SELECT COUNT(*) FROM orders) AS total_orders,
        (SELECT COUNT(DISTINCT user_id) FROM orders) AS active_clients,
        (SELECT COUNT(*) FROM projects WHERE COALESCE(progress, 0) < 100 AND project_kind = 'client') AS pending_projects
    `),
    'admin KPI report',
    null,
  )

  const chartResult = await safeQuery(
    db.execute(sql`
      SELECT 'revenue' AS series,
             to_char(date_trunc('month', created_at), 'Mon') AS label,
             date_trunc('month', created_at) AS period_start,
             COALESCE(SUM(total), 0) AS value
      FROM orders
      WHERE created_at >= ${sixMonthsAgo.toISOString()}
      GROUP BY period_start, label

      UNION ALL

      SELECT 'orders' AS series,
             to_char(date_trunc('week', created_at), 'Mon DD') AS label,
             date_trunc('week', created_at) AS period_start,
             COUNT(*) AS value
      FROM orders
      WHERE created_at >= ${fourWeeksAgo.toISOString()}
      GROUP BY period_start, label

      ORDER BY series, period_start ASC
    `),
    'admin chart report',
    null,
  )

  const categoryResult = await safeQuery(
    db.execute(sql`
      SELECT c.name AS category, COUNT(p.id) AS count
      FROM products p
      JOIN sub_categories sc ON sc.id = p.sub_category_id
      JOIN categories c ON c.id = sc.category_id
      WHERE p.status = 'published'
      GROUP BY c.name
      ORDER BY count DESC
    `),
    'admin category report',
    null,
  )

  const activityResult = await safeQuery(
    db.execute(sql`
      (SELECT 'order' AS kind, order_number AS label, created_at FROM orders ORDER BY created_at DESC LIMIT 3)
      UNION ALL
      (SELECT 'project' AS kind, title AS label, created_at FROM projects ORDER BY created_at DESC LIMIT 3)
      UNION ALL
      (SELECT 'consultation' AS kind, title AS label, created_at FROM consultations ORDER BY created_at DESC LIMIT 3)
      ORDER BY created_at DESC
      LIMIT 5
    `),
    'admin activity report',
    null,
  )

  const rows = (value: unknown): QueryRow[] => Array.isArray(value) ? value as QueryRow[] : (value && typeof value === 'object' && 'rows' in value && Array.isArray(value.rows)) ? value.rows as QueryRow[] : []
  const kpiRow = rows(kpiResult.data)[0] || {}
  const chartRows = rows(chartResult.data)
  const categoryRows = rows(categoryResult.data)
  const activityRows = rows(activityResult.data)
  const activityLabels: Record<string, string> = { order: 'New order placed', project: 'Project updated', consultation: 'New consultation booked' }

  return {
    kpis: {
      totalRevenue: Number(kpiRow.total_revenue ?? 0),
      totalOrders: Number(kpiRow.total_orders ?? 0),
      activeClients: Number(kpiRow.active_clients ?? 0),
      pendingProjects: Number(kpiRow.pending_projects ?? 0),
    },
    revenueByMonth: chartRows.filter((row) => row.series === 'revenue').map((row) => ({ month: String(row.label ?? ''), revenue: Number(row.value ?? 0) })),
    ordersByWeek: chartRows.filter((row) => row.series === 'orders').map((row, index) => ({ week: `Week ${index + 1}`, orders: Number(row.value ?? 0) })),
    productsByCategory: categoryRows.map((row) => ({ category: String(row.category ?? ''), count: Number(row.count ?? 0) })),
    activity: activityRows.map((row) => ({ action: activityLabels[String(row.kind)] ?? 'Update', detail: String(row.label ?? ''), time: new Date(String(row.created_at)).toISOString() })),
    loadError: [kpiResult, chartResult, categoryResult, activityResult].some((result) => result.error)
      ? 'Some dashboard reports are temporarily unavailable. The workspace remains usable; retry the page when the database is responsive.'
      : null,
  }
}

export default async function AdminPage() {
  await requirePortalUser(['admin'], '/admin')
  return <AdminDashboard data={await getDashboardData()} />
}
