'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { BookOpen, BriefcaseBusiness, Home, ShoppingBag, ShoppingCart, UserRound, LogOut, X } from '@/components/ui/luxury-icons'
import { LuxuryAccountIcon, LuxuryMenuIcon } from '@/components/ui/luxury-nav-icons'

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Shop', href: '/collections', icon: ShoppingBag },
  { label: 'Projects', href: '/client/projects', icon: BriefcaseBusiness },
  { label: 'Journal', href: '/journal', icon: BookOpen },
  { label: 'Account', href: '/account', icon: UserRound },
]

export function AccountShell({ children, cartCount = 0 }: { children: React.ReactNode; cartCount?: number }) {
  const { signOut } = useClerk()
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="min-h-screen bg-background text-foreground pb-20 lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 text-foreground shadow-[0_8px_30px_rgba(13,13,13,0.06)] backdrop-blur">
        <div className="mx-auto flex h-[4.75rem] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:h-20 lg:px-12">
          <Link href="/account" className="flex items-center gap-3" aria-label="The Revamp UG account home">
            <span className="font-serif text-lg tracking-[0.22em] sm:text-xl">THE REVAMP UG</span>
          </Link>
          <p className="hidden font-serif text-sm text-muted-foreground lg:block">The architecture of refined living</p>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/cart" className="relative rounded-full p-2 text-foreground/70 transition hover:text-primary" aria-label="Open cart">
              <ShoppingCart className="size-5" />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">{cartCount}</span>}
            </Link>
            <Link href="/user-profile" className="hidden rounded-full p-2 text-foreground/70 transition hover:text-primary sm:block" aria-label="Open profile"><LuxuryAccountIcon size={20} /></Link>
            <button type="button" onClick={() => setMenuOpen((open) => !open)} className="rounded-full p-2 text-foreground/70 transition hover:text-primary" aria-label={menuOpen ? 'Close account menu' : 'Open account menu'} aria-expanded={menuOpen}><LuxuryMenuIcon size={20} /></button>
          </div>
        </div>
      </header>
      {menuOpen && <div className="fixed inset-0 z-50 bg-obsidian/45" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenuOpen(false) }}>
        <aside className="absolute right-0 top-0 flex h-full w-[min(88vw,23rem)] max-w-full flex-col overflow-y-auto bg-background p-6 text-foreground shadow-2xl" role="dialog" aria-modal="true" aria-label="Account menu">
          <div className="flex items-center justify-between border-b border-border pb-5"><div><p className="font-serif text-lg tracking-[0.18em]">THE REVAMP UG</p><p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Member navigation</p></div><button type="button" onClick={() => setMenuOpen(false)} className="flex size-11 items-center justify-center rounded-full border border-border text-foreground/70 transition hover:border-primary hover:text-primary" aria-label="Close account menu"><X className="size-5" /></button></div>
          <nav className="flex flex-1 flex-col py-5" aria-label="Mobile account navigation">{navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 border-b border-border py-3 text-sm uppercase tracking-[0.12em] text-foreground/75 transition hover:text-primary"><Icon className="size-4" aria-hidden="true" />{label}</Link>)}<Link href="/trade-program" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 border-b border-border py-3 text-sm uppercase tracking-[0.12em] text-foreground/75 transition hover:text-primary"><BriefcaseBusiness className="size-4" aria-hidden="true" />Trade Program</Link><Link href="/user-profile" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 border-b border-border py-3 text-sm uppercase tracking-[0.12em] text-foreground/75 transition hover:text-primary"><UserRound className="size-4" aria-hidden="true" />Profile</Link><button type="button" onClick={() => signOut({ redirectUrl: '/' })} className="mt-auto flex min-h-12 items-center gap-3 py-3 text-left text-sm uppercase tracking-[0.12em] text-muted-foreground transition hover:text-primary"><LogOut className="size-4" aria-hidden="true" />Sign out</button></nav>
        </aside>
      </div>}
      <main>{children}</main>
      <nav aria-label="Account navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 text-foreground shadow-[0_-10px_35px_rgba(13,13,13,0.08)] backdrop-blur lg:static lg:border-t-0 lg:border-b lg:bg-background lg:shadow-none">
        <div className="mx-auto grid max-w-[1440px] grid-cols-5 gap-0 lg:flex lg:items-center lg:justify-center lg:gap-10 lg:px-12">
          {navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className="flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-[10px] uppercase tracking-[0.12em] text-foreground/60 transition hover:text-primary lg:min-h-12 lg:flex-row lg:gap-2 lg:text-foreground/65"><Icon className="size-5 lg:size-4" aria-hidden="true" /><span>{label}</span></Link>)}
        </div>
      </nav>
    </div>
  )
}
