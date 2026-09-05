'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home } from '@/components/ui/luxury-icons'
import { LuxuryCloseIcon, LuxuryMenuIcon } from '@/components/ui/luxury-nav-icons'
import NotificationBell from '@/components/notifications/notification-bell'

interface PortalLayoutProps { children: ReactNode; portalName: string; portalSlug: 'client' | 'trade' | 'membership'; homeHref?: string; navItems: Array<{ label: string; href: string }> }

export function PortalLayout({ children, portalName, portalSlug, homeHref, navItems }: PortalLayoutProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const clientPortal = portalSlug === 'client'
  const brandHref = clientPortal ? '/' : (homeHref ?? `/${portalSlug}`)
  const overlayClasses = clientPortal ? 'border-white/15 bg-black/10 text-white backdrop-blur-sm' : 'border-border/70 bg-canvas/95 text-foreground backdrop-blur-xl'
  const mutedClasses = clientPortal ? 'text-white/65 hover:text-white' : 'text-muted-foreground hover:text-foreground'

  return <div className="min-h-screen bg-canvas"><header className={`sticky top-0 z-40 border-b ${overlayClasses}`}><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12"><Link href={brandHref} aria-label={clientPortal ? 'Go to The Revamp UG homepage' : `Go to ${portalName} home`} className="inline-flex items-center gap-3 font-serif text-2xl font-medium tracking-tighter"><Home className="size-5 shrink-0" aria-hidden="true" /><span>The Revamp <span className={clientPortal ? 'italic text-gold-light' : 'italic text-gilded'}>UG</span></span><span className={`hidden text-[10px] font-sans font-semibold uppercase tracking-[0.25em] sm:inline ${clientPortal ? 'text-white/65' : 'text-muted-foreground'}`}>{portalName}</span></Link><nav className="hidden items-center gap-7 md:flex">{navItems.map((item) => <Link key={item.href} href={item.href} className={`text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors ${active(item.href) ? (clientPortal ? 'text-white' : 'text-gilded') : mutedClasses}`}>{item.label}</Link>)}</nav><div className="flex items-center gap-2"><NotificationBell className={clientPortal ? 'text-white/75 hover:text-white' : 'text-foreground/70 hover:text-gilded'} /><button type="button" onClick={() => setMobileMenuOpen((value) => !value)} aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? 'Close portal navigation' : 'Open portal navigation'} className="p-2">{mobileMenuOpen ? <LuxuryCloseIcon size={20} /> : <LuxuryMenuIcon size={20} />}</button></div></div>{mobileMenuOpen && <nav className={`mx-auto flex max-w-7xl flex-col gap-4 border-t px-6 py-5 text-[10px] font-semibold uppercase tracking-[0.18em] lg:px-12 md:hidden ${clientPortal ? 'border-white/15 bg-obsidian text-white' : 'border-border bg-canvas text-foreground'}`}>{navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={active(item.href) ? 'text-gilded' : clientPortal ? 'text-white/65' : 'text-muted-foreground'}>{item.label}</Link>)}<Link href={brandHref} onClick={() => setMobileMenuOpen(false)} className="mt-2 inline-flex items-center gap-2 border-t border-current/15 pt-4 text-[10px]"> <Home className="size-4" /> Homepage</Link></nav>}</header><main className={`mx-auto max-w-7xl px-6 lg:px-12 ${clientPortal ? '-mt-20 pt-20' : 'py-16 lg:py-24'}`}>{children}</main></div>
}
