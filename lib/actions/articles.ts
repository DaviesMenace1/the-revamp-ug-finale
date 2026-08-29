'use server'

import { db } from '@/lib/db/client'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { invalidateCachePattern } from '@/lib/redis/cache'

async function revalidatePublicArticleContent() {
  revalidatePath('/')
  revalidatePath('/journal')
  revalidatePath('/journal/[slug]', 'page')
  await invalidateCachePattern('articles:list:*')
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function createArticle(data: {
  title: string
  introduction?: string
  excerpt?: string
  content?: string
  author?: string
  category?: string
  featuredImage?: string
  gallery?: string[]
  storySections?: unknown[]
  pullQuotes?: unknown[]
  relatedArticles?: string[]
  relatedServices?: string[]
  relatedProjects?: string[]
  status?: string
}) {
  if (!(await getCurrentUserWithRole(['admin', 'editor'])).authorized) return { success: false, error: 'You are not authorized to manage articles.' }
  try {
    const status = data.status === 'draft' ? 'draft' : 'published'
    const [article] = await db
      .insert(articles)
      .values({
        title: data.title,
        introduction: data.introduction || null,
        pullQuotes: data.pullQuotes || [],
        relatedArticles: data.relatedArticles || [],
        relatedServices: data.relatedServices || [],
        relatedProjects: data.relatedProjects || [],
        slug: slugify(data.title),
        excerpt: data.excerpt || null,
        content: data.content?.trim() || '',
        author: data.author || null,
        category: data.category || null,
        featuredImage: data.featuredImage || null,
        gallery: data.gallery || [],
        storySections: data.storySections || [],
        status,
        publishedAt: status === 'published' ? new Date() : null,
      })
      .returning()

    revalidatePath('/admin/blogs')
    await revalidatePublicArticleContent()
    return { success: true, article }
  } catch (error) {
    console.error('Failed to create article:', error)
    return { success: false, error: 'Failed to create article.' }
  }
}

export async function updateArticle(
  id: string,
  data: Partial<{
    title: string
    introduction: string
    excerpt: string
    content: string
    author: string
    category: string
    featuredImage: string
    gallery: string[]
    storySections: unknown[]
    pullQuotes: unknown[]
    relatedArticles: string[]
    relatedServices: string[]
    relatedProjects: string[]
    status: string
  }>,
) {
  if (!(await getCurrentUserWithRole(['admin', 'editor'])).authorized) return { success: false, error: 'You are not authorized to manage articles.' }
  try {
    const patch: Record<string, unknown> = { ...data, updatedAt: new Date() }
    if (data.status !== undefined) patch.status = data.status === 'draft' ? 'draft' : 'published'

    if (patch.status === 'published') {
      const existing = await db.query.articles.findFirst({
        where: eq(articles.id, id),
        columns: { publishedAt: true },
      })
      if (!existing?.publishedAt) {
        patch.publishedAt = new Date()
      }
    }

    await db.update(articles).set(patch).where(eq(articles.id, id))

    revalidatePath('/admin/blogs')
    await revalidatePublicArticleContent()
    return { success: true }
  } catch (error) {
    console.error('Failed to update article:', error)
    return { success: false, error: 'Failed to update article.' }
  }
}

export async function deleteArticle(id: string) {
  if (!(await getCurrentUserWithRole(['admin', 'editor'])).authorized) return { success: false, error: 'You are not authorized to manage articles.' }
  try {
    await db.delete(articles).where(eq(articles.id, id))
    revalidatePath('/admin/blogs')
    await revalidatePublicArticleContent()
    return { success: true }
  } catch (error) {
    console.error('Failed to delete article:', error)
    return { success: false, error: 'Failed to delete article.' }
  }
}
