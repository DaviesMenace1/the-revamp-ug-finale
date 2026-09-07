'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home } from '@/components/ui/luxury-icons'
import { LuxuryCloseIcon, LuxuryMenuIcon } from '@/components/ui/luxury-nav-icons'
import NotificationBell from '@/components/notifications/notification-bell'

interface PortalLayoutProps {
  children: ReactNode
  portalName: string
  portalSlug: 'client' | 'trade' | 'membership'
  homeHref?: string
  navItems: Array<{ label: string; href: string }>
}

export function PortalLayout({ children, portalName, portalSlug, homeHref, navItems }: PortalLayoutProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const clientPortal = portalSlug === 'client'
  const brandHref = clientPortal ? '/' : (homeHref ?? `/${portalSlug}`)
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const surface = clientPortal ? 'border-white/15 bg-black/30 text-white backdrop-blur-xl' : 'border-border/70 bg-canvas/95 text-foreground backdrop-blur-xl'
  const muted = clientPortal ? 'text-white/70 hover:text-white' : 'text-muted-foreground hover:text-foreground'

  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return <div className="min-h-screen bg-canvas">
    <a href="#portal-main-content" className="sr-only fixed left-4 top-4 z-[70] rounded bg-foreground px-4 py-3 text-xs font-semibold text-background focus:not-sr-only">Skip to content</a>
    <header className={`fixed inset-x-0 top-0 z-40 border-b ${surface}`}>
      <div className="mx-auto flex min-h-20 max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-12">
        <Link href={brandHref} aria-label={clientPortal ? 'Go to The Revamp UG homepage' : `Go to ${portalName} home`} className="flex min-w-0 shrink-0 items-center gap-2.5 font-serif text-xl tracking-[-0.04em] sm:text-2xl">
          <Home className="size-5 shrink-0" aria-hidden="true" />
          <span className="truncate">The Revamp <span className={clientPortal ? 'italic text-gold-light' : 'italic text-gilded'}>UG</span></span>
          <span className={`hidden whitespace-nowrap text-[9px] font-sans font-semibold uppercase tracking-[0.2em] xl:inline ${clientPortal ? 'text-white/70' : 'text-muted-foreground'}`}>{portalName}</span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-start gap-5 overflow-x-auto [scrollbar-width:none] xl:flex 2xl:justify-center 2xl:gap-7" aria-label={`${portalName} navigation`}>
          {navItems.map((item) => <Link key={item.href} href={item.href} aria-current={active(item.href) ? 'page' : undefined} className={`shrink-0 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors 2xl:text-[10px] 2xl:tracking-[0.18em] ${active(item.href) ? (clientPortal ? 'text-white' : 'text-primary') : muted}`}>{item.label}</Link>)}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <NotificationBell className={clientPortal ? 'text-white/80 hover:text-white' : 'text-foreground/75 hover:text-primary'} />
          <button type="button" onClick={() => setMobileMenuOpen((value) => !value)} aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? 'Close portal navigation' : 'Open portal navigation'} className="flex size-11 items-center justify-center xl:hidden">{mobileMenuOpen ? <LuxuryCloseIcon size={20} /> : <LuxuryMenuIcon size={20} />}</button>
        </div>
      </div>

      {mobileMenuOpen && <nav className={`border-t px-5 py-4 shadow-xl sm:px-8 xl:hidden ${clientPortal ? 'border-white/15 bg-obsidian text-white' : 'border-border bg-canvas text-foreground'}`} aria-label="Portal navigation menu">
        <div className="mx-auto grid max-w-[1440px] gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} aria-current={active(item.href) ? 'page' : undefined} className={`flex min-h-12 items-center border-b border-current/10 py-3 text-sm font-medium tracking-[0.04em] ${active(item.href) ? (clientPortal ? 'text-gold-light' : 'text-primary') : clientPortal ? 'text-white/75 hover:text-white' : 'text-foreground hover:text-primary'}`}>{item.label}</Link>)}
          <Link href={brandHref} onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center gap-2 border-b border-current/10 py-3 text-sm font-medium"><Home className="size-4" />Homepage</Link>
        </div>
      </nav>}
    </header>

    {!clientPortal && <div aria-hidden="true" className="h-20" />}
    <main id="portal-main-content" tabIndex={-1} className={`mx-auto max-w-[1440px] px-4 outline-none sm:px-6 lg:px-12 ${clientPortal ? 'pt-20 pb-8' : 'py-12 lg:py-20'}`}>{children}</main>
  </div>
}
