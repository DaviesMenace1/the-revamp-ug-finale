import 'server-only'
import { auth, currentUser } from '@clerk/nextjs/server'
import { cache } from 'react'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export type UserRole = 'customer' | 'designer' | 'admin' | 'trade_member' | 'architect' | 'interior_designer' | 'editor' | 'operations_manager' | 'logistics_coordinator' | 'support_agent' | 'finance_viewer'

/**
 * The protected-route boundary only needs identity, role, and display fields.
 * Keeping this projection small avoids pulling the full user row for every
 * portal request while preserving the shape consumed by existing actions.
 */
const currentUserColumns = {
  id: users.id,
  clerkId: users.clerkId,
  email: users.email,
  firstName: users.firstName,
  lastName: users.lastName,
  role: users.role,
  avatar: users.avatar,
} as const

export type CurrentUser = typeof users.$inferSelect
export type CurrentUserProfile = typeof currentUserColumns extends Record<string, never>
  ? never
  : Awaited<ReturnType<typeof findUserProfileByClerkId>>

async function findUserProfileByClerkId(userId: string) {
  try {
    const [user] = await db
      .select(currentUserColumns)
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1)
    return user ?? null
  } catch (error) {
    console.error('[auth] user profile lookup failed for clerkId:', userId, error)
    throw new Error('We could not load your account right now. Please try again shortly.', { cause: error })
  }
}

/**
 * React cache is request-scoped in the App Router. This prevents every
 * protected component in one request from repeating the same profile query,
 * without sharing one user's authorization result with another request.
 */
const getCachedUserProfile = cache(findUserProfileByClerkId)

/**
 * Resolve the local profile and provision only when the local row is absent.
 * Existing users take one indexed lookup. The Clerk API and insert path are
 * therefore not part of the normal authenticated-page waterfall.
 */
const getOrCreateUserProfile = cache(async (userId: string) => {
  const existing = await getCachedUserProfile(userId)
  if (existing) return existing

  const clerkUser = await currentUser()
  if (!clerkUser) {
    // Session was revoked between auth() and currentUser(); treat as signed out.
    return null
  }

  const email =
    clerkUser.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress

  if (!email) {
    console.error('[auth] Clerk user has no email address; cannot provision local profile:', userId)
    throw new Error('Your account is missing an email address. Contact support.')
  }

  try {
    await db
      .insert(users)
      .values({
        clerkId: userId,
        email,
        firstName: clerkUser.firstName ?? null,
        lastName: clerkUser.lastName ?? null,
        avatar: clerkUser.imageUrl ?? null,
        // role deliberately omitted: schema default 'customer'. Roles are
        // never derived from client-controlled data.
      })
      .onConflictDoNothing({ target: users.clerkId })
  } catch (error) {
    console.error('[auth] user profile provisioning failed for clerkId:', userId, error)
    throw new Error('We could not prepare your account right now. Please try again shortly.', { cause: error })
  }

  // Do not reuse the pre-insert cached miss. A webhook may have won the race,
  // so read the row again after the insert attempt.
  const provisioned = await findUserProfileByClerkId(userId)
  if (!provisioned) {
    console.error('[auth] provisioning produced no row for clerkId:', userId, 'email:', email)
    throw new Error('Your account could not be linked. Contact support.')
  }
  return provisioned
})

/**
 * Get the current user's local database profile.
 *
 * Returns null only for a genuinely missing Clerk session or missing local
 * profile. Database failures throw a recoverable account error instead of
 * masquerading as signed-out state.
 */
export async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) return null
  return getCachedUserProfile(userId)
}

/**
 * Get the current user's local profile, provisioning it on demand when the
 * Clerk webhook has not landed yet. The request-scoped cache makes concurrent
 * protected loads share the same result.
 */
export async function getOrCreateCurrentUser(existingUserId?: string) {
  const userId = existingUserId ?? (await auth()).userId
  if (!userId) return null
  return getOrCreateUserProfile(userId)
}

/**
 * Check if user has a specific role
 */
export async function hasRole(roles: UserRole[]) {
  const user = await getCurrentUser()
  return !!user && roles.includes(user.role as UserRole)
}

/**
 * Check if user is authenticated (has a Clerk session).
 * Intentionally does NOT require a local DB row, a freshly signed-up user
 * is authenticated even before their profile row is provisioned.
 */
export async function isAuthenticated() {
  const { userId } = await auth()
  return !!userId
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

  if (!user || !user.id) return false

  switch (portal) {
    case 'admin':
      return user.role === 'admin'
    case 'trade':
      return (
        user.role === 'admin' ||
        user.role === 'trade_member' ||
        ['designer', 'architect', 'interior_designer'].includes(user.role ?? 'customer')
      )
    case 'membership': {
      const membership = await getUserMembership(user.id as string)
      return !!membership && membership.status === 'active'
    }
    case 'client':
    default:
      return user.role === 'customer' || user.role === 'admin'
  }
}
