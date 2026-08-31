'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { ArrowLeft, BookOpen, BriefcaseBusiness, Home, Menu, ShoppingBag, UserRound, X, LogOut } from 'lucide-react'
import { LuxuryAccountIcon, LuxuryBagIcon, LuxuryCloseIcon, LuxuryHomeIcon, LuxuryMenuIcon } from '@/components/ui/luxury-nav-icons'
import { ThemeSwitcher } from '@/components/theme-switcher'

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
    <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-obsidian text-ivory shadow-[0_8px_30px_rgba(0,0,0,0.16)]">
        <div className="mx-auto flex h-[4.75rem] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:h-20 lg:px-12">
          <Link href="/account" className="flex items-center gap-3" aria-label="The Revamp UG account home">
            <LuxuryHomeIcon size={16} className="text-gold-light lg:hidden" />
            <span className="font-serif text-lg tracking-[0.28em] sm:text-xl">THE REVAMP UG</span>
          </Link>
          <p className="hidden font-serif text-sm italic text-ivory/70 sm:block">The architecture of refined living</p>
          <div className="flex items-center gap-3">
            <Link href="/cart" className="relative rounded-full p-2 text-ivory/80 transition hover:text-gold-light" aria-label="Open cart">
              <LuxuryBagIcon size={20} />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-gold text-[9px] text-obsidian">{cartCount}</span>}
            </Link>
            <Link href="/user-profile" className="hidden rounded-full p-2 text-ivory/80 transition hover:text-gold-light sm:block" aria-label="Open profile"><LuxuryAccountIcon size={20} /></Link>
            <div className="relative">
              <button type="button" onClick={() => setMenuOpen((open) => !open)} className="rounded-full p-2 text-ivory/80 transition hover:text-gold-light" aria-label={menuOpen ? 'Close account menu' : 'Open account menu'} aria-expanded={menuOpen}><LuxuryMenuIcon size={20} /></button>
              <div className="absolute right-0 top-full z-50 flex size-11 translate-y-[-1px] items-center justify-center rounded-b-[1.35rem] border border-t-0 border-ivory/25 bg-obsidian p-0.5 text-ivory shadow-lg [&_button]:size-10 [&_button]:text-current [&_button:hover]:bg-ivory/10">
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </div>
      </header>
      {menuOpen && <div className="fixed inset-0 z-50 bg-black/55 lg:hidden" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenuOpen(false) }}>
        <aside className="absolute right-0 top-0 flex h-full w-[min(88vw,22rem)] max-w-full flex-col overflow-y-auto bg-obsidian p-5 text-ivory shadow-2xl" role="dialog" aria-modal="true" aria-label="Account menu">
          <div className="flex items-center justify-between border-b border-ivory/15 pb-5"><div><p className="font-serif text-lg tracking-[0.18em]">THE REVAMP UG</p><p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ivory/55">Member navigation</p></div><button type="button" onClick={() => setMenuOpen(false)} className="flex size-11 items-center justify-center rounded-full border border-ivory/20 text-ivory/80 transition hover:border-gold-light hover:text-gold-light" aria-label="Close account menu"><LuxuryCloseIcon size={20} /></button></div>
          <nav className="flex flex-1 flex-col py-5" aria-label="Mobile account navigation">{navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 border-b border-ivory/10 py-3 text-sm uppercase tracking-[0.12em] text-ivory/80 transition hover:text-gold-light"><Icon className="size-4" aria-hidden="true" />{label}</Link>)}<Link href="/user-profile" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center gap-3 border-b border-ivory/10 py-3 text-sm uppercase tracking-[0.12em] text-ivory/80 transition hover:text-gold-light"><UserRound className="size-4" aria-hidden="true" />Profile</Link><button type="button" onClick={() => signOut({ redirectUrl: '/' })} className="mt-auto flex min-h-12 items-center gap-3 py-3 text-left text-sm uppercase tracking-[0.12em] text-ivory/55 transition hover:text-gold-light"><LogOut className="size-4" aria-hidden="true" />Sign out</button></nav>
        </aside>
      </div>}
      <main>{children}</main>
      <nav aria-label="Account navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-obsidian text-ivory shadow-[0_-10px_35px_rgba(0,0,0,0.18)] lg:static lg:border-t-0 lg:border-b lg:bg-background lg:text-foreground lg:shadow-none">
        <div className="mx-auto grid max-w-[1440px] grid-cols-5 gap-0 lg:flex lg:items-center lg:justify-center lg:gap-10 lg:px-12">
          {navItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className={`flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-[10px] uppercase tracking-[0.12em] text-ivory/65 transition hover:text-gold-light lg:min-h-12 lg:flex-row lg:gap-2 lg:text-foreground/65 lg:hover:text-gold`}><Icon className="size-5 lg:size-4" aria-hidden="true" /><span>{label}</span></Link>)}
        </div>
      </nav>
    </div>
  )
}
