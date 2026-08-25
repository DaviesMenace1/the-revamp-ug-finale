import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { communityPosts, memberships, users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { safeQuery } from '@/lib/server/safe-query'
import MembershipCommunityClient from './membership-community-client'

export const dynamic = 'force-dynamic'

export default async function MembershipCommunity() {
  await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/membership/community',
  )

  const rows = await db
    .select({
      id: memberships.id,
      membershipType: memberships.membershipType,
      startDate: memberships.startDate,
      firstName: users.firstName,
      lastName: users.lastName,
      company: users.company,
      city: users.city,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.status, 'active'))
    .orderBy(desc(memberships.startDate))
    .limit(50)

  const members = rows.map((m) => ({
    id: m.id,
    name: [m.firstName, m.lastName].filter(Boolean).join(' ') || 'Member',
    tier: m.membershipType,
    company: m.company,
    city: m.city,
    memberSince: m.startDate.toISOString(),
  }))
  const postsResult = await safeQuery(
    db.select().from(communityPosts).where(eq(communityPosts.status, 'published')).orderBy(desc(communityPosts.createdAt)).limit(20),
    'membership community posts',
    [],
  )
  const posts = postsResult.data.map((post) => ({
    id: post.id,
    title: post.title,
    body: post.body,
    image: post.image,
    category: post.category,
    createdAt: post.createdAt.toISOString(),
  }))

  return <MembershipCommunityClient members={members} posts={posts} />
}
