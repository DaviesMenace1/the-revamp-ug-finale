import { requirePortalUser } from '@/lib/auth/portal-auth'
import { AccountNavigation } from '@/components/account/account-navigation'
import { AccountOverview } from '@/components/account/account-overview'
import { getAccountOverview } from '@/lib/account/queries'
import { safeQuery } from '@/lib/server/safe-query'
import PageLoadError from '@/components/system/page-load-error'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Account | The Revamp UG',
  description: 'Your personal account hub for The Revamp UG.',
}

export default async function AccountPage() {
  const user = await requirePortalUser([], '/account')
  const result = await safeQuery(getAccountOverview(user), 'account overview', null)
  if (!result.data) {
    if (!result.error) return null

    return (
      <>
        <main className="min-h-screen bg-background">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-0 px-4 py-5 sm:px-6 sm:py-8 md:px-10 md:py-12 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-12">
          <AccountNavigation />
          <section className="flex min-w-0 flex-1 items-start">
            <PageLoadError
              title="Your account is taking longer than expected."
              message="We could not load the account overview right now. Your account has not been changed."
            />
          </section>
        </div>
        </main>
      </>
    )
  }

  const data = result.data

  return (
    <>
      <main className="min-h-screen bg-background">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-0 px-4 py-5 sm:px-6 sm:py-8 md:px-10 md:py-12 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-12">
        <AccountNavigation />
        <div className="min-w-0 flex-1">
          <AccountOverview data={data} />
        </div>
      </div>
      </main>
    </>
  )
}
