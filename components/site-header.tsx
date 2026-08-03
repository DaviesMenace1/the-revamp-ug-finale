'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ThemeSwitcher } from '@/components/theme-switcher'

const navLinks = [
  { label: 'Collections', href: '/collections' },
  { label: 'Services', href: '/services' },
  { label: 'Custom Services', href: '/custom-services' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'About', href: '/about' },
  { label: 'Journal', href: '/journal' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled
            ? 'bg-background/95 backdrop-blur-md border-b border-border'
            : isHome
            ? 'bg-transparent'
            : 'bg-background/95 backdrop-blur-md border-b border-border',
        )}
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              href="/"
              className={cn(
                'font-serif text-xl md:text-2xl font-light tracking-widest uppercase transition-colors',
                scrolled || !isHome ? 'text-foreground' : 'text-white',
              )}
            >
              The Revamp
              <span className="text-gold ml-1">UG</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'font-sans text-sm tracking-wide uppercase hover-line transition-colors',
                    scrolled || !isHome ? 'text-foreground/80 hover:text-foreground' : 'text-white/80 hover:text-white',
                    pathname === link.href && 'text-gold',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <Link href="/contact" className="hidden lg:block">
                <Button
                  size="sm"
                  className={cn(
                    'font-sans text-xs tracking-widest uppercase px-6 rounded-none transition-all',
                    scrolled || !isHome
                      ? 'bg-foreground text-background hover:bg-gold hover:text-foreground'
                      : 'bg-white text-obsidian hover:bg-gold hover:text-foreground',
                  )}
                >
                  Inquire
                </Button>
              </Link>
              {/* Mobile menu toggle */}
              <button
                className={cn(
                  'lg:hidden p-2 transition-colors',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-full max-w-sm bg-background border-border p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-20 border-b border-border">
              <span className="font-serif text-xl tracking-widest uppercase">
                The Revamp<span className="text-gold ml-1">UG</span>
              </span>
              <button onClick={() => setMobileOpen(false)} className="text-foreground/60 hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            {/* Links */}
            <nav className="flex flex-col px-6 py-8 gap-1" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'font-sans text-sm tracking-widest uppercase py-4 border-b border-border/50 text-foreground/70 hover:text-gold transition-colors',
                    pathname === link.href && 'text-gold',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA */}
            <div className="mt-auto px-6 pb-10">
              <Link href="/contact" onClick={() => setMobileOpen(false)}>
                <Button className="w-full rounded-none bg-foreground text-background hover:bg-gold hover:text-foreground font-sans text-xs tracking-widest uppercase py-6">
                  Book a Consultation
                </Button>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
