'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/context/cart-context'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ThemeSwitcher } from '@/components/theme-switcher'

const navLinks = [
  { label: 'About', href: '/about' },
  { 
    label: 'Services', 
    href: '/services',
    submenu: [
      { label: 'Interior Design', href: '/services/interior-design' },
      { label: 'Architecture', href: '/services/architecture' },
      { label: '3D Visualization', href: '/services/3d-visualization' },
      { label: 'Renovation & Construction', href: '/services/renovation' },
      { label: 'Procurement & Sourcing', href: '/services/procurement' },
      { label: 'Furniture & Manufacturing', href: '/services/furniture' },
      { label: 'Styling & Living', href: '/services/styling' },
      { label: 'Consultancy', href: '/services/consultancy' },
      { label: 'Property Services', href: '/services/property' },
      { label: 'Project Management', href: '/services/project-management' },
      { label: 'Signature Services', href: '/services/signature-services' },
    ]
  },
  { label: 'Projects', href: '/projects' },
  { label: 'Shop', href: '/collections' },
  { label: 'Journal', href: '/journal' },
  { label: 'Source With Revamp', href: '/source-with-revamp' },
  { label: 'Trade Program', href: '/trade' },
  { label: 'Membership', href: '/membership' },
  { label: 'Contact', href: '/contact' },
]

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const CartContext = useCart()
  const cartCount = CartContext ? CartContext.cartCount : 0
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null)
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
                <div key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    className={cn(
                      'font-sans text-sm tracking-wide uppercase hover-line transition-colors flex items-center gap-1',
                      scrolled || !isHome ? 'text-foreground/80 hover:text-foreground' : 'text-white/80 hover:text-white',
                      pathname === link.href && 'text-gold',
                    )}
                  >
                    {link.label}
                    {link.submenu && <ChevronDown size={14} className="opacity-50" />}
                  </Link>
                  
                  {/* Submenu */}
                  {link.submenu && (
                    <div className="absolute left-0 mt-0 w-56 bg-background border border-border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-40">
                      {link.submenu.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          className="block px-4 py-2.5 text-sm text-foreground/70 hover:text-foreground hover:bg-background/80 border-b border-border/50 last:border-b-0 transition-colors"
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
               <Link href="/cart" className="relative p-2 hover:text-accent transition-colors">
              <ShoppingBag size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
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
            <nav className="flex flex-col px-6 py-8 gap-1 overflow-y-auto" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <div key={link.href}>
                  <button
                    onClick={() => {
                      if (link.submenu) {
                        setMobileSubmenu(mobileSubmenu === link.href ? null : link.href)
                      } else {
                        window.location.href = link.href
                      }
                    }}
                    className={cn(
                      'w-full text-left font-sans text-sm tracking-widest uppercase py-4 border-b border-border/50 text-foreground/70 hover:text-gold transition-colors flex items-center justify-between',
                      pathname === link.href && 'text-gold',
                    )}
                  >
                    <span>{link.label}</span>
                    {link.submenu && (
                      <ChevronDown 
                        size={16} 
                        className={cn(
                          'transition-transform',
                          mobileSubmenu === link.href && 'rotate-180'
                        )}
                      />
                    )}
                  </button>
                  
                  {/* Mobile Submenu */}
                  {link.submenu && mobileSubmenu === link.href && (
                    <div className="bg-background/50 border-b border-border/50">
                      {link.submenu.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          onClick={() => setMobileOpen(false)}
                          className="block pl-6 pr-4 py-3 text-sm text-foreground/60 hover:text-gold transition-colors"
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
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
