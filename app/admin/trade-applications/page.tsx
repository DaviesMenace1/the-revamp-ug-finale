import { getTradeApplications } from '@/lib/actions/trade-program'
import TradeApplicationsClient from './trade-applications-client'

export const dynamic = 'force-dynamic'

export default async function TradeApplicationsPage() {
  const applications = await getTradeApplications()
  return <TradeApplicationsClient initialApplications={applications.map((application) => ({ ...application, appliedAt: application.appliedAt.toISOString(), approvedAt: application.approvedAt?.toISOString() || null }))} />
}
