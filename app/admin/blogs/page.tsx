import { db } from '@/lib/db/client'
import { articles } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import BlogsClient from './blogs-client'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function AdminBlogsPage() {
  const result = await safeQuery(
    db.query.articles.findMany({ orderBy: desc(articles.createdAt) }),
    'admin blogs',
    [],
  )

  const formatted = result.data.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
  }))

  return <BlogsClient initialArticles={formatted} loadError={result.error ? 'Articles are temporarily unavailable. You can retry the page.' : null} />
}
