'use server'

import { db } from '@/lib/db/client'
import { communityPosts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithRole } from '@/lib/auth/server'

type CommunityPostInput = {
  title: string
  body: string
  image?: string | null
  category?: string | null
  status?: string
}

const POST_STATUSES = new Set(['draft', 'published', 'archived'])

function validatePost(input: CommunityPostInput) {
  const title = input.title.trim().slice(0, 255)
  const body = input.body.trim().slice(0, 8000)
  const image = input.image?.trim().slice(0, 1000) || null
  const category = input.category?.trim().slice(0, 50) || 'announcement'
  const status = input.status?.trim() || 'draft'
  if (!title) return { error: 'Post title is required.' }
  if (!body) return { error: 'Post body is required.' }
  if (!POST_STATUSES.has(status)) return { error: 'Choose a valid post status.' }
  return { value: { title, body, image, category, status } }
}

function revalidateCommunity() {
  revalidatePath('/admin/community')
  revalidatePath('/membership/community')
  revalidatePath('/membership')
}

async function requireAdmin() {
  const authorization = await getCurrentUserWithRole(['admin', 'editor'])
  return authorization.authorized && authorization.user ? authorization.user : null
}

export async function createCommunityPost(input: CommunityPostInput) {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'You are not authorized to manage community posts.' }
  const parsed = validatePost(input)
  if (!parsed.value) return { success: false, error: parsed.error || 'Invalid community post.' }
  try {
    const [post] = await db.insert(communityPosts).values({ ...parsed.value, createdBy: admin.id }).returning()
    revalidateCommunity()
    return { success: true, post }
  } catch (error) {
    console.error('Failed to create community post:', error)
    return { success: false, error: 'Failed to create community post.' }
  }
}

export async function updateCommunityPost(postId: string, input: CommunityPostInput) {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'You are not authorized to manage community posts.' }
  const parsed = validatePost(input)
  if (!parsed.value) return { success: false, error: parsed.error || 'Invalid community post.' }
  try {
    const [post] = await db.update(communityPosts).set({ ...parsed.value, updatedAt: new Date() }).where(eq(communityPosts.id, postId)).returning()
    if (!post) return { success: false, error: 'Community post not found.' }
    revalidateCommunity()
    return { success: true, post }
  } catch (error) {
    console.error('Failed to update community post:', error)
    return { success: false, error: 'Failed to update community post.' }
  }
}

export async function deleteCommunityPost(postId: string) {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'You are not authorized to manage community posts.' }
  try {
    const [post] = await db.delete(communityPosts).where(eq(communityPosts.id, postId)).returning({ id: communityPosts.id })
    if (!post) return { success: false, error: 'Community post not found.' }
    revalidateCommunity()
    return { success: true }
  } catch (error) {
    console.error('Failed to delete community post:', error)
    return { success: false, error: 'Failed to delete community post.' }
  }
}
