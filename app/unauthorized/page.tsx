import Link from 'next/link'
export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-20">
      <section className="max-w-xl text-center">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-muted-foreground">The Revamp UG</p>
        <h1 className="mt-6 font-serif text-5xl text-foreground">Access reserved.</h1>
        <p className="mt-5 font-sans leading-7 text-muted-foreground">
          Your account is signed in, but it does not have permission to view this area.
        </p>
        <a href="/account" className="mt-8 inline-flex items-center justify-center rounded-sm bg-primary px-5 py-3 font-sans text-sm text-primary-foreground transition-opacity hover:opacity-90">
          Return to account
        </a>
      </section>
    </main>
  )
}
