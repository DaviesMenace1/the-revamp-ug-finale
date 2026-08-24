import Link from 'next/link'
import PageLoadError from '@/components/system/page-load-error'

export const metadata = {
  title: 'Account temporarily unavailable | The Revamp UG',
  description: 'Retry the account connection for The Revamp UG.',
}

function safeReturnTo(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value
  if (candidate?.startsWith('/') && !candidate.startsWith('//')) return candidate
  return '/client'
}

export default async function AccountUnavailablePage({
  searchParams,
}: {
  searchParams?: Promise<{ returnTo?: string | string[] }>
}) {
  const params = searchParams ? await searchParams : undefined
  const returnTo = safeReturnTo(params?.returnTo)

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="flex w-full max-w-xl flex-col items-start gap-5">
        <PageLoadError
          title="Your account is taking longer than expected."
          message="We could not confirm your account connection right now. Nothing was changed. Please retry, or return to the page you were visiting."
        />
        <Link
          href={returnTo}
          className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Return to the page
        </Link>
      </div>
    </main>
  )
}
