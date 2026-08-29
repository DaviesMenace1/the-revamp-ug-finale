
'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { CustomSignUp } from '@/components/auth/custom-auth-forms'
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
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#211c18] px-4 py-8 sm:px-6 sm:py-12">
      <div className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: "url('https://res.cloudinary.com/r8epy5mg/image/upload/v1785487052/IMG_3517_1_fq8p74.jpg')" }} aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-[#211c18]/60" aria-hidden="true" />
      <CustomSignUp redirectUrl={redirectUrl} />
    </main>
  )
}
