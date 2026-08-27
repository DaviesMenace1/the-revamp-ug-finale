import { listRefundRequests } from '@/lib/actions/order-lifecycle'
import RefundsClient from './refunds-client'

export const dynamic = 'force-dynamic'

export default async function RefundsPage() {
  const requests = await listRefundRequests()
  return <RefundsClient initialRequests={requests} />
}
