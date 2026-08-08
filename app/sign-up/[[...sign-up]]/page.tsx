'use client'

import { useMemo } from 'react'
import { SignUp } from '@clerk/nextjs'

function getSafeRedirectUrl(value: string | null) {
  if (!value) return '/account'
  try {
    const parsed = new URL(value, window.location.origin)
    if (parsed.origin !== window.location.origin) return '/account'
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return '/account'
  }
}

export default function SignUpPage() {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const redirectUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/account'
    return getSafeRedirectUrl(new URLSearchParams(window.location.search).get('redirect_url'))
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-20">
        <section className="max-w-xl text-center lg:text-left">
          <p className="font-sans text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">The Revamp UG</p>
          <h1 className="mt-5 font-serif text-5xl leading-[0.95] text-foreground sm:text-6xl">Begin a more considered way of living.</h1>
          <p className="mt-6 max-w-md font-sans text-base leading-7 text-muted-foreground">Create your account to save pieces, follow orders, book consultations, and continue your design journey.</p>
        </section>
        <div className="w-full max-w-md rounded-sm border border-border bg-card p-2 shadow-sm sm:p-4">
          {!clerkPublishableKey ? (
            <div role="alert" className="p-8 text-center font-sans text-sm leading-6 text-muted-foreground">
              Authentication is temporarily unavailable. Please configure the Clerk publishable key for this deployment.
            </div>
          ) : <SignUp
            routing="path"
            path="/sign-up"
            fallbackRedirectUrl={redirectUrl}
            signInUrl="/sign-in"
            appearance={{ elements: { rootBox: 'w-full', card: 'w-full border-0 bg-transparent shadow-none' } }}
          />}
        </div>
      </div>
    </main>
  )
}
