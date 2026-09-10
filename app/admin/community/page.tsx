import { desc } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { communityPosts } from '@/lib/db/schema'
import CommunityAdminClient from './community-admin-client'

export const dynamic = 'force-dynamic'

export default async function AdminCommunityPage() {
  const posts = await db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt)).limit(100)
  return <CommunityAdminClient posts={posts.map((post) => ({ ...post, createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString() }))} />
}
