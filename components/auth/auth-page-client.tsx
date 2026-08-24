'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { AuthIntro, CustomSignIn, CustomSignUp } from '@/components/auth/custom-auth-forms'

export default function AuthPageClient({ mode, redirectUrl }: { mode: 'sign-in' | 'sign-up'; redirectUrl: string }) {
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (isLoaded && isSignedIn) window.location.href = redirectUrl
  }, [isLoaded, isSignedIn, redirectUrl])

  if (!isLoaded) {
    return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16"><div className="w-full max-w-sm space-y-4 text-center"><div className="mx-auto h-2 w-16 animate-pulse rounded-full bg-gold/50" /><p className="text-sm text-muted-foreground">Preparing your secure account space…</p></div></main>
  }

  const isSignUp = mode === 'sign-up'
  return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16"><div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-20"><AuthIntro title={isSignUp ? 'Begin a more considered way of living.' : 'Welcome back to your world of considered living.'} description={isSignUp ? 'Create your account to save pieces, follow orders, book consultations, and continue your design journey.' : 'Sign in to manage saved pieces, orders, consultations, membership, and your design journey.'} />{isSignUp ? <CustomSignUp redirectUrl={redirectUrl} /> : <CustomSignIn redirectUrl={redirectUrl} />}</div></main>
}
