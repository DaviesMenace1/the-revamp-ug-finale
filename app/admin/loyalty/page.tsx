import { sql } from 'drizzle-orm'
import LoyaltyAdminClient from './loyalty-admin-client'
import { db } from '@/lib/db/client'
import { getLoyaltyAdminOverview } from '@/lib/loyalty/service'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

type ReadinessRow = { table_name?: string | null }

function rows(value: unknown): ReadinessRow[] {
  if (Array.isArray(value)) return value as ReadinessRow[]
  if (value && typeof value === 'object' && 'rows' in value && Array.isArray(value.rows)) return value.rows as ReadinessRow[]
  return []
}

export default async function AdminLoyaltyPage() {
  const readiness = await safeQuery(
    db.execute(sql`SELECT to_regclass('public.loyalty_accounts') AS table_name`),
    'loyalty migration readiness',
    null,
  )

  if (!readiness.error && rows(readiness.data)[0]?.table_name !== 'loyalty_accounts') {
    return <LoyaltyAdminClient initialData={null} loadError={null} migrationRequired />
  }

  const result = await safeQuery(getLoyaltyAdminOverview(), 'admin loyalty overview', null)
  return <LoyaltyAdminClient initialData={result.data} loadError={result.error ? 'The loyalty workspace could not load yet. Retry after checking the database connection.' : null} />
}
