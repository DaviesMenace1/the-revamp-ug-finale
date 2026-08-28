import { db } from '@/lib/db/client'
import { services, serviceCategories } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import ServicesClient from './services-client'

export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
  const allCategories = await db.query.serviceCategories.findMany({ orderBy: asc(serviceCategories.order) })
  const allServices = await db.query.services.findMany({ orderBy: asc(services.order) })

  const formattedCategories = allCategories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  const formattedServices = allServices.map((s) => ({
    ...s,
    gallery: Array.isArray(s.gallery) ? (s.gallery as string[]) : [],
    storySections: Array.isArray(s.storySections) ? s.storySections : [],
    processSteps: Array.isArray(s.processSteps) ? s.processSteps : [],
    faqs: Array.isArray(s.faqs) ? s.faqs : [],
    highlights: Array.isArray(s.highlights) ? s.highlights : [],
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
