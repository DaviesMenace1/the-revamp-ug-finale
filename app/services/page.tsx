import { db } from '@/lib/db/client'
import { serviceCategories, services } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import ServicesListingClient from './services-listing-client'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  const categoriesResult = await safeQuery(
    db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.status, 'published'))
      .orderBy(asc(serviceCategories.order)),
    'service categories',
    [],
  )
  const servicesResult = await safeQuery(
    db
      .select()
      .from(services)
      .where(eq(services.status, 'published'))
      .orderBy(asc(services.order)),
    'services',
    [],
  )
  const categories = categoriesResult.data
  const allServices = servicesResult.data

  const grouped = categories
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      services: allServices
        .filter((s) => s.categoryId === category.id)
        .map((s) => ({
          slug: s.slug,
          name: s.name,
          description: s.description,
          image: s.image,
        })),
    }))
    .filter((category) => category.services.length > 0)

  return <ServicesListingClient categories={grouped} />
}
