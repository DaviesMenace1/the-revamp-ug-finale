'use client'

import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const AUTH_LOAD_TIMEOUT_MS = 12_000

function isAuthRoute(pathname: string | null) {
  if (!pathname) return false
  return pathname === '/sign-in' || pathname.startsWith('/sign-in/') || pathname === '/sign-up' || pathname.startsWith('/sign-up/') || pathname === '/reset-password'
}

export default function ClerkRuntimeGuard({ children, configured }: { children: React.ReactNode; configured: boolean }) {
  const pathname = usePathname()
  const { isLoaded } = useAuth()
  const authRoute = isAuthRoute(pathname)
  const [timedOutPath, setTimedOutPath] = useState<string | null>(null)

  useEffect(() => {
    if (!authRoute || !configured || isLoaded || timedOutPath === pathname) return

    const timeout = window.setTimeout(() => setTimedOutPath(pathname), AUTH_LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(timeout)
  }, [authRoute, configured, isLoaded, pathname, timedOutPath])

  if (authRoute && !configured) {
    return <AuthRuntimeMessage title="Authentication is not configured yet." message="The secure account service needs a valid Clerk publishable key before sign-in and sign-up can start. Please contact the studio administrator." />
  }

  if (authRoute && timedOutPath === pathname && !isLoaded) {
    return <AuthRuntimeMessage title="Authentication is taking longer than expected." message="The account service did not respond. Check your connection, then retry this page. If the problem continues, the site administrator should verify the Clerk production domain and publishable key." retry />
  }

  return children
}

function AuthRuntimeMessage({ title, message, retry = false }: { title: string; message: string; retry?: boolean }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-16 text-foreground sm:px-6">
      <section className="w-full max-w-md border border-border bg-card p-6 shadow-sm sm:p-8" role="status" aria-live="polite">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Secure account access</p>
        <h1 className="mt-3 font-serif text-3xl leading-tight">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{message}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          {retry && <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center justify-center bg-primary px-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground">Retry</button>}
          <Link href="/" className="inline-flex min-h-11 items-center justify-center border border-border px-5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">Return home</Link>
        </div>
      </section>
    </main>
  )
}
