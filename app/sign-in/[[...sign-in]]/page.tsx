'use client'

import { useEffect, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { CustomSignIn, AuthIntro } from '@/components/auth/custom-auth-forms'
import { safeRedirect } from '@/lib/auth/safe-redirect'
import { AccountPage } from '@/app/account'

export default function SignInPage() {
  const redirectUrl = useMemo(() => typeof window === 'undefined' ? '/account' : safeRedirect(new URLSearchParams(window.location.search).get('redirect_url')), [])
  const { isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    if (isLoaded && isSignedIn) window.location.replace(redirectUrl)
  }, [isLoaded, isSignedIn, redirectUrl])

  if (isLoaded && isSignedIn) {
    return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16"><p className="text-sm text-muted-foreground">Opening your account…</p></main>
  }

  return <AccountPage />
}

{/*return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16"><div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-20"><AuthIntro title="Welcome back to your world of considered living." description="Sign in to manage saved pieces, orders, consultations, membership, and your design journey." /><CustomSignIn redirectUrl={redirectUrl} /></div></main> */}