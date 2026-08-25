
'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { CustomSignUp, AuthIntro } from '@/components/auth/custom-auth-forms'
import { safeRedirect } from '@/lib/auth/safe-redirect'

export default function SignUpPage() {
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
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-20">
        <AuthIntro
          title="Begin a more considered way of living."
          description="Create your account to save pieces, follow orders, book consultations, and continue your design journey."
        />
        <CustomSignUp redirectUrl={redirectUrl} />
      </div>
    </main>
  )
}
