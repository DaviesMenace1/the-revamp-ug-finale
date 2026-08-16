import { db } from '@/lib/db/client'
import { articles } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import JournalListingClient from './journal-listing-client'

export const dynamic = 'force-dynamic'

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

  return <JournalListingClient articles={formatted} />
}
