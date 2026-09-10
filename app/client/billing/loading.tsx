export default function ClientBillingLoading() {
  return <div className="space-y-6 py-8" aria-busy="true" aria-label="Loading billing"><div className="h-10 w-48 animate-pulse rounded bg-muted" /><div className="h-5 w-72 animate-pulse rounded bg-muted" /><div className="grid gap-3"><div className="h-28 animate-pulse rounded bg-muted" /><div className="h-28 animate-pulse rounded bg-muted" /></div></div>
}
