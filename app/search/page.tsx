import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import SearchClient from './search-client'
import { getPublishedSearchData } from '@/lib/db/queries'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

const EMPTY_SEARCH_DATA = { products: [], projects: [], articles: [], services: [] }

export default async function SearchPage() {
  const result = await safeQuery(getPublishedSearchData(), 'published site search', EMPTY_SEARCH_DATA)
  const data = result.data

  return (
    <>
      <SiteHeader />
      <main>
        <SearchClient
          data={{ products: data.products, projects: data.projects, articles: data.articles, services: data.services }}
          loadError={result.error}
        />
      </main>
      <SiteFooter />
    </>
  )
}
