import { SiteHeader } from '@/components/site-header'

export default function AccountLoading() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background" aria-busy="true" aria-label="Loading your account">
        <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 md:gap-12 md:px-10 md:py-16 lg:px-12">
          <aside className="hidden w-52 shrink-0 space-y-3 lg:block">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
          </aside>
          <section className="min-w-0 flex-1 space-y-6">
            <div className="space-y-3 border-b border-border/70 pb-6">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-10 w-64 max-w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-40 animate-pulse rounded-xl bg-muted" />
              <div className="h-40 animate-pulse rounded-xl bg-muted" />
            </div>
            <div className="h-56 animate-pulse rounded-xl bg-muted" />
          </section>
        </div>
      </main>
    </>
  )
}
