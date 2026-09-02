import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'
export const revalidate = 86_400

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

const staticRoutes = [
  { path: '/', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/services', priority: 0.95, changeFrequency: 'weekly' as const },
  { path: '/custom-services', priority: 0.85, changeFrequency: 'monthly' as const },
  { path: '/source-with-revamp', priority: 0.85, changeFrequency: 'monthly' as const },
  { path: '/trade-program', priority: 0.75, changeFrequency: 'monthly' as const },
  { path: '/membership-program', priority: 0.75, changeFrequency: 'monthly' as const },
  { path: '/portfolio', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/collections', priority: 0.95, changeFrequency: 'daily' as const },
  { path: '/journal', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: '/book-consultation', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/contact', priority: 0.75, changeFrequency: 'monthly' as const },
  { path: '/support', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/faqs', priority: 0.75, changeFrequency: 'monthly' as const },
  { path: '/refund-policy', priority: 0.45, changeFrequency: 'yearly' as const },
  { path: '/return-policy', priority: 0.45, changeFrequency: 'yearly' as const },
  { path: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/legal/terms', priority: 0.3, changeFrequency: 'yearly' as const },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return staticRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
