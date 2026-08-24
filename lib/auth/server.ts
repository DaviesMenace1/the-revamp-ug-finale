import 'server-only' // Ensures this file can NEVER be accidentally imported in 'use client' components
import { auth } from '@clerk/nextjs/server'
import { getOrCreateCurrentUser, type UserRole } from '@/lib/auth/utils'
import { safeQuery } from '@/lib/server/safe-query'

export type { UserRole }

export type AuthorizationResult = {
  user: Awaited<ReturnType<typeof getOrCreateCurrentUser>>
  authorized: boolean
  /**
   * Distinguishes WHY authorization failed so callers can respond correctly:
   * - 'unauthenticated': no Clerk session -> redirect to sign-in
   * - 'forbidden': signed in but lacks the required role -> show unauthorized
   */
  reason: 'ok' | 'unauthenticated' | 'forbidden'
}

/**
 * Server-side authentication + role authorization.
 *
 * Uses on-demand provisioning (getOrCreateCurrentUser) so a user who just
 * signed up is never bounced back to sign-in while the user.created webhook
 * is still in flight. Roles come exclusively from the local database row —
 * never from client-supplied data.
 */
export async function getCurrentUserWithRole(requiredRoles: UserRole[] = []): Promise<AuthorizationResult> {
  const { userId } = await auth()
  if (!userId) {
    return { user: null, authorized: false, reason: 'unauthenticated' }
  }

  const profileResult = await safeQuery(
    getOrCreateCurrentUser(userId),
    'authenticated user profile',
    null,
  )
  if (!profileResult.data) {
    if (profileResult.error) throw new Error('We could not load your account right now. Please retry the page.')
    // Session disappeared between checks; treat as signed out.
    return { user: null, authorized: false, reason: 'unauthenticated' }
  }
  const user = profileResult.data

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role as UserRole)) {
    return { user, authorized: false, reason: 'forbidden' }
  }

  return { user, authorized: true, reason: 'ok' }
}
