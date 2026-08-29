import { db } from '@/lib/db/client'
import { services, serviceCategories } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import ServicesClient from './services-client'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
  const [categoriesResult, servicesResult] = await Promise.all([
    safeQuery(
      db.query.serviceCategories.findMany({
        limit: 60,
        orderBy: asc(serviceCategories.order),
        columns: { id: true, name: true, slug: true, description: true, image: true, status: true, createdAt: true, updatedAt: true },
      }),
      'admin service categories',
      [],
    ),
    safeQuery(
      db.query.services.findMany({
        limit: 60,
        orderBy: asc(services.order),
        columns: {
          id: true,
          categoryId: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          featured: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      'admin services',
      [],
    ),
  ])

  const formattedCategories = categoriesResult.data.map((category) => ({
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  }))

  const formattedServices = servicesResult.data.map((service) => ({
    ...service,

    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  }))

  const loadError = categoriesResult.error || servicesResult.error

  return <ServicesClient initialCategories={formattedCategories} initialServices={formattedServices} loadError={loadError ? 'Some services data is temporarily unavailable. You can retry the page.' : null} />
}
