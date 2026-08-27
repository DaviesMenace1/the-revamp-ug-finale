import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

const RANGES = {
  '30m': { label: 'Last 30 minutes', durationMs: 30 * 60 * 1000, bucket: 'minute', format: 'HH24:MI' },
  '1h': { label: 'Last hour', durationMs: 60 * 60 * 1000, bucket: 'hour', format: 'Mon DD HH24:00' },
  '6h': { label: 'Last 6 hours', durationMs: 6 * 60 * 60 * 1000, bucket: 'hour', format: 'Mon DD HH24:00' },
  '24h': { label: 'Last 24 hours', durationMs: 24 * 60 * 60 * 1000, bucket: 'hour', format: 'Mon DD HH24:00' },
  '30d': { label: 'Last 30 days', durationMs: 30 * 24 * 60 * 60 * 1000, bucket: 'day', format: 'Mon DD' },
  '6m': { label: 'Last 6 months', durationMs: 183 * 24 * 60 * 60 * 1000, bucket: 'month', format: 'Mon YYYY' },
  '1y': { label: 'Last year', durationMs: 365 * 24 * 60 * 60 * 1000, bucket: 'month', format: 'Mon YYYY' },
} as const

type RangeKey = keyof typeof RANGES

type QueryRow = Record<string, unknown>

function getRows(value: unknown): QueryRow[] {
  if (Array.isArray(value)) return value as QueryRow[]
  if (value && typeof value === 'object' && 'rows' in value && Array.isArray(value.rows)) return value.rows as QueryRow[]
  return []
}

function getArray(value: unknown): QueryRow[] {
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

export async function GET(request: NextRequest) {
  const authorization = await getCurrentUserWithRole()
  if (authorization.reason === 'unauthenticated') return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (authorization.reason === 'error') return NextResponse.json({ error: 'Admin authorization is temporarily unavailable.' }, { status: 503 })
  if (!authorization.user || !hasPermission(authorization.user.role, 'view_admin')) return NextResponse.json({ error: 'You do not have permission to view dashboard reports.' }, { status: 403 })

  const requestedRange = request.nextUrl.searchParams.get('range') as RangeKey | null
  const rangeKey: RangeKey = requestedRange && requestedRange in RANGES ? requestedRange : '30d'
  const range = RANGES[rangeKey]
  const start = new Date(Date.now() - range.durationMs)

  const result = await safeQuery(
    db.execute(sql`
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'label', to_char(date_trunc(${sql.raw(`'${range.bucket}'`)}, created_at), ${range.format}),
            'periodStart', date_trunc(${sql.raw(`'${range.bucket}'`)}, created_at),
            'revenue', COALESCE(SUM(total), 0),
            'orders', COUNT(*)
          ) ORDER BY date_trunc(${sql.raw(`'${range.bucket}'`)}, created_at)
        ),
        '[]'::json
      ) AS trend
      FROM orders
      WHERE created_at >= ${start.toISOString()}
    `),
    'admin dashboard trend',
    null,
  )

  if (result.error) return NextResponse.json({ error: 'Dashboard trend data is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  const row = getRows(result.data)[0] || {}
  const trend = getArray(row.trend)
  return NextResponse.json({ range: rangeKey, label: range.label, trend: trend.map((item) => {
    const point = item as QueryRow
    return { label: String(point.label ?? ''), revenue: numeric(point.revenue), orders: numeric(point.orders) }
  }) }, { headers: { 'Cache-Control': 'private, no-store' } })
}
