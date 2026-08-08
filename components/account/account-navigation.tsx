'use client'

import Link from 'next/link'
import { useClerk } from '@clerk/nextjs'
import { LogOut } from 'lucide-react'

const groups = [
  { label: 'My account', links: [['Overview', '/account'], ['Orders', '/orders'], ['Wishlist', '/wishlist'], ['Cart', '/cart']] },
  { label: 'Design', links: [['Client Portal', '/client'], ['Projects', '/client/projects'], ['Consultations', '/client/consultations'], ['Messages', '/client/messages'], ['Documents', '/client/documents']] },
  { label: 'Membership', links: [['Membership', '/membership'], ['Benefits', '/membership/benefits']] },
  { label: 'Account', links: [['Profile', '/user-profile'], ['Security', '/user-profile']] },
]

export function AccountNavigation() {
  const { signOut } = useClerk()

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Account</p>
      <nav aria-label="Account navigation" className="flex flex-col gap-7">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p>
            <div className="flex flex-col gap-1">
              {group.links.map(([label, href]) => (
                <Link key={href + label} href={href} className="py-1 text-sm text-foreground/75 transition-colors hover:text-primary">
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
  )
}
