'use client'

import { useMemo } from 'react'
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import { safeRedirect } from '@/lib/auth/safe-redirect'

export default function SignInSsoCallback() {
  const redirectUrl = useMemo(
    () =>
      typeof window === 'undefined'
        ? '/account'
        : safeRedirect(new URLSearchParams(window.location.search).get('redirect_url')),
    [],
  )

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <p className="text-sm text-muted-foreground">Completing secure sign in…</p>
      <AuthenticateWithRedirectCallback signInForceRedirectUrl={redirectUrl} signUpForceRedirectUrl={redirectUrl} />
    </main>
  )
}
