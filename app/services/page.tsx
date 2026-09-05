import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PrototypeServices } from '@/components/sections/prototype-services'
import { getPublishedSearchData } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Services — The Revamp UG', description: 'End-to-end concierge for luxury interiors and architecture: sourcing, importing, white-glove installation, styling and architectural services for residences in Uganda.' }

export default async function ServicesPage() {
  const searchData = await getPublishedSearchData().catch(() => ({ products: [], projects: [], articles: [], services: [] }))
  return <><SiteHeader /><main><PrototypeServices liveServices={searchData.services} /></main><SiteFooter /></>
}
