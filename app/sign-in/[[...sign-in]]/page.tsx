'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function CustomSignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const router = useRouter()

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  
  // UI State
  const [verifyingFactor, setVerifyingFactor] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [redirectPath, setRedirectPath] = useState('/account')

  // Safely extract and validate redirect URL on mount
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

  // Handle standard Email + Password submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setLoading(true)
    setError(null)

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push(redirectPath)
      } else if (result.status === 'needs_second_factor') {
        // Handle 2FA / OTP if configured on your Clerk dashboard
        setVerifyingFactor(true)
      } else {
        console.log('Additional sign-in steps required:', result)
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'An error occurred during sign in.')
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP verification (2FA) if triggered
  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setLoading(true)
    setError(null)

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'totp',
        code,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push(redirectPath)
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Invalid verification code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
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
          {error && (
            <div role="alert" className="mb-6 rounded-sm bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          {!verifyingFactor ? (
            /* Standard Sign-In Form */
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

              <button
                type="submit"
                disabled={loading || !isLoaded}
                className="mt-2 w-full rounded-sm bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            /* Second Factor / OTP Verification Form */
            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
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
                disabled={loading || !isLoaded}
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

