import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { AccountNavigation } from '@/components/account/account-navigation'
import { AccountOverview } from '@/components/account/account-overview'
import { getAccountOverview } from '@/lib/account/queries'

export const metadata = {
  title: 'My Account | The Revamp UG',
  description: 'Your personal account hub for The Revamp UG.',
}

export default async function AccountPage() {
  const clerkUser = await currentUser()
  if (!clerkUser) redirect('/sign-in?redirect_url=/account')

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
