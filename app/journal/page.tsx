import type { Metadata } from 'next'
import { db } from '@/lib/db/client'
import { articles } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import JournalListingClient from './journal-listing-client'
import { SchemaScript } from '@/components/seo/schema-script'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Journal - The Revamp UG',
  description: 'Dispatches from ateliers, essays on craft, and the stories behind the pieces we source.',
  keywords: ['interior design ideas Uganda', 'architecture Uganda', 'furniture guide Kampala', 'design journal Uganda', 'The Revamp UG'],
  alternates: { canonical: `${SITE_URL}/journal` },
  openGraph: { type: 'website', url: `${SITE_URL}/journal`, title: 'Journal - The Revamp UG', description: 'Field notes from the studio.' },
  twitter: { card: 'summary_large_image', title: 'Journal - The Revamp UG', description: 'Field notes from the studio.' },
}

export default async function JournalPage() {
  const articlesResult = await safeQuery(
    db
      .select()
      .from(articles)
      .where(eq(articles.status, 'published'))
      .orderBy(desc(articles.publishedAt)),
    'journal articles',
    [],
  )

  const formatted = articlesResult.data.map((a) => {
    const wordCount = (a.content || '').split(/\s+/).filter(Boolean).length
    const readTime = `${Math.max(1, Math.round(wordCount / 200))} min read`

    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      content: a.content,
      introduction: a.introduction,
      excerpt: a.excerpt,
      category: a.category,
      author: a.author,
      tags: a.tags,
      date: new Date(a.publishedAt || a.createdAt).toISOString(),
      readTime,
      imageUrl: a.featuredImage,
      gallery: Array.isArray(a.gallery) ? a.gallery : [],
      rating: a.rating,
      ratingCount: a.ratingCount,
      likes: a.likes,
      views: a.views,
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
