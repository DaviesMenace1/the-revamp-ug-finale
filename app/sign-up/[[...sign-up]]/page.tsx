'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { AuthIntro, CustomSignUp } from '@/components/auth/custom-auth-forms'
import { safeRedirect } from '@/lib/auth/safe-redirect'

export default function SignUpPage() {
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
          title="Begin a more considered way of living."
          description="Create your account to save pieces, follow orders, book consultations, and continue your design journey."
        />
        <CustomSignUp fallbackRedirectUrl={redirectUrl} />
      </div>
    </main>
  )
}
