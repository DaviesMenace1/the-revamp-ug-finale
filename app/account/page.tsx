import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { AccountNavigation } from '@/components/account/account-navigation'
import { AccountOverview } from '@/components/account/account-overview'
import { getAccountOverview } from '@/lib/account/queries'

export const metadata = {
  title: 'My Account | The Revamp UG',
  description: 'Your personal account hub for The Revamp UG.',
}

export default async function AccountPage() {
  // Redirect to sign-in ONLY when genuinely unauthenticated.
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=/account')

  // The overview provisions the local profile on demand; if it still returns
  // null the session was revoked mid-request. Database errors throw to the
  // error boundary instead of masquerading as "not authenticated" (this was
  // the cause of the sign-in <-> account redirect loop).
  const data = await getAccountOverview()
  if (!data) redirect('/sign-in?redirect_url=/account')

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl gap-12 px-6 py-10 md:px-10 md:py-16 lg:px-12">
        <AccountNavigation />
        <div className="min-w-0 flex-1">
          <div className="mb-8 flex items-center justify-between border-b border-border/70 pb-5 lg:hidden">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">My account</span>
            <a href="/client" className="text-sm text-primary">Client Portal</a>
          </div>
          <AccountOverview data={data} />
        </div>
      </div>
    </main>
  )
}
