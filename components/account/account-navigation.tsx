'use client'

import Link from 'next/link'
import { useClerk } from '@clerk/nextjs'
import { LuxuryLogOut } from '@/components/icons/luxury-icons'

const groups = [
  { label: 'My account', links: [['Overview', '/account'], ['Orders', '/orders'], ['Wishlist', '/wishlist'], ['Cart', '/cart']] },
  { label: 'Design', links: [['Client Portal', '/client'], ['Projects', '/client/projects'], ['Consultations', '/client/consultations'], ['Messages', '/client/messages'], ['Documents', '/client/documents']] },
  { label: 'Membership', links: [['Membership', '/membership'], ['Benefits', '/membership/benefits']] },
  { label: 'Account', links: [['Profile', '/user-profile'], ['Security', '/user-profile']] },
]

export function AccountNavigation() {
  const { signOut } = useClerk()

  const linkGroups = (mobile = false) => groups.map((group) => (
    <div key={group.label} className="flex min-w-0 flex-col gap-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p>
      <div className="flex min-w-0 flex-col gap-1">
        {group.links.map(([label, href]) => (
          <Link prefetch={false} key={href + label} href={href} className={`flex min-h-10 min-w-0 items-center rounded-md py-2 text-sm text-foreground/75 transition-colors hover:bg-muted/60 hover:text-primary ${mobile ? 'px-3' : ''}`}>
            <span className="break-words">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  ))

  const signOutButton = <button type="button" onClick={() => signOut({ redirectUrl: '/' })} className="flex min-h-10 items-center gap-2 rounded-md py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-primary">
    <LuxuryLogOut className="size-4 shrink-0" aria-hidden="true" />
    Sign out
  </button>

  return (
    <>
      <aside className="hidden w-56 shrink-0 lg:block">
        <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Account</p>
        <nav aria-label="Account navigation" className="flex flex-col gap-7">
          {linkGroups()}
          {signOutButton}
        </nav>
      </aside>
      <details className="mb-6 min-w-0 lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
          <span>Account menu</span>
          <span aria-hidden="true" className="text-primary">Open</span>
        </summary>
        <nav aria-label="Mobile account navigation" className="mt-2 grid min-w-0 gap-5 rounded-lg border border-border/70 bg-card p-3">
          {linkGroups(true)}
          {signOutButton}
        </nav>
      </details>
    </>
  )
}
