'use client'

import { useEffect, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { AuthIntro, CustomSignUp } from '@/components/auth/custom-auth-forms'

function safeRedirect(value: string | null) { if (!value) return '/account'; try { const url = new URL(value, window.location.origin); return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : '/account' } catch { return '/account' } }

export default function SignUpPage() {
  const redirectUrl = useMemo(() => typeof window === 'undefined' ? '/account' : safeRedirect(new URLSearchParams(window.location.search).get('redirect_url')), [])
  const { isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    if (isLoaded && isSignedIn) window.location.replace(redirectUrl)
  }, [isLoaded, isSignedIn, redirectUrl])

  if (isLoaded && isSignedIn) {
    return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16"><p className="text-sm text-muted-foreground">Opening your account…</p></main>
  }

  return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16"><div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-20"><AuthIntro title="Begin a more considered way of living." description="Create your account to save pieces, follow orders, book consultations, and continue your design journey." /><CustomSignUp redirectUrl={redirectUrl} /></div></main>
}
