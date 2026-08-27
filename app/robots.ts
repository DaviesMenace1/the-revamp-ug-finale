import type { MetadataRoute } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')
const privatePaths = ['/admin/', '/api/', '/client/', '/account/', '/checkout/', '/cart/', '/wishlist/', '/orders/', '/login/', '/sign-in/', '/sign-up/', '/auth/', '/dashboard/', '/tmp/', '/private/']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: privatePaths },
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: '*', allow: '/', disallow: [...privatePaths, '/_next/'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
