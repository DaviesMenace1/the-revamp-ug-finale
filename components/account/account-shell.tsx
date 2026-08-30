'use client'

import Link from 'next/link'
import { useClerk } from '@clerk/nextjs'
import { ArrowLeft, BookOpen, BriefcaseBusiness, Home, Menu, ShoppingBag, UserRound } from 'lucide-react'

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Shop', href: '/collections', icon: ShoppingBag },
  { label: 'Projects', href: '/client/projects', icon: BriefcaseBusiness },
  { label: 'Journal', href: '/journal', icon: BookOpen },
  { label: 'Account', href: '/account', icon: UserRound },
]

export function AccountShell({ children, cartCount = 0 }: { children: React.ReactNode; cartCount?: number }) {
  const { signOut } = useClerk()
  return (
    <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-obsidian text-ivory shadow-[0_8px_30px_rgba(0,0,0,0.16)]">
        <div className="mx-auto flex h-[4.75rem] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:h-20 lg:px-12">
          <Link href="/account" className="flex items-center gap-3" aria-label="The Revamp UG account home">
            <ArrowLeft className="size-4 text-gold-light lg:hidden" aria-hidden="true" />
            <span className="font-serif text-lg tracking-[0.28em] sm:text-xl">THE REVAMP UG</span>
          </Link>
          <p className="hidden font-serif text-sm italic text-ivory/70 sm:block">The architecture of refined living</p>
          <div className="flex items-center gap-3">
            <Link href="/cart" className="relative rounded-full p-2 text-ivory/80 transition hover:text-gold-light" aria-label="Open cart">
              <ShoppingBag className="size-5" aria-hidden="true" />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-gold text-[9px] text-obsidian">{cartCount}</span>}
            </Link>
            <Link href="/user-profile" className="hidden rounded-full p-2 text-ivory/80 transition hover:text-gold-light sm:block" aria-label="Open profile"><UserRound className="size-5" aria-hidden="true" /></Link>
            <button type="button" onClick={() => signOut({ redirectUrl: '/' })} className="rounded-full p-2 text-ivory/80 transition hover:text-gold-light" aria-label="Sign out"><Menu className="size-5" aria-hidden="true" /></button>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <nav aria-label="Account navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-obsidian text-ivory shadow-[0_-10px_35px_rgba(0,0,0,0.18)] lg:static lg:border-t-0 lg:border-b lg:bg-background lg:text-foreground lg:shadow-none">
        <div className="mx-auto grid max-w-[1440px] grid-cols-5 lg:flex lg:items-center lg:justify-center lg:gap-10 lg:px-12">
          {navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={`flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-[10px] uppercase tracking-[0.12em] text-ivory/65 transition hover:text-gold-light lg:min-h-12 lg:flex-row lg:gap-2 lg:text-foreground/65 lg:hover:text-gold`}><Icon className="size-5 lg:size-4" aria-hidden="true" /><span>{label}</span></Link>)}
        </div>
      </nav>
    </div>
  )
}
