'use server'

import { db } from '@/lib/db/client'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function createArticle(data: {
  title: string
  excerpt?: string
  content?: string
  author?: string
  category?: string
  featuredImage?: string
  status?: string
}) {
  try {
    const [article] = await db
      .insert(articles)
      .values({
        title: data.title,
        slug: slugify(data.title),
        excerpt: data.excerpt || null,
        content: data.content?.trim() || '',
        author: data.author || null,
        category: data.category || null,
        featuredImage: data.featuredImage || null,
        status: data.status || 'draft',
        publishedAt: data.status === 'published' ? new Date() : null,
      })
      .returning()

    revalidatePath('/admin/blogs')
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
    excerpt: string
    content: string
    author: string
    category: string
    featuredImage: string
    status: string
  }>,
) {
  try {
    const patch: Record<string, unknown> = { ...data, updatedAt: new Date() }

    if (data.status === 'published') {
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
    return { success: true }
  } catch (error) {
    console.error('Failed to update article:', error)
    return { success: false, error: 'Failed to update article.' }
  }
}

export async function deleteArticle(id: string) {
  try {
    await db.delete(articles).where(eq(articles.id, id))
    revalidatePath('/admin/blogs')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete article:', error)
    return { success: false, error: 'Failed to delete article.' }
  }
}
