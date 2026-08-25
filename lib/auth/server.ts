import 'server-only' // Ensures this file can NEVER be accidentally imported in 'use client' components
import { auth } from '@clerk/nextjs/server'
import { getOrCreateCurrentUser, type UserRole } from '@/lib/auth/utils'

export type { UserRole }

export type AuthorizationResult = {
  user: Awaited<ReturnType<typeof getOrCreateCurrentUser>>
  authorized: boolean
  /**
   * Distinguishes WHY authorization failed so callers can respond correctly:
   * - 'unauthenticated': no Clerk session -> redirect to sign-in
   * - 'forbidden': signed in but lacks the required role -> show unauthorized
   * - 'error': the session exists but the local profile could not be resolved
   */
  reason: 'ok' | 'unauthenticated' | 'forbidden' | 'error'
  error?: 'profile_unavailable'
}

/**
 * Server-side authentication + role authorization.
 *
 * The profile helper performs one indexed, minimal-column lookup for existing
 * users and caches that result for the current server-rendered request. It is
 * deliberately not wrapped in the generic Promise.race page timeout: that
 * race cannot cancel a database promise and can leave the single serverless
 * connection occupied after the page has already failed.
 *
 * A profile/database error is always deny-by-default. Callers can render a
 * recoverable state or return 503; no ambiguous database result can grant a
 * role-protected request.
 */
export async function getCurrentUserWithRole(requiredRoles: UserRole[] = []): Promise<AuthorizationResult> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { user: null, authorized: false, reason: 'unauthenticated' }
    }

    const user = await getOrCreateCurrentUser(userId)
    if (!user) {
      // Session disappeared between checks; treat as signed out.
      return { user: null, authorized: false, reason: 'unauthenticated' }
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role as UserRole)) {
      return { user, authorized: false, reason: 'forbidden' }
    }

    return { user, authorized: true, reason: 'ok' }
  } catch (error) {
    console.error('[auth] protected authorization unavailable:', error)
    return { user: null, authorized: false, reason: 'error', error: 'profile_unavailable' }
  }
}
