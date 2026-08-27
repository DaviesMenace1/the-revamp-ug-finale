import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

const RANGES = {
  '30m': { label: 'Last 30 minutes', durationMs: 30 * 60 * 1000, bucket: 'minute' },
  '1h': { label: 'Last hour', durationMs: 60 * 60 * 1000, bucket: 'hour' },
  '6h': { label: 'Last 6 hours', durationMs: 6 * 60 * 60 * 1000, bucket: 'hour' },
  '24h': { label: 'Last 24 hours', durationMs: 24 * 60 * 60 * 1000, bucket: 'hour' },
  '30d': { label: 'Last 30 days', durationMs: 30 * 24 * 60 * 60 * 1000, bucket: 'day' },
  '6m': { label: 'Last 6 months', durationMs: 183 * 24 * 60 * 60 * 1000, bucket: 'month' },
  '1y': { label: 'Last year', durationMs: 365 * 24 * 60 * 60 * 1000, bucket: 'month' },
} as const

type RangeKey = keyof typeof RANGES
type QueryRow = Record<string, unknown>

function getRows(value: unknown): QueryRow[] {
  if (Array.isArray(value)) return value as QueryRow[]
  if (value && typeof value === 'object' && 'rows' in value && Array.isArray(value.rows)) return value.rows as QueryRow[]
  return []
}

function numeric(value: unknown) {
  return Number(value ?? 0)
}

function trendQuery(bucket: typeof RANGES[RangeKey]['bucket'], start: string) {
  if (bucket === 'minute') {
    return db.execute(sql`SELECT to_char(date_trunc('minute', created_at), 'HH24:MI') AS label, COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders FROM orders WHERE created_at >= ${start} GROUP BY date_trunc('minute', created_at) ORDER BY date_trunc('minute', created_at) LIMIT 1000`)
  }
  if (bucket === 'hour') {
    return db.execute(sql`SELECT to_char(date_trunc('hour', created_at), 'Mon DD HH24:00') AS label, COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders FROM orders WHERE created_at >= ${start} GROUP BY date_trunc('hour', created_at) ORDER BY date_trunc('hour', created_at) LIMIT 1000`)
  }
  if (bucket === 'day') {
    return db.execute(sql`SELECT to_char(date_trunc('day', created_at), 'Mon DD') AS label, COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders FROM orders WHERE created_at >= ${start} GROUP BY date_trunc('day', created_at) ORDER BY date_trunc('day', created_at) LIMIT 1000`)
  }
  return db.execute(sql`SELECT to_char(date_trunc('month', created_at), 'Mon YYYY') AS label, COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders FROM orders WHERE created_at >= ${start} GROUP BY date_trunc('month', created_at) ORDER BY date_trunc('month', created_at) LIMIT 1000`)
}

export async function GET(request: NextRequest) {
  const authorization = await getCurrentUserWithRole()
  if (authorization.reason === 'unauthenticated') return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (authorization.reason === 'error') return NextResponse.json({ error: 'Admin authorization is temporarily unavailable.' }, { status: 503 })
  if (!authorization.user || !hasPermission(authorization.user.role, 'view_admin')) return NextResponse.json({ error: 'You do not have permission to view dashboard reports.' }, { status: 403 })

  const requestedRange = request.nextUrl.searchParams.get('range') as RangeKey | null
  const rangeKey: RangeKey = requestedRange && requestedRange in RANGES ? requestedRange : '30d'
  const range = RANGES[rangeKey]
  const start = new Date(Date.now() - range.durationMs).toISOString()
  const result = await safeQuery(trendQuery(range.bucket, start), 'admin dashboard trend', null as unknown as Awaited<ReturnType<typeof trendQuery>>)

  if (result.error) return NextResponse.json({ error: 'Dashboard trend data is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  const trend = getRows(result.data)
  return NextResponse.json({ range: rangeKey, label: range.label, trend: trend.map((item) => ({ label: String(item.label ?? ''), revenue: numeric(item.revenue), orders: numeric(item.orders) })) }, { headers: { 'Cache-Control': 'private, no-store' } })
}
