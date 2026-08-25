'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const pathname = usePathname()
  const isAuthRoute = pathname === '/sign-in' || pathname?.startsWith('/sign-in/') || pathname === '/sign-up' || pathname?.startsWith('/sign-up/') || pathname === '/reset-password'
  const authPath = pathname?.startsWith('/sign-up') ? '/sign-up' : '/sign-in'

  useEffect(() => {
    void fetch('/api/observability/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        name: error.name,
        stack: error.stack,
        digest: error.digest,
        path: pathname,
      }),
      keepalive: true,
    }).catch(() => undefined)
  }, [error, pathname])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <div role="alert" className="w-full max-w-xl rounded border border-amber-300/70 bg-amber-50 p-4 text-amber-950 shadow-sm dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-50 sm:p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em]">The Revamp UG</p>
        <h1 className="mt-3 font-serif text-3xl">{isAuthRoute ? 'Secure account access needs another try.' : 'This area needs another try.'}</h1>
        <p className="mt-3 text-sm leading-6">{isAuthRoute ? 'The authentication service did not finish starting. Your account was not changed; retry the sign-in route or open the original form again.' : 'A temporary rendering issue interrupted this view. Your saved information was not changed; retry the current route or return to a safe page.'}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => reset()} className="min-h-11 rounded bg-amber-950 px-4 text-sm font-medium text-white transition-colors hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100 dark:focus-visible:ring-offset-amber-950">
            {isAuthRoute ? 'Retry authentication' : 'Retry this view'}
          </button>
          <Link href={isAuthRoute ? authPath : '/'} className="inline-flex min-h-11 items-center rounded border border-amber-950 px-4 text-sm font-medium transition-colors hover:bg-amber-100 dark:border-amber-200 dark:hover:bg-amber-900/50">
            {isAuthRoute ? authPath === '/sign-up' ? 'Open sign-up' : 'Open sign-in' : 'Return home'}
          </Link>
        </div>
      </div>
    </main>
  )
}
