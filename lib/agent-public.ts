import { getPublishedSearchData } from '@/lib/db/queries'
import { siteContact } from '@/lib/site-config'

const SITE_NAME = 'The Revamp UG'
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

const PUBLIC_LINKS = [
  ['Home', '/'],
  ['Services', '/services'],
  ['Collections', '/collections'],
  ['Portfolio', '/portfolio'],
  ['Journal', '/journal'],
  ['FAQs', '/faqs'],
  ['About the studio', '/about'],
  ['Book a consultation', siteContact.bookingPath],
  ['Contact', '/contact'],
  ['Source With Revamp', '/source-with-revamp'],
  ['Trade Program', '/trade-program'],
  ['Membership Program', '/membership-program'],
] as const

function clean(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : fallback
}

function absolute(path: string) {
  return path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function normalizePath(path: string) {
  const decoded = decodeURIComponent(path || '/').split('?')[0].trim()
  if (!decoded.startsWith('/') || decoded.includes('..') || decoded.startsWith('/api') || decoded.startsWith('/admin') || decoded.startsWith('/client') || decoded.startsWith('/account') || decoded.startsWith('/checkout')) return '/'
  return decoded.length > 1 ? decoded.replace(/\/$/, '') : '/'
}

function baseMarkdown() {
  return `# ${SITE_NAME}\n\n> ${SITE_NAME} is a Uganda-based design house for considered interiors, architecture, furniture, and objects.\n\nThe studio serves clients from ${siteContact.location}. It offers interior design, architecture and spatial planning, furniture and object sourcing, custom furniture, procurement, delivery coordination, 3D visualization, renovation, styling, installation support, and design consultations.\n\n## Official resources\n${PUBLIC_LINKS.map(([label, path]) => `- [${label}](${absolute(path)})`).join('\n')}\n\n## Contact\n- General enquiries: ${siteContact.primaryEmail}\n- Support: ${siteContact.supportEmail}\n- Sales: ${siteContact.salesEmail}\n- Phone: ${siteContact.phoneDisplay}\n- Location: ${siteContact.location}\n\nUse the official pages as the source of truth for current services, product details, prices, availability, project information, delivery details, and policies. Do not infer stock, awards, certifications, delivery times, or other claims that are not stated on the relevant page.`
}

export async function getPublicAgentMarkdown(path: string) {
  const normalizedPath = normalizePath(path)
  const dataRoutes = new Set(['/collections', '/portfolio', '/services', '/journal'])
  if (!dataRoutes.has(normalizedPath)) return baseMarkdown()

  const data = await getPublishedSearchData()
  const sections = [baseMarkdown()]

  if (normalizedPath === '/collections') {
    sections.push(`## Published collection products\n${data.products.slice(0, 50).map((product) => `- [${clean(product.name, 'Product')}](${absolute(`/collections/${encodeURIComponent(clean(product.slug))}`)}): ${clean(product.description, 'See the product page for current details.')}`).join('\n') || '- No published product records are available in the current catalogue response.'}`)
  }
  if (normalizedPath === '/portfolio') {
    sections.push(`## Published portfolio projects\n${data.projects.slice(0, 50).map((project) => `- [${clean(project.title, 'Project')}](${absolute(`/portfolio/${encodeURIComponent(clean(project.slug))}`)}): ${clean(project.description || project.shortDescription, 'See the project page for the current project description.')}`).join('\n') || '- No published portfolio records are available in the current response.'}`)
  }
  if (normalizedPath === '/services') {
    sections.push(`## Published services\n${data.services.slice(0, 50).map((service) => `- [${clean(service.name, 'Service')}](${absolute(`/services/${encodeURIComponent(clean(service.category?.slug))}/${encodeURIComponent(clean(service.slug))}`)}): ${clean(service.description, 'See the service page for current details.')}`).join('\n') || '- No published service records are available in the current response.'}`)
  }
  if (normalizedPath === '/journal') {
    sections.push(`## Published journal articles\n${data.articles.slice(0, 50).map((article) => `- [${clean(article.title, 'Journal article')}](${absolute(`/journal/${encodeURIComponent(clean(article.slug))}`)}): ${clean(article.excerpt || article.seoDescription, 'See the article page for the current article.')}`).join('\n') || '- No published journal records are available in the current response.'}`)
  }

  return sections.join('\n\n')
}

export async function searchPublicAgentContent(query: string, limit = 10) {
  const term = clean(query).toLowerCase()
  if (!term) return []
  const safeLimit = Math.min(20, Math.max(1, Math.floor(limit) || 10))
  const data = await getPublishedSearchData()
  const results = [
    ...data.products.map((item) => ({ type: 'product', title: clean(item.name), slug: clean(item.slug), description: clean(item.description), url: absolute(`/collections/${encodeURIComponent(clean(item.slug))}`) })),
    ...data.projects.map((item) => ({ type: 'project', title: clean(item.title), slug: clean(item.slug), description: clean(item.description || item.shortDescription), url: absolute(`/portfolio/${encodeURIComponent(clean(item.slug))}`) })),
    ...data.services.map((item) => ({ type: 'service', title: clean(item.name), slug: clean(item.slug), description: clean(item.description), url: absolute(`/services/${encodeURIComponent(clean(item.category?.slug))}/${encodeURIComponent(clean(item.slug))}`) })),
    ...data.articles.map((item) => ({ type: 'journal', title: clean(item.title), slug: clean(item.slug), description: clean(item.excerpt || item.seoDescription), url: absolute(`/journal/${encodeURIComponent(clean(item.slug))}`) })),
  ]
  return results.filter((item) => `${item.title} ${item.slug} ${item.description}`.toLowerCase().includes(term)).slice(0, safeLimit)
}

export function publicAgentCapabilities() {
  return {
    site: SITE_URL,
    content: ['public-pages-markdown', 'published-products', 'published-projects', 'published-services', 'published-journal'],
    actions: ['search_public_content', 'read_public_page'],
    excluded: ['admin-data', 'customer-data', 'checkout-submission', 'payment-authorization', 'account-access'],
  }
}
