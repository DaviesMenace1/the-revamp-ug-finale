import { requirePortalUser } from '@/lib/auth/portal-auth'
import { AccountNavigation } from '@/components/account/account-navigation'
import { AccountOverview } from '@/components/account/account-overview'
import { getAccountOverview } from '@/lib/account/queries'
import { safeQuery } from '@/lib/server/safe-query'
import PageLoadError from '@/components/system/page-load-error'
import { SiteHeader } from '@/components/site-header'

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
        <SiteHeader />
        <main className="min-h-screen bg-background">
        <div className="mx-auto flex w-full max-w-7xl gap-12 px-6 py-10 md:px-10 md:py-16 lg:px-12">
          <AccountNavigation />
          <section className="min-w-0 flex-1 items-start">
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
      <SiteHeader />
      <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl gap-12 px-6 py-10 md:px-10 md:py-16 lg:px-12">
        <AccountNavigation />
        <div className="min-w-0 flex-1">
          <AccountOverview data={data} />
        </div>
      </div>
      </main>
    </>
  )
}
