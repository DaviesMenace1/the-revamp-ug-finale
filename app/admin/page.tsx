import { requirePortalUser } from '@/lib/auth/portal-auth'
import AdminDashboard from './_components/admin-dashboard'
import { db } from '@/lib/db/client'
import { sql } from 'drizzle-orm'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

// Deliberately collapsed into as few round-trips as possible (4 total,
// down from 10). Each query is its own network round-trip to Postgres, and
// with a serverless-safe connection pool (max: 1 per function instance),
// round-trips are serialized rather than run concurrently — so the number
// of queries matters a lot more here than it would with a bigger pool.
async function getDashboardData() {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const fourWeeksAgo = new Date()
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  // 1. All scalar KPIs in a single query.
  const kpiPromise = db.execute(sql`
    SELECT
      (SELECT COALESCE(SUM(total), 0) FROM orders) AS total_revenue,
      (SELECT COUNT(*) FROM orders) AS total_orders,
      (SELECT COUNT(DISTINCT user_id) FROM orders) AS active_clients,
      (SELECT COUNT(*) FROM projects WHERE COALESCE(progress, 0) < 100 AND project_kind = 'client') AS pending_projects
  `)

  // 2. Revenue-by-month and orders-by-week in one query via UNION ALL.
  const chartPromise = db.execute(sql`
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
  `)

  // 3. Products by category.
  const categoryPromise = db.execute(sql`
    SELECT c.name AS category, COUNT(p.id) AS count
    FROM products p
    JOIN sub_categories sc ON sc.id = p.sub_category_id
    JOIN categories c ON c.id = sc.category_id
    WHERE p.status = 'published'
    GROUP BY c.name
    ORDER BY count DESC
  `)

  // 4. Recent activity across orders/projects/consultations, merged in SQL
  // rather than fetched separately and merged in JS.
  const activityPromise = db.execute(sql`
    (SELECT 'order' AS kind, order_number AS label, created_at FROM orders ORDER BY created_at DESC LIMIT 3)
    UNION ALL
    (SELECT 'project' AS kind, title AS label, created_at FROM projects ORDER BY created_at DESC LIMIT 3)
    UNION ALL
    (SELECT 'consultation' AS kind, title AS label, created_at FROM consultations ORDER BY created_at DESC LIMIT 3)
    ORDER BY created_at DESC
    LIMIT 5
  `)

  const [kpiResult, chartResult, categoryResult, activityResult] = await Promise.all([
    safeQuery(kpiPromise, 'admin KPI report', null),
    safeQuery(chartPromise, 'admin chart report', null),
    safeQuery(categoryPromise, 'admin category report', null),
    safeQuery(activityPromise, 'admin activity report', null),
  ])

  const kpiRows = (kpiResult.data as any)?.rows ?? kpiResult.data ?? []
  const kpiRow = kpiRows[0] ?? {}
  const chartRows = (chartResult.data as any)?.rows ?? chartResult.data ?? []
  const categoryRows = (categoryResult.data as any)?.rows ?? categoryResult.data ?? []
  const activityRows = (activityResult.data as any)?.rows ?? activityResult.data ?? []

  const ACTIVITY_LABELS: Record<string, string> = {
    order: 'New order placed',
    project: 'Project updated',
    consultation: 'New consultation booked',
  }

  return {
    kpis: {
      totalRevenue: Number(kpiRow.total_revenue ?? 0),
      totalOrders: Number(kpiRow.total_orders ?? 0),
      activeClients: Number(kpiRow.active_clients ?? 0),
      pendingProjects: Number(kpiRow.pending_projects ?? 0),
    },
    revenueByMonth: chartRows
      .filter((row: any) => row.series === 'revenue')
      .map((row: any) => ({ month: row.label, revenue: Number(row.value) })),
    ordersByWeek: chartRows
      .filter((row: any) => row.series === 'orders')
      .map((row: any, idx: number) => ({ week: `Week ${idx + 1}`, orders: Number(row.value) })),
    productsByCategory: categoryRows.map((row: any) => ({
      category: row.category,
      count: Number(row.count),
    })),
    activity: activityRows
      .map((row: any) => ({
        action: ACTIVITY_LABELS[row.kind] ?? 'Update',
        detail: row.label,
        time: new Date(row.created_at).toISOString(),
      })),
    loadError: [kpiResult, chartResult, categoryResult, activityResult].some((result) => result.error)
      ? 'Some dashboard reports are temporarily unavailable. You can still use the navigation and retry the page.'
      : null,
  }
}

export default async function AdminPage() {
  // Protect route on the server: admin role required.
  await requirePortalUser(['admin'], '/admin')

  const data = await getDashboardData()

  return <AdminDashboard data={data} />
}
