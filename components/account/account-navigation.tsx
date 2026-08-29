'use client'

import Link from 'next/link'
import { useClerk } from '@clerk/nextjs'
import { ChevronDown, LogOut } from 'lucide-react'

const groups = [
  { label: 'My account', links: [['Overview', '/account'], ['Orders', '/orders'], ['Wishlist', '/wishlist'], ['Cart', '/cart']] },
  { label: 'Design', links: [['Client Portal', '/client'], ['Projects', '/client/projects'], ['Consultations', '/client/consultations'], ['Messages', '/client/messages'], ['Documents', '/client/documents']] },
  { label: 'Membership', links: [['Membership', '/membership'], ['Benefits', '/membership/benefits']] },
  { label: 'Account', links: [['Profile', '/user-profile'], ['Security', '/user-profile']] },
]

export function AccountNavigation() {
  const { signOut } = useClerk()

  return (
    <>
      <aside className="hidden w-56 shrink-0 lg:block">
        <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Account</p>
        <nav aria-label="Account navigation" className="flex flex-col gap-7">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p>
              <div className="flex flex-col gap-1">
                {group.links.map(([label, href]) => (
                  <Link prefetch={false} key={href + label} href={href} className="py-1 text-sm text-foreground/75 transition-colors hover:text-primary">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => signOut({ redirectUrl: '/' })} className="flex items-center gap-2 py-1 text-left text-sm text-muted-foreground transition-colors hover:text-primary">
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </nav>
      </aside>

      <div className="mb-8 lg:hidden">
        <details className="group border border-border/70 bg-background">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <span className="flex flex-col gap-1"><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Account menu</span><span>Jump to a section</span></span>
            <ChevronDown className="size-4 text-primary transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <nav aria-label="Mobile account navigation" className="border-t border-border/70 px-4 pb-4">
            {groups.map((group) => (
              <div key={group.label} className="border-b border-border/50 py-4 last:border-0">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {group.links.map(([label, href]) => <Link prefetch={false} key={href + label} href={href} className="min-h-11 py-3 text-sm text-foreground/80 transition-colors hover:text-primary">{label}</Link>)}
                </div>
              </div>
            ))}
            <button type="button" onClick={() => signOut({ redirectUrl: '/' })} className="flex min-h-11 items-center gap-2 py-3 text-left text-sm text-muted-foreground transition-colors hover:text-primary">
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          </nav>
        </details>
      </div>
    </>
  )
}
