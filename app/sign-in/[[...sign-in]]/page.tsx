'use client'

import { useMemo } from 'react'
import { CustomSignIn, AuthIntro } from '@/components/auth/custom-auth-forms'

function safeRedirect(value: string | null) { if (!value) return '/account'; try { const url = new URL(value, window.location.origin); return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : '/account' } catch { return '/account' } }

export default function SignInPage() {
  const redirectUrl = useMemo(() => typeof window === 'undefined' ? '/account' : safeRedirect(new URLSearchParams(window.location.search).get('redirect_url')), [])
  return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16"><div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-20"><AuthIntro title="Welcome back to your world of considered living." description="Sign in to manage saved pieces, orders, consultations, membership, and your design journey." /><CustomSignIn redirectUrl={redirectUrl} /></div></main>
}
