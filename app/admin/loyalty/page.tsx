import LoyaltyAdminClient from './loyalty-admin-client'
import { getLoyaltyAdminOverview } from '@/lib/loyalty/service'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function AdminLoyaltyPage() {
  const result = await safeQuery(getLoyaltyAdminOverview(), 'admin loyalty overview', null)
  return <LoyaltyAdminClient initialData={result.data} loadError={result.error ? 'The loyalty workspace could not load yet. Apply the loyalty migration, then retry.' : null} />
}
