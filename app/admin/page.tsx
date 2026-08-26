import AdminDashboard from './_components/admin-dashboard'
import { db } from '@/lib/db/client'
import { sql } from 'drizzle-orm'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

 type QueryRow = Record<string, unknown>

function rows(value: unknown): QueryRow[] {
  if (Array.isArray(value)) return value as QueryRow[]
  if (value && typeof value === 'object' && 'rows' in value && Array.isArray(value.rows)) return value.rows as QueryRow[]
  return []
}

function objectValue(value: unknown): QueryRow {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as QueryRow : {}
}

function arrayValue(value: unknown): QueryRow[] {
  if (Array.isArray(value)) return value as QueryRow[]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed as QueryRow[] : []
    } catch {
      return []
    }
  }
  return []
}

function numeric(value: unknown) {
  return Number(value ?? 0)
}

async function getDashboardData() {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const fourWeeksAgo = new Date()
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  const result = await safeQuery(
    db.execute(sql`
      WITH chart AS (
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
      ),
      categories AS (
        SELECT c.name AS category, COUNT(p.id) AS product_count
        FROM products p
        JOIN sub_categories sc ON sc.id = p.sub_category_id
        JOIN categories c ON c.id = sc.category_id
        WHERE p.status = 'published'
        GROUP BY c.name
      ),
      activity AS (
        SELECT kind, label, created_at
        FROM (
          (SELECT 'order' AS kind, order_number AS label, created_at FROM orders ORDER BY created_at DESC LIMIT 3)
          UNION ALL
          (SELECT 'project' AS kind, title AS label, created_at FROM projects ORDER BY created_at DESC LIMIT 3)
          UNION ALL
          (SELECT 'consultation' AS kind, title AS label, created_at FROM consultations ORDER BY created_at DESC LIMIT 3)
        ) recent
      )
      SELECT
        json_build_object(
          'totalRevenue', (SELECT COALESCE(SUM(total), 0) FROM orders),
          'totalOrders', (SELECT COUNT(*) FROM orders),
          'activeClients', (SELECT COUNT(DISTINCT user_id) FROM orders),
          'pendingProjects', (SELECT COUNT(*) FROM projects WHERE COALESCE(progress, 0) < 100 AND project_kind = 'client')
        ) AS kpis,
        COALESCE((SELECT json_agg(json_build_object('series', series, 'label', label, 'value', value) ORDER BY series, period_start) FROM chart), '[]'::json) AS chart,
        COALESCE((SELECT json_agg(json_build_object('category', category, 'count', product_count) ORDER BY product_count DESC) FROM categories), '[]'::json) AS categories,
        COALESCE((SELECT json_agg(json_build_object('kind', kind, 'label', label, 'created_at', created_at) ORDER BY created_at DESC) FROM activity), '[]'::json) AS activity
    `),
    'admin dashboard report',
    null,
  )

  const row = rows(result.data)[0] || {}
  const kpis = objectValue(row.kpis)
  const chartRows = arrayValue(row.chart)
  const categoryRows = arrayValue(row.categories)
  const activityRows = arrayValue(row.activity)
  const activityLabels: Record<string, string> = { order: 'New order placed', project: 'Project updated', consultation: 'New consultation booked' }

  return {
    kpis: {
      totalRevenue: numeric(kpis.totalRevenue),
      totalOrders: numeric(kpis.totalOrders),
      activeClients: numeric(kpis.activeClients),
      pendingProjects: numeric(kpis.pendingProjects),
    },
    revenueByMonth: chartRows.filter((report) => report.series === 'revenue').map((report) => ({ month: String(report.label ?? ''), revenue: numeric(report.value) })),
    ordersByWeek: chartRows.filter((report) => report.series === 'orders').map((report, index) => ({ week: `Week ${index + 1}`, orders: numeric(report.value) })),
    productsByCategory: categoryRows.map((report) => ({ category: String(report.category ?? ''), count: numeric(report.count) })),
    activity: activityRows.slice(0, 5).map((report) => ({ action: activityLabels[String(report.kind)] ?? 'Update', detail: String(report.label ?? ''), time: new Date(String(report.created_at)).toISOString() })),
    loadError: result.error ? 'The dashboard reports are temporarily unavailable. The workspace remains usable; retry the page when the database is responsive.' : null,
  }
}

export default async function AdminPage() {
  return <AdminDashboard data={await getDashboardData()} />
}
