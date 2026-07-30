import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export type UserRole = 'customer' | 'designer' | 'admin' | 'trade_member' | 'architect' | 'interior_designer'

/**
 * Get the current user session with their database profile
 */
export async function getCurrentUser() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .then(result => result[0])

    return user || null
  } catch (err) {
    console.error('[v0] Error fetching current user:', err)
    return null
  }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(roles: UserRole[]) {
  const user = await getCurrentUser()
  return user && roles.includes(user.role as UserRole)
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const user = await getCurrentUser()
  return !!user
}

/**
 * Get user's membership info (if member)
 */
export async function getUserMembership(userId: string) {
  const { memberships } = await import('@/lib/db/schema')
  const [membership] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .orderBy((t) => t.startDate)
    .limit(1)

  return membership || null
}

/**
 * Get user's trade member info (if trade member)
 */
export async function getUserTradeMember(userId: string) {
  const { tradeMembers } = await import('@/lib/db/schema')
  const [tradeMember] = await db
    .select()
    .from(tradeMembers)
    .where(eq(tradeMembers.userId, userId))
    .limit(1)

  return tradeMember || null
}

/**
 * Verify user has access to portal
 */
export async function verifyPortalAccess(portal: 'client' | 'trade' | 'membership' | 'admin'): Promise<boolean> {
  const user = await getCurrentUser()
  
  if (!user) return false

  switch (portal) {
    case 'admin':
      return user.role === 'admin'
    case 'trade':
      return user.role === 'admin' || user.role === 'trade_member' || ['designer', 'architect', 'interior_designer'].includes(user.role)
    case 'membership':
      const membership = await getUserMembership(user.id)
      return !!membership && membership.status === 'active'
    case 'client':
    default:
      return user.role === 'customer' || user.role === 'admin'
  }
}
