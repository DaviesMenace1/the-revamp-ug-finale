import { requireAdminPermission } from '@/lib/auth/admin-guard'
import { getLogisticsBoard } from '@/lib/actions/logistics'
import LogisticsClient from './logistics-client'

export const dynamic = 'force-dynamic'

export default async function LogisticsPage() {
  await requireAdminPermission('manage_logistics', '/admin/logistics')
  const { rows, staff } = await getLogisticsBoard()
  return <LogisticsClient initialRows={rows} staff={staff} />
}
