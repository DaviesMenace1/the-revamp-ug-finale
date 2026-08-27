import 'server-only'

import { redirect } from 'next/navigation'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { hasPermission, type AdminPermission } from '@/lib/auth/permissions'

export async function requireAdminPermission(permission: AdminPermission, returnTo = '/admin') {
  const authorization = await getCurrentUserWithRole()
  if (authorization.reason === 'unauthenticated') redirect(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`)
  if (authorization.reason === 'error') redirect(`/account/unavailable?returnTo=${encodeURIComponent(returnTo)}`)
  if (!authorization.user || !hasPermission(authorization.user.role, permission)) redirect('/unauthorized')
  return authorization.user
}
