export default function AccountLoading() {
  return (
    <main className="min-h-screen bg-background" aria-busy="true" aria-label="Loading your account">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-0 px-4 py-5 sm:px-6 sm:py-8 md:px-10 md:py-12 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-12">
        <header className="col-span-1 flex min-h-20 items-center justify-between border-b border-border/70 py-4 lg:col-span-2 lg:min-h-24"><div className="flex items-center gap-3"><div className="size-10 animate-pulse bg-muted" /><div><div className="h-4 w-32 animate-pulse bg-muted" /><div className="mt-2 h-2 w-24 animate-pulse bg-muted" /></div></div><div className="h-10 w-24 animate-pulse rounded-full bg-muted" /></header>
        <aside className="hidden space-y-6 py-8 lg:block"><div className="h-3 w-20 animate-pulse bg-muted" />{[1, 2, 3, 4].map((group) => <div key={group} className="space-y-3"><div className="h-2 w-16 animate-pulse bg-muted" /><div className="h-3 w-28 animate-pulse bg-muted" /><div className="h-3 w-24 animate-pulse bg-muted" /></div>)}</aside>
        <section className="min-w-0 space-y-8 py-8 lg:pl-12"><div className="h-72 animate-pulse rounded-[2rem] bg-muted" /><div className="grid gap-3 sm:grid-cols-3"><div className="h-32 animate-pulse rounded-2xl bg-muted" /><div className="h-32 animate-pulse rounded-2xl bg-muted" /><div className="h-32 animate-pulse rounded-2xl bg-muted" /></div><div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]"><div className="h-64 animate-pulse rounded-2xl bg-muted" /><div className="h-64 animate-pulse rounded-2xl bg-muted" /></div></section>
      </div>
    </main>
  )
}
