'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from '@/components/notifications/notification-bell'
import { LuxuryMenu, LuxuryX } from '@/components/icons/luxury-icons'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { useState } from 'react'

interface PortalLayoutProps {
  children: ReactNode
  portalName: string
  portalSlug: 'client' | 'trade' | 'membership'
  navItems: Array<{ label: string; href: string }>
}

export function PortalLayout({
  children,
  portalName,
  portalSlug,
  navItems,
}: PortalLayoutProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Heade */}
      <header className="sticky top-0 z-40 border-b border-border/20 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-3 sm:px-5 md:px-8">
          <div className="flex min-w-0 items-center justify-between gap-2 h-16 md:h-20">
            <div className="flex min-w-0 items-center gap-4">
              <Link prefetch={false} href={`/${portalSlug}`} className="truncate font-serif text-lg font-light text-foreground sm:text-xl">
                {portalName}
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav aria-label={`${portalName} navigation`} className="hidden min-w-0 md:flex items-center gap-1">
              {navItems.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    prefetch={false}
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`min-w-0 rounded px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <ThemeSwitcher />
              <NotificationBell />
              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Close portal navigation' : 'Open portal navigation'}
                className="md:hidden flex size-11 items-center justify-center rounded hover:bg-muted transition-colors"
              >
              {mobileMenuOpen ? <LuxuryX size={20} /> : <LuxuryMenu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav aria-label={`${portalName} mobile navigation`} className="grid min-w-0 gap-2 border-t border-border/20 pb-4 pt-3">
              {navItems.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    prefetch={false}
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`block min-h-11 min-w-0 rounded px-4 py-3 text-sm font-medium leading-5 transition-colors ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto min-w-0 max-w-7xl px-3 py-6 sm:px-5 sm:py-8 md:px-8 md:py-12">
        {children}
      </main>
    </div>
  )
}
