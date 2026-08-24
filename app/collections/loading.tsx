export default function CollectionsLoading() {
  return (
    <main className="min-h-screen bg-background pb-24 pt-28 md:pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="animate-pulse border-b border-border/70 pb-8">
          <div className="h-3 w-40 rounded bg-muted" />
          <div className="mt-5 h-14 max-w-xl rounded bg-muted" />
          <div className="mt-4 h-4 max-w-lg rounded bg-muted" />
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-16">
          {Array.from({ length: 8 }).map((_, index) => <div key={index} className="animate-pulse"><div className="aspect-[3/4] rounded-lg bg-muted" /><div className="mt-4 h-3 w-1/3 rounded bg-muted" /><div className="mt-3 h-6 w-4/5 rounded bg-muted" /><div className="mt-3 h-4 w-1/2 rounded bg-muted" /></div>)}
        </div>
      </div>
    </main>
  )
}
