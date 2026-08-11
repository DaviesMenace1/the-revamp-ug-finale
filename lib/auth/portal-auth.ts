// lib/auth/portal-auth.ts
import 'server-only'
import { redirect } from 'next/navigation'
import { getCurrentUserWithRole, type UserRole } from '@/lib/auth/server'

export type { UserRole }

/**
 * Validates auth and user role for Server Components, Layouts, and Actions.
 *
 * - Unauthenticated -> redirect to /sign-in (preserving the return path).
 * - Authenticated but lacking the required role -> redirect to /unauthorized.
 * - Signed in with no local profile row -> the row is provisioned on demand
 *   (never bounced back to /sign-in, which previously caused redirect loops).
 */
export async function requirePortalUser(requiredRoles: UserRole[] = [], returnTo?: string) {
  const { user, authorized, reason } = await getCurrentUserWithRole(requiredRoles)

  if (reason === 'unauthenticated') {
    redirect(returnTo ? `/sign-in?redirect_url=${encodeURIComponent(returnTo)}` : '/sign-in')
  }

  if (!authorized || !user) {
    redirect('/unauthorized')
  }

  return user
}
