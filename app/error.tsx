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
      <div role="alert" className="w-full max-w-xl rounded border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em]">The Revamp UG</p>
        <h1 className="mt-3 font-serif text-3xl">This page could not load.</h1>
        <p className="mt-3 text-sm leading-6">The problem has been recorded. Please retry the page; your saved information was not changed.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => reset()} className="min-h-11 rounded bg-amber-950 px-4 text-sm font-medium text-white hover:bg-amber-900">
            Try again
          </button>
          <Link href="/" className="inline-flex min-h-11 items-center rounded border border-amber-950 px-4 text-sm font-medium hover:bg-amber-100">
            Return home
          </Link>
        </div>
      </div>
    </main>
  )
}
