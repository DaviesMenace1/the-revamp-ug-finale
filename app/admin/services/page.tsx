import { db } from '@/lib/db/client'
import { services, serviceCategories } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import ServicesClient from './services-client'

export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
  const [allCategories, allServices] = await Promise.all([
    db.query.serviceCategories.findMany({ orderBy: asc(serviceCategories.order) }),
    db.query.services.findMany({ orderBy: asc(services.order) }),
  ])

  const formattedCategories = allCategories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  const formattedServices = allServices.map((s) => ({
    ...s,
    gallery: Array.isArray(s.gallery) ? (s.gallery as string[]) : [],
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  return (
    <ServicesClient
      initialCategories={formattedCategories}
      initialServices={formattedServices}
    />
  )
}
