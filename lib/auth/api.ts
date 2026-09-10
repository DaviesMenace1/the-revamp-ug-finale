import { NextResponse } from 'next/server'
import { getCurrentUserWithRole } from './server'

export async function requireAdminApi() {
  const authorization = await getCurrentUserWithRole(['admin'])
  if (authorization.authorized) return null

  const status = authorization.reason === 'unauthenticated' ? 401 : authorization.reason === 'error' ? 503 : 403
  const error = status === 401 ? 'Authentication is required.' : status === 403 ? 'You are not authorized to access this resource.' : 'Authentication is temporarily unavailable.'
  return NextResponse.json({ success: false, error }, { status })
}
