import { db } from '@/lib/db/client'
import { serviceRequests } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { safeQuery } from '@/lib/server/safe-query'
import ServiceRequestsClient from './service-requests-client'

export const dynamic = 'force-dynamic'

export default async function AdminServiceRequestsPage() {
  const result = await safeQuery(
    db.select({
      id: serviceRequests.id,
      name: serviceRequests.name,
      email: serviceRequests.email,
      phone: serviceRequests.phone,
      company: serviceRequests.company,
      serviceType: serviceRequests.serviceType,
      budget: serviceRequests.budget,
      timeline: serviceRequests.timeline,
      projectDescription: serviceRequests.projectDescription,
      status: serviceRequests.status,
      notes: serviceRequests.notes,
      createdAt: serviceRequests.createdAt,
    }).from(serviceRequests).orderBy(desc(serviceRequests.createdAt)).limit(100),
    'admin service requests',
    [],
  )

  const requests = result.data.map((request) => ({ ...request, createdAt: request.createdAt.toISOString() }))
  return <ServiceRequestsClient initialRequests={requests} loadError={result.error ? 'Some inquiries could not be loaded. Retry the page to try again.' : null} />
}
