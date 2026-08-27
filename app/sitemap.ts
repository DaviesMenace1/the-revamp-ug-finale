import type { MetadataRoute } from 'next'
import { getPublishedSearchData } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

const staticRoutes = [
  { path: '/', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/services', priority: 0.95, changeFrequency: 'weekly' as const },
  { path: '/custom-services', priority: 0.85, changeFrequency: 'monthly' as const },
  { path: '/portfolio', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/collections', priority: 0.95, changeFrequency: 'daily' as const },
  { path: '/journal', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: '/book-consultation', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/contact', priority: 0.75, changeFrequency: 'monthly' as const },
  { path: '/faqs', priority: 0.75, changeFrequency: 'monthly' as const },
  { path: '/membership', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/membership/benefits', priority: 0.65, changeFrequency: 'monthly' as const },
  { path: '/membership/collections', priority: 0.65, changeFrequency: 'weekly' as const },
  { path: '/membership/events', priority: 0.6, changeFrequency: 'weekly' as const },
  { path: '/refund-policy', priority: 0.45, changeFrequency: 'yearly' as const },
  { path: '/return-policy', priority: 0.45, changeFrequency: 'yearly' as const },
  { path: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/legal/terms', priority: 0.3, changeFrequency: 'yearly' as const },
]

function url(path: string) {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: url(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  try {
    const { products, services, projects, articles } = await getPublishedSearchData()
    const dynamicEntries: MetadataRoute.Sitemap = []
    const seen = new Set(entries.map((entry) => entry.url))
    const add = (path: string, priority: number, changeFrequency: 'daily' | 'weekly' | 'monthly') => {
      const canonicalUrl = url(path)
      if (seen.has(canonicalUrl)) return
      seen.add(canonicalUrl)
      dynamicEntries.push({ url: canonicalUrl, changeFrequency, priority })
    }

    const categorySlugs = new Set<string>()
    for (const service of services) {
      const categorySlug = service.category?.slug?.trim()
      if (categorySlug) categorySlugs.add(categorySlug)
    }
    categorySlugs.forEach((categorySlug) => add(`/services/${encodeURIComponent(categorySlug)}`, 0.82, 'monthly'))
    services.forEach((service) => {
      const categorySlug = service.category?.slug?.trim()
      const serviceSlug = service.slug?.trim()
      if (categorySlug && serviceSlug) add(`/services/${encodeURIComponent(categorySlug)}/${encodeURIComponent(serviceSlug)}`, 0.85, 'monthly')
    })
    products.forEach((product) => {
      if (product.slug?.trim()) add(`/collections/${encodeURIComponent(product.slug.trim())}`, 0.8, 'weekly')
    })
    projects.forEach((project) => {
      if (project.slug?.trim()) add(`/portfolio/${encodeURIComponent(project.slug.trim())}`, 0.75, 'monthly')
    })
    articles.forEach((article) => {
      if (article.slug?.trim()) add(`/journal/${encodeURIComponent(article.slug.trim())}`, 0.7, 'monthly')
    })

    return [...entries, ...dynamicEntries]
  } catch (error) {
    console.error('[seo] sitemap data load failed:', error)
    return entries
  }
}
