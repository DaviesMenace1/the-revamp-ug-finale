import { db } from '@/lib/db/client'
import { articles } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import BlogsClient from './blogs-client'

export const dynamic = 'force-dynamic'

export default async function AdminBlogsPage() {
  const allArticles = await db.query.articles.findMany({
    orderBy: desc(articles.createdAt),
  })

  const formatted = allArticles.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
  }))

  return <BlogsClient initialArticles={formatted} />
}
