'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { CustomSignIn, AuthIntro } from '@/components/auth/custom-auth-forms'
import { safeRedirect } from '@/lib/auth/safe-redirect'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const { isLoaded, isSignedIn } = useUser()
  const [redirectUrl, setRedirectUrl] = useState('/account')

  useEffect(() => {
    const rawRedirect = searchParams.get('redirect_url')
    if (rawRedirect) {
      setRedirectUrl(safeRedirect(rawRedirect))
    }
  }, [searchParams])

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Use replace so browser back-button doesn't re-trigger the sign-in loop
      window.location.replace(redirectUrl)
    }
  }, [isLoaded, isSignedIn, redirectUrl])

  if (isLoaded && isSignedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
        <p className="text-sm text-muted-foreground">Opening your account…</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-20">
        <AuthIntro
          title="Welcome back to your world of considered living."
          description="Sign in to manage saved pieces, orders, consultations, membership, and your design journey."
        />
        <CustomSignIn fallbackRedirectUrl={redirectUrl} />
      </div>
    </main>
  )
}

{/*return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16"><div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-20"><AuthIntro title="Welcome back to your world of considered living." description="Sign in to manage saved pieces, orders, consultations, membership, and your design journey." /><CustomSignIn redirectUrl={redirectUrl} /></div></main> */}