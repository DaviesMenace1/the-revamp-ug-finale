export default function AdminLoading() {
  return (
    <div className="flex min-h-dvh min-w-0 bg-background" aria-busy="true" aria-label="Loading the admin portal">
      <aside className="hidden w-16 shrink-0 border-r border-border/70 bg-card p-2 md:block">
        <div className="mx-auto size-10 animate-pulse rounded-xl bg-muted" />
        <div className="mt-8 space-y-2">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="mx-auto size-11 animate-pulse rounded-lg bg-muted" />)}
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="flex min-h-16 items-center justify-between border-b border-border/70 px-4 pl-16 sm:px-6 sm:pl-16 md:pl-6">
          <div className="space-y-2"><div className="h-3 w-24 animate-pulse rounded bg-muted" /><div className="h-4 w-44 animate-pulse rounded bg-muted" /></div>
          <div className="h-10 w-24 animate-pulse rounded bg-muted" />
        </header>
        <section className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="space-y-3"><div className="h-3 w-24 animate-pulse rounded bg-muted" /><div className="h-10 w-72 max-w-full animate-pulse rounded bg-muted" /></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>
          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]"><div className="h-80 animate-pulse rounded-xl bg-muted" /><div className="h-80 animate-pulse rounded-xl bg-muted" /></div>
        </section>
      </main>
    </div>
  )
}
