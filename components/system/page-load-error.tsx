'use client'

export default function PageLoadError({
  title = 'This page is taking longer than expected.',
  message = 'We could not load this data right now. Nothing has been changed.',
}: {
  title?: string
  message?: string
}) {
  return (
    <div role="alert" className="w-full max-w-xl rounded border border-amber-300/70 bg-amber-50 p-4 text-amber-950 shadow-sm dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-50 sm:p-6">
      <h1 className="font-serif text-3xl">{title}</h1>
      <p className="mt-3 text-sm leading-6">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-5 min-h-11 rounded bg-amber-950 px-4 text-sm font-medium text-white transition-colors hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100 dark:focus-visible:ring-offset-amber-950"
      >
        Retry
      </button>
    </div>
  )
}
