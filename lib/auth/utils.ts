import 'server-only'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export type UserRole = 'customer' | 'designer' | 'admin' | 'trade_member' | 'architect' | 'interior_designer'

/**
 * Get the current user's local database profile.
 *
 * Returns:
 * - `null` ONLY when the visitor is genuinely unauthenticated (no Clerk session)
 *   or authenticated without a local profile yet.
 * - Throws on database failure so callers/error boundaries see a real error
 *   instead of a false "not authenticated."
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
      .then((result) => result[0])
    return user ?? null
  } catch (err) {
    console.error('[auth] getCurrentUser database error for clerkId:', userId, err)
    throw new Error('We could not load your account right now. Please try again shortly.')
  }
}

/**
 * Get the current user's local profile, provisioning it on demand if the
 * `user.created` webhook has not landed yet.
 *
 * This removes the Clerk -> local DB race deterministically:
 * - Clerk is the identity provider; `clerkId` is the stable identity key.
 * - The insert is idempotent (`onConflictDoNothing` on the unique clerkId),
 *   so a concurrent webhook insert can never create a duplicate.
 * - After the upsert we re-select, which returns the row regardless of
 *   whether we or the webhook won the race.
 */
export async function getOrCreateCurrentUser() {
  const { userId } = await auth()
  if (!userId) {
    return null
  }

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .then((result) => result[0])
    if (existing) {
      return existing
    }
  } catch (err) {
    console.error('[auth] getOrCreateCurrentUser lookup error for clerkId:', userId, err)
    throw new Error('We could not load your account right now. Please try again shortly.')
  }

  // Authenticated but no local row yet (webhook race or historical gap).
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

    const provisioned = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .then((result) => result[0])

    if (!provisioned) {
      // Extremely unlikely: insert no-op'd on email conflict with a different clerkId.
      console.error('[auth] Provisioning produced no row for clerkId:', userId, 'email:', email)
      throw new Error('Your account could not be linked. Contact support.')
    }
    return provisioned
  } catch (err) {
    if (err instanceof Error && (err.message.includes('Contact support') || err.message.includes('try again shortly'))) {
      throw err
    }
    console.error('[auth] getOrCreateCurrentUser provisioning error for clerkId:', userId, err)
    throw new Error('We could not prepare your account right now. Please try again shortly.')
  }
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
 * Intentionally does NOT require a local DB row — a freshly signed-up user
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
