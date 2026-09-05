'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LuxuryCloseIcon, LuxuryMenuIcon } from '@/components/ui/luxury-nav-icons'
import NotificationBell from '@/components/notifications/notification-bell'
import { ThemeSwitcher } from '@/components/theme-switcher'

interface PortalLayoutProps { children: ReactNode; portalName: string; portalSlug: 'client' | 'trade' | 'membership'; homeHref?: string; navItems: Array<{ label: string; href: string }> }

export function PortalLayout({ children, portalName, portalSlug, homeHref, navItems }: PortalLayoutProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const clientOverlay = portalSlug === 'client'
  return <div className="min-h-screen bg-canvas"><header className={`z-40 border-b ${clientOverlay ? 'absolute inset-x-0 top-0 border-white/15 bg-black/10 text-white backdrop-blur-sm' : 'sticky top-0 border-border/70 bg-canvas/90 text-foreground backdrop-blur-xl'}`}><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12"><Link href={homeHref ?? `/${portalSlug}`} className="font-serif text-2xl font-medium tracking-tighter">The Revamp <span className={clientOverlay ? 'italic text-gold-light' : 'italic text-gilded'}>UG</span><span className={`ml-3 text-[10px] font-sans font-semibold uppercase tracking-[0.25em] ${clientOverlay ? 'text-white/65' : 'text-muted-foreground'}`}>{portalName}</span></Link><nav className="hidden items-center gap-7 md:flex">{navItems.map((item) => <Link key={item.href} href={item.href} className={`text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors ${active(item.href) ? (clientOverlay ? 'text-white' : 'text-gilded') : (clientOverlay ? 'text-white/65 hover:text-white' : 'text-muted-foreground hover:text-foreground')}`}>{item.label}</Link>)}</nav><div className="flex items-center gap-2"><ThemeSwitcher /><NotificationBell /><button type="button" onClick={() => setMobileMenuOpen((value) => !value)} aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? 'Close portal navigation' : 'Open portal navigation'} className="p-2">{mobileMenuOpen ? <LuxuryCloseIcon size={20} /> : <LuxuryMenuIcon size={20} />}</button></div></div>{mobileMenuOpen && <nav className={`mx-auto flex max-w-7xl flex-col gap-4 border-t px-6 py-5 text-[10px] font-semibold uppercase tracking-[0.18em] lg:px-12 md:hidden ${clientOverlay ? 'border-white/15 bg-obsidian text-white' : 'border-border bg-canvas text-foreground'}`}>{navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={active(item.href) ? 'text-gilded' : clientOverlay ? 'text-white/65' : 'text-muted-foreground'}>{item.label}</Link>)}</nav>}</header><main className={`mx-auto max-w-7xl px-6 lg:px-12 ${clientOverlay ? 'pt-0' : 'py-16 lg:py-24'}`}>{children}</main></div>
}
