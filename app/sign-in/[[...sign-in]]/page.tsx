'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function CustomSignInPage() {
  const { isLoaded, signIn, setActive, errors: clerkErrors } = useSignIn() as any
  const router = useRouter()

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  
  // UI & Diagnostics State
  const [verifyingFactor, setVerifyingFactor] = useState(false)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [redirectPath, setRedirectPath] = useState('/account')

  // Parse redirect URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const rawRedirect = params.get('redirect_url')
    
    if (rawRedirect) {
      try {
        const parsed = new URL(rawRedirect, window.location.origin)
        if (parsed.origin === window.location.origin) {
          setRedirectPath(`${parsed.pathname}${parsed.search}${parsed.hash}`)
        }
      } catch {
        setRedirectPath('/account')
      }
    }
  }, [])

  // Handle Form Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorDetails(null)

    if (!isLoaded || !signIn) {
      setErrorDetails('Clerk is still loading or could not connect to authentication services.')
      return
    }

    setLoading(true)

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push(redirectPath)
      } else if (result.status === 'needs_second_factor') {
        setVerifyingFactor(true)
      } else {
        setErrorDetails(`Unhandled sign-in status: ${result.status}`)
      }
    } catch (err: any) {
      // Print exact API error message directly to the UI
      console.error('Sign-in Error:', err)
      const rawError = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || JSON.stringify(err)
      setErrorDetails(rawError)
    } finally {
      setLoading(false)
    }
  }

  // Combine hook-level errors or runtime errors
  const activeError = errorDetails || (clerkErrors?.length > 0 ? clerkErrors[0].message : null)

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-20">
        
        {/* Branding Section */}
        <section className="max-w-xl text-center lg:text-left">
          <p className="font-serif text-xl md:text-2xl font-light tracking-widest uppercase transition-colors">
            The Revamp <span className="text-gold ml-1">UG</span>
          </p>
          <h1 className="mt-5 font-serif text-5xl leading-[0.95] text-foreground sm:text-6xl">
            Welcome back to your world of considered living.
          </h1>
          <p className="mt-6 max-w-md font-sans text-base leading-7 text-muted-foreground">
            Sign in to manage your saved pieces, orders, consultations, membership, and design journey.
          </p>
        </section>

        {/* Form Box */}
        <div className="w-full max-w-md rounded-sm border border-border bg-card p-6 shadow-sm sm:p-8">
          
          {/* TABLET DIAGNOSTIC PANEL */}
<div className="mb-4 rounded bg-muted/40 p-3 text-xs font-mono text-muted-foreground border border-border flex flex-col gap-1">
  <div>
    SDK Ready: <strong className={isLoaded ? 'text-green-500' : 'text-red-500'}>{isLoaded ? 'YES' : 'NO'}</strong>
  </div>
  <div>
    Publishable Key Status: {' '}
    <strong className={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'text-green-500' : 'text-red-500'}>
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY 
        ? `FOUND (${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 8)}...)` 
        : 'MISSING / UNDEFINED'}
    </strong>
  </div>
</div>


          {/* ACTIVE ERROR DISPLAY */}
          {activeError && (
            <div role="alert" className="mb-6 rounded-sm bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 font-mono text-xs break-words">
              <strong>Error:</strong> {activeError}
            </div>
          )}

          {!verifyingFactor ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {/* ENABLED BUTTON: Forces click to surface hidden errors */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-sm bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  Two-Factor Authentication Code
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter verification code"
                  className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-sm bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a href="/sign-up" className="underline underline-offset-4 hover:text-foreground">
              Sign up
            </a>
          </div>
        </div>

      </div>
    </main>
  )
}




{/*'use client'

import { useMemo } from 'react'
import { SignIn } from '@clerk/nextjs'

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

export default function SignInPage() {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const redirectUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/account'
    return getSafeRedirectUrl(new URLSearchParams(window.location.search).get('redirect_url'))
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-20">
        <section className="max-w-xl text-center lg:text-left">
          <p className="font-serif text-xl md:text-2xl font-light tracking-widest uppercase transition-colors">The Revamp 
            <span className="text-gold ml-1">UG</span></p>
          <h1 className="mt-5 font-serif text-5xl leading-[0.95] text-foreground sm:text-6xl">Welcome back to your world of considered living.</h1>
          <p className="mt-6 max-w-md font-sans text-base leading-7 text-muted-foreground">Sign in to manage your saved pieces, orders, consultations, membership, and design journey.</p>
        </section>
        <div className="w-full max-w-md rounded-sm border border-border bg-card p-2 shadow-sm sm:p-4">
          {!clerkPublishableKey ? (
            <div role="alert" className="p-8 text-center font-sans text-sm leading-6 text-muted-foreground">
              Authentication is temporarily unavailable. Please configure the Clerk publishable key for this deployment.
            </div>
          ) : <SignIn
            routing="path"
            path="/sign-in"
            fallbackRedirectUrl={redirectUrl}
            signUpUrl="/sign-up"
            appearance={{ elements: { rootBox: 'w-full', card: 'w-full border-0 bg-transparent shadow-none' } }}
          />}
        </div>
      </div>
    </main>
  )
}*/}

