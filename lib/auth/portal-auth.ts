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
 * - A profile/database failure -> redirect to a public retry screen instead of
 *   turning an ambiguous authorization result into a 500 or a false 403.
 */
export async function requirePortalUser(requiredRoles: UserRole[] = [], returnTo?: string) {
  const { user, authorized, reason } = await getCurrentUserWithRole(requiredRoles)

  if (reason === 'unauthenticated') {
    redirect(returnTo ? `/sign-in?redirect_url=${encodeURIComponent(returnTo)}` : '/sign-in')
  }

  if (reason === 'error') {
    const target = returnTo || '/client'
    redirect(`/account/unavailable?returnTo=${encodeURIComponent(target)}`)
  }

  if (!authorized || !user) {
    redirect('/unauthorized')
  }

  return user
}
