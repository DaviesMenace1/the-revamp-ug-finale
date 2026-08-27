import type { Metadata } from 'next'
import { db } from '@/lib/db/client'
import { articles } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import JournalListingClient from './journal-listing-client'
import { SchemaScript } from '@/components/seo/schema-script'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Design Journal | Interior Design, Architecture and Furniture',
  description: 'Read practical design perspectives from The Revamp UG on interiors, architecture, furniture, sourcing, and creating better spaces in Uganda.',
  keywords: ['interior design ideas Uganda', 'architecture Uganda', 'furniture guide Kampala', 'design journal Uganda', 'The Revamp UG'],
  alternates: { canonical: `${SITE_URL}/journal` },
  openGraph: { type: 'website', url: `${SITE_URL}/journal`, title: 'Design Journal | The Revamp UG', description: 'Perspectives on interiors, architecture, furniture, and considered spaces.' },
  twitter: { card: 'summary_large_image', title: 'Design Journal | The Revamp UG', description: 'Perspectives on interiors, architecture, furniture, and considered spaces.' },
}

export default async function JournalPage() {
  const allArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.publishedAt))

  const formatted = allArticles.map((a) => {
    const wordCount = (a.content || '').split(/\s+/).filter(Boolean).length
    const readTime = `${Math.max(1, Math.round(wordCount / 200))} min read`

    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      author: a.author,
      date: (a.publishedAt || a.createdAt).toISOString(),
      readTime,
      imageUrl: a.featuredImage,
    }
  })

  const articleItems = formatted.map((article, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: article.title,
    url: `${SITE_URL}/journal/${encodeURIComponent(article.slug)}`,
  }))

  return (
    <>
      <SchemaScript schema={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'The Revamp UG Design Journal', url: `${SITE_URL}/journal`, mainEntity: { '@type': 'ItemList', itemListElement: articleItems } }} />
      <JournalListingClient articles={formatted} />
    </>
  )
}
