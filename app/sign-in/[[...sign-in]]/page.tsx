
'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { CustomSignIn } from '@/components/auth/custom-auth-forms'
import { safeRedirect } from '@/lib/auth/safe-redirect'

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const searchParams = useSearchParams()

  const rawRedirect = searchParams.get('redirect_url')
  const redirectUrl = rawRedirect ? safeRedirect(rawRedirect) : '/account'

  // If already signed in, push them straight to /account
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      window.location.href = redirectUrl
    }
  }, [isLoaded, isSignedIn, redirectUrl])

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
        <p className="text-sm text-muted-foreground">Loading authentication…</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-12">
      <CustomSignIn redirectUrl={redirectUrl} />
    </main>
  )
}
