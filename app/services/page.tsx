import type { Metadata } from 'next'
import { db } from '@/lib/db/client'
import { serviceCategories, services } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import ServicesListingClient from './services-listing-client'
import { safeQuery } from '@/lib/server/safe-query'
import { SchemaScript } from '@/components/seo/schema-script'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Interior Design and Architecture Services in Uganda',
  description: 'Explore interior design, architecture, furniture sourcing, procurement, 3D visualization, custom furniture, and installation support from The Revamp UG.',
  keywords: ['interior design Uganda', 'architecture companies Uganda', 'furniture sourcing Kampala', 'custom furniture Uganda', 'The Revamp UG'],
  alternates: { canonical: `${SITE_URL}/services` },
  openGraph: { type: 'website', url: `${SITE_URL}/services`, title: 'Interior Design and Architecture Services | The Revamp UG', description: 'Interior design, architecture, sourcing, procurement, and custom furniture services from The Revamp UG.' },
  twitter: { card: 'summary_large_image', title: 'Interior Design and Architecture Services | The Revamp UG', description: 'Interior design, architecture, sourcing, procurement, and custom furniture services from The Revamp UG.' },
}

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

  const itemList = grouped.flatMap((category) => category.services.map((service) => ({
    '@type': 'ListItem',
    position: grouped.slice(0, grouped.indexOf(category)).reduce((total, item) => total + item.services.length, 0) + category.services.indexOf(service) + 1,
    name: service.name,
    url: `${SITE_URL}/services/${encodeURIComponent(category.slug)}/${encodeURIComponent(service.slug)}`,
  })))

  return (
    <>
      <SchemaScript schema={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'The Revamp UG Services', url: `${SITE_URL}/services`, mainEntity: { '@type': 'ItemList', itemListElement: itemList } }} />
      <SiteHeader />
      <ServicesListingClient categories={grouped} />
      <SiteFooter />
    </>
  )
}
