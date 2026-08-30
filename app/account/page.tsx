import { requirePortalUser } from '@/lib/auth/portal-auth'
import { AccountOverview } from '@/components/account/account-overview'
import { getAccountOverview } from '@/lib/account/queries'
import { safeQuery } from '@/lib/server/safe-query'
import PageLoadError from '@/components/system/page-load-error'
import { AccountShell } from '@/components/account/account-shell'

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
        <AccountShell>
          <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12"><PageLoadError title="Your account is taking longer than expected." message="We could not load the account overview right now. Your account has not been changed." /></div>
        </AccountShell>
      </>
    )
  }

  const data = result.data

  return (
    <>
      <AccountShell cartCount={data.cartCount}>
        <AccountOverview data={data} />
      </AccountShell>
    </>
  )
}
