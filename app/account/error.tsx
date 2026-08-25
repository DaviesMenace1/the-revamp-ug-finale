'use client'

import Link from 'next/link'

export default function AccountError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-16 text-foreground sm:px-6">
      <section className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8" role="alert">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">The Revamp UG · Account</p>
        <h1 className="mt-3 font-serif text-3xl leading-tight">Your account needs another try.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">We could not complete the account view. Your saved pieces, orders, and profile were not changed.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={() => reset()} className="inline-flex min-h-11 items-center justify-center rounded bg-primary px-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground">Retry account</button>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded border border-border px-5 text-xs font-semibold uppercase tracking-[0.14em]">Return home</Link>
        </div>
      </section>
    </main>
  )
}
