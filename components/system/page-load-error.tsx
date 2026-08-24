'use client'

export default function PageLoadError({
  title = 'This page is taking longer than expected.',
  message = 'We could not load this data right now. Nothing has been changed.',
}: {
  title?: string
  message?: string
}) {
  return (
    <div role="alert" className="w-full max-w-xl rounded border border-amber-200 bg-amber-50 p-6 text-amber-950">
      <h1 className="font-serif text-3xl">{title}</h1>
      <p className="mt-3 text-sm leading-6">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-5 min-h-11 rounded bg-amber-950 px-4 text-sm font-medium text-white hover:bg-amber-900"
      >
        Retry
      </button>
    </div>
  )
}
