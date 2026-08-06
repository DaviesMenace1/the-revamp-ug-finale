'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, ShoppingBag, Search, Heart, User, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/context/cart-context'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ThemeSwitcher } from '@/components/theme-switcher'

// Primary links shown directly in the header bar
const primaryNavLinks = [
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
]

// Secondary links available via the Drawer/Sheet
const secondaryNavLinks = [
  { label: 'Journal', href: '/journal' },
  { label: 'Source With Revamp', href: '/source-with-revamp' },
  { label: 'Trade Program', href: '/trade' },
  { label: 'Membership', href: '/membership' },
  { label: 'Contact', href: '/contact' },
]

// Complete list rendered inside the Drawer
const allNavLinks = [...primaryNavLinks, ...secondaryNavLinks]

export function SiteHeader() {
  const CartContext = useCart()
  const cartCount = CartContext ? CartContext.cartCount : 0
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop
      setScrolled(currentScroll > 40)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleSubmenu = (href: string) => {
    setOpenSubmenu(prev => (prev === href ? null : href))
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled || !isHome
            ? 'bg-background/95 backdrop-blur-md border-b border-border'
            : 'bg-transparent',
        )}
      >
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* ========================================================= */}
            {/* 1. LEFT SECTION                                           */}
            {/* Mobile: Menu + Search | Desktop: Logo                      */}
            {/* ========================================================= */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Only: Menu & Search */}
              <div className="flex items-center gap-1 md:hidden">
                <button
                  className={cn(
                    'p-1.5 transition-colors',
                    scrolled || !isHome ? 'text-foreground' : 'text-white',
                  )}
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </button>

                <Link
                  href="/search"
                  className={cn(
                    'p-1.5 hover:text-gold transition-colors',
                    scrolled || !isHome ? 'text-foreground' : 'text-white',
                  )}
                  aria-label="Search"
                >
                  <Search size={18} />
                </Link>
              </div>

              {/* Desktop Only: Brand Logo */}
              <div className="hidden md:flex items-center">
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
              </div>
            </div>

            {/* ========================================================= */}
            {/* 2. CENTER SECTION                                         */}
            {/* Mobile: Compact Logo | Desktop: Nav Links                 */}
            {/* ========================================================= */}
            {/* Mobile: Clean, scaled-down centered logo */}
            <div className="flex md:hidden items-center justify-center text-center px-1">
              <Link
                href="/"
                className={cn(
                  'font-serif text-xs sm:text-sm font-medium tracking-wider uppercase transition-colors whitespace-nowrap',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
              >
                The Revamp<span className="text-gold ml-0.5">UG</span>
              </Link>
            </div>

            {/* Desktop: Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8" aria-label="Main navigation">
              {primaryNavLinks.map((link) => (
                <div key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    className={cn(
                      'font-sans text-xs lg:text-sm tracking-wide uppercase transition-colors flex items-center gap-1',
                      scrolled || !isHome ? 'text-foreground/80 hover:text-foreground' : 'text-white/80 hover:text-white',
                      pathname === link.href && 'text-gold',
                    )}
                  >
                    {link.label}
                    {link.submenu && <ChevronDown size={14} className="opacity-50" />}
                  </Link>
                  
                  {link.submenu && (
                    <div className="absolute left-0 mt-0 w-60 bg-background border border-border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-40 max-h-80 overflow-y-auto">
                      {link.submenu.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          className="block px-4 py-2.5 text-sm text-foreground/70 hover:text-gold hover:bg-muted/50 border-b border-border/50 last:border-b-0 transition-colors"
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* ========================================================= */}
            {/* 3. RIGHT SECTION                                          */}
            {/* Mobile & Desktop Actions                                  */}
            {/* ========================================================= */}
            <div className="flex items-center gap-0.5 sm:gap-1.5 md:gap-3">
              {/* Desktop Search Icon */}
              <Link
                href="/search"
                className={cn(
                  'hidden md:block p-1.5 hover:text-gold transition-colors',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                aria-label="Search"
              >
                <Search size={20} />
              </Link>

              {/* Theme Switcher */}
              <div className="scale-90 sm:scale-100">
                <ThemeSwitcher />
              </div>

              {/* Wishlist Icon */}
              <Link
                href="/wishlist"
                className={cn(
                  'p-1 sm:p-1.5 hover:text-gold transition-colors',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                aria-label="Wishlist"
              >
                <Heart size={18} className="sm:w-[20px] sm:h-[20px]" />
              </Link>

              {/* Profile / Account Icon */}
              <Link
                href="/account"
                className={cn(
                  'p-1 sm:p-1.5 hover:text-gold transition-colors',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                aria-label="Account"
              >
                <User size={18} className="sm:w-[20px] sm:h-[20px]" />
              </Link>

              {/* Shopping Cart Icon */}
              <Link
                href="/cart"
                className={cn(
                  'relative p-1 sm:p-1.5 hover:text-gold transition-colors',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                aria-label="Shopping Cart"
              >
                <ShoppingBag size={18} className="sm:w-[20px] sm:h-[20px]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-white text-[9px] sm:text-[10px] font-bold rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Desktop Drawer Toggle (Icon Only - "Menu" text removed) */}
              <button
                className={cn(
                  'hidden md:flex p-1.5 transition-colors items-center ml-1',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                onClick={() => setDrawerOpen(true)}
                aria-label="Open full menu"
              >
                <Menu size={22} />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* FLOATING INQUIRE BUTTON */}
      <div className="fixed bottom-6 right-6 z-40">
        <Link href="/contact">
          <Button
            size="lg"
            className="shadow-2xl bg-foreground text-background hover:bg-gold hover:text-white font-sans text-xs tracking-widest uppercase px-5 py-6 rounded-full flex items-center gap-2 border border-border/20 backdrop-blur-md transition-all duration-300 hover:scale-105"
          >
            <MessageSquare size={16} />
            <span>Inquire</span>
          </Button>
        </Link>
      </div>

      {/* Unified Side Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full max-w-md bg-background border-border p-0">
          <SheetTitle className="sr-only">Main Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            {/* Header section inside Drawer */}
            <div className="flex items-center justify-between px-6 h-20 border-b border-border">
              <span className="font-serif text-xl tracking-widest uppercase">
                The Revamp<span className="text-gold ml-1">UG</span>
              </span>
              <button onClick={() => setDrawerOpen(false)} className="text-foreground/60 hover:text-foreground p-2">
                <X size={20} />
              </button>
            </div>

            {/* Navigation links inside Drawer */}
            <nav className="flex flex-col px-6 py-6 overflow-y-auto flex-1 gap-1" aria-label="Expanded menu navigation">
              {allNavLinks.map((link) => (
                <div key={link.href} className="border-b border-border/40">
                  {link.submenu ? (
                    <button
                      onClick={() => toggleSubmenu(link.href)}
                      className={cn(
                        'w-full text-left font-sans text-sm tracking-widest uppercase py-4 text-foreground/80 hover:text-gold transition-colors flex items-center justify-between',
                        pathname === link.href && 'text-gold',
                      )}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        size={16}
                        className={cn(
                          'transition-transform duration-200',
                          openSubmenu === link.href && 'rotate-180'
                        )}
                      />
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        'block w-full font-sans text-sm tracking-widest uppercase py-4 text-foreground/80 hover:text-gold transition-colors',
                        pathname === link.href && 'text-gold',
                      )}
                    >
                      {link.label}
                    </Link>
                  )}

                  {/* Submenu expansion inside drawer */}
                  {link.submenu && openSubmenu === link.href && (
                    <div className="bg-muted/30 mb-2 rounded-sm border-l-2 border-gold pl-4 py-2">
                      {link.submenu.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          onClick={() => setDrawerOpen(false)}
                          className="block py-2 text-xs uppercase tracking-wider text-foreground/70 hover:text-gold transition-colors"
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-border mt-auto flex flex-col gap-3">
              <Link href="/contact" onClick={() => setDrawerOpen(false)}>
                <Button className="w-full rounded-none bg-foreground text-background hover:bg-gold hover:text-white font-sans text-xs tracking-widest uppercase py-6">
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




{/*'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, ShoppingBag, Search, Heart, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/context/cart-context'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ThemeSwitcher } from '@/components/theme-switcher'

// Primary links shown directly in the header bar
const primaryNavLinks = [
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
]

// Secondary links available via the Drawer/Sheet
const secondaryNavLinks = [
  { label: 'Journal', href: '/journal' },
  { label: 'Source With Revamp', href: '/source-with-revamp' },
  { label: 'Trade Program', href: '/trade' },
  { label: 'Membership', href: '/membership' },
  { label: 'Contact', href: '/contact' },
]

// Complete list rendered inside the Drawer
const allNavLinks = [...primaryNavLinks, ...secondaryNavLinks]

export function SiteHeader() {
  const CartContext = useCart()
  const cartCount = CartContext ? CartContext.cartCount : 0
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop
      setScrolled(currentScroll > 40)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleSubmenu = (href: string) => {
    setOpenSubmenu(prev => (prev === href ? null : href))
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled || !isHome
            ? 'bg-background/95 backdrop-blur-md border-b border-border'
            : 'bg-transparent',
        )}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* 1. LEFT SECTION *
            {/* Mobile: Hamburger Drawer Toggle *
            <div className="flex items-center md:hidden">
              <button
                className={cn(
                  'p-1.5 transition-colors',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            </div>

            {/* Desktop: Brand Logo *
            <div className="hidden md:flex items-center">
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
            </div>

            {/* 2. CENTER SECTION */}
            {/* Mobile: Centered Logo *
            <div className="flex md:hidden items-center justify-center">
              <Link
                href="/"
                className={cn(
                  'font-serif text-base sm:text-lg font-light tracking-widest uppercase transition-colors text-center',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
              >
                The Revamp
                <span className="text-gold ml-1">UG</span>
              </Link>
            </div>

            {/* Desktop: Streamlined Primary Links *
            <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
              {primaryNavLinks.map((link) => (
                <div key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    className={cn(
                      'font-sans text-sm tracking-wide uppercase transition-colors flex items-center gap-1',
                      scrolled || !isHome ? 'text-foreground/80 hover:text-foreground' : 'text-white/80 hover:text-white',
                      pathname === link.href && 'text-gold',
                    )}
                  >
                    {link.label}
                    {link.submenu && <ChevronDown size={14} className="opacity-50" />}
                  </Link>
                  
                  {link.submenu && (
                    <div className="absolute left-0 mt-0 w-60 bg-background border border-border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-40 max-h-80 overflow-y-auto">
                      {link.submenu.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          className="block px-4 py-2.5 text-sm text-foreground/70 hover:text-gold hover:bg-muted/50 border-b border-border/50 last:border-b-0 transition-colors"
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* 3. RIGHT SECTION *
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
              {/* Theme Switcher (Hidden on small screens to save space) */}
              <div className="hidden sm:block">
                <ThemeSwitcher />
              </div>

              {/* Search Icon *
              <Link
                href="/search"
                className={cn(
                  'p-1.5 hover:text-gold transition-colors',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                aria-label="Search"
              >
                <Search size={20} />
              </Link>

              {/* Wishlist Icon *
              <Link
                href="/wishlist"
                className={cn(
                  'p-1.5 hover:text-gold transition-colors',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                aria-label="Wishlist"
              >
                <Heart size={20} />
              </Link>

              {/* Profile / Account Icon *
              <Link
                href="/account"
                className={cn(
                  'p-1.5 hover:text-gold transition-colors',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                aria-label="Account"
              >
                <User size={20} />
              </Link>

              {/* Cart Icon *
              <Link
                href="/cart"
                className={cn(
                  'relative p-1.5 hover:text-gold transition-colors',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                aria-label="Shopping Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Desktop Desktop Actions *
              <Link href="/contact" className="hidden lg:block ml-2">
                <Button
                  size="sm"
                  className={cn(
                    'font-sans text-xs tracking-widest uppercase px-6 rounded-none transition-all',
                    scrolled || !isHome
                      ? 'bg-foreground text-background hover:bg-gold hover:text-foreground'
                      : 'bg-white text-black hover:bg-gold hover:text-white',
                  )}
                >
                  Inquire
                </Button>
              </Link>

              {/* Desktop Drawer Toggle (Re-purposed for expanded menu) *
              <button
                className={cn(
                  'hidden md:flex p-2 transition-colors items-center gap-2 ml-1',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                onClick={() => setDrawerOpen(true)}
                aria-label="Open full menu"
              >
                <Menu size={22} />
                <span className="hidden lg:inline text-xs tracking-widest uppercase font-medium">Menu</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Unified Side Drawer *
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full max-w-md bg-background border-border p-0">
          <SheetTitle className="sr-only">Main Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            {/* Header section inside Drawer *
            <div className="flex items-center justify-between px-6 h-20 border-b border-border">
              <span className="font-serif text-xl tracking-widest uppercase">
                The Revamp<span className="text-gold ml-1">UG</span>
              </span>
              <button onClick={() => setDrawerOpen(false)} className="text-foreground/60 hover:text-foreground p-2">
                <X size={20} />
              </button>
            </div>

            {/* Navigation links inside Drawer *
            <nav className="flex flex-col px-6 py-6 overflow-y-auto flex-1 gap-1" aria-label="Expanded menu navigation">
              {allNavLinks.map((link) => (
                <div key={link.href} className="border-b border-border/40">
                  {link.submenu ? (
                    <button
                      onClick={() => toggleSubmenu(link.href)}
                      className={cn(
                        'w-full text-left font-sans text-sm tracking-widest uppercase py-4 text-foreground/80 hover:text-gold transition-colors flex items-center justify-between',
                        pathname === link.href && 'text-gold',
                      )}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        size={16}
                        className={cn(
                          'transition-transform duration-200',
                          openSubmenu === link.href && 'rotate-180'
                        )}
                      />
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        'block w-full font-sans text-sm tracking-widest uppercase py-4 text-foreground/80 hover:text-gold transition-colors',
                        pathname === link.href && 'text-gold',
                      )}
                    >
                      {link.label}
                    </Link>
                  )}

                  {/* Submenu expansion inside drawer *
                  {link.submenu && openSubmenu === link.href && (
                    <div className="bg-muted/30 mb-2 rounded-sm border-l-2 border-gold pl-4 py-2">
                      {link.submenu.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          onClick={() => setDrawerOpen(false)}
                          className="block py-2 text-xs uppercase tracking-wider text-foreground/70 hover:text-gold transition-colors"
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Bottom Actions *
            <div className="p-6 border-t border-border mt-auto flex flex-col gap-3">
              <Link href="/contact" onClick={() => setDrawerOpen(false)}>
                <Button className="w-full rounded-none bg-foreground text-background hover:bg-gold hover:text-white font-sans text-xs tracking-widest uppercase py-6">
                  Book a Consultation
                </Button>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}*/}




{/*'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/context/cart-context'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ThemeSwitcher } from '@/components/theme-switcher'

// Primary links shown directly in the header bar
const primaryNavLinks = [
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
]

// Secondary links available via the Drawer/Sheet
const secondaryNavLinks = [
  { label: 'Journal', href: '/journal' },
  { label: 'Source With Revamp', href: '/source-with-revamp' },
  { label: 'Trade Program', href: '/trade' },
  { label: 'Membership', href: '/membership' },
  { label: 'Contact', href: '/contact' },
]

// Complete list rendered inside the Drawer
const allNavLinks = [...primaryNavLinks, ...secondaryNavLinks]

export function SiteHeader() {
  const CartContext = useCart()
  const cartCount = CartContext ? CartContext.cartCount : 0
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
            window.addEventListener('scroll', onScroll, { passive: true })
                return () => window.removeEventListener('scroll', onScroll)
useEffect(() => {
  const onScroll = () => {
      // Check both window.scrollY and document.documentElement.scrollTop 
          // to handle cross-browser and layout container differences
              const currentScroll = window.scrollY || document.documentElement.scrollTop
                  setScrolled(currentScroll > 40)
                    }

      // Trigger once immediately on mount to set initial state
      onScroll()

      window.addEventListener('scroll', onScroll, { passive: true })
      return () => window.removeEventListener('scroll', onScroll)
    }, [])
  })

  const toggleSubmenu = (href: string) => {
    setOpenSubmenu(prev => (prev === href ? null : href))
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled || !isHome
            ? 'bg-background/95 backdrop-blur-md border-b border-border'
            : 'bg-transparent',
        )}
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo *
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

            {/* Streamlined Desktop Nav (4 primary links) *
            <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
              {primaryNavLinks.map((link) => (
                <div key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    className={cn(
                      'font-sans text-sm tracking-wide uppercase transition-colors flex items-center gap-1',
                      scrolled || !isHome ? 'text-foreground/80 hover:text-foreground' : 'text-white/80 hover:text-white',
                      pathname === link.href && 'text-gold',
                    )}
                  >
                    {link.label}
                    {link.submenu && <ChevronDown size={14} className="opacity-50" />}
                  </Link>
                  
                  {/* Dropdown for Primary Nav *
                  {link.submenu && (
                    <div className="absolute left-0 mt-0 w-60 bg-background border border-border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-40 max-h-80 overflow-y-auto">
                      {link.submenu.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          className="block px-4 py-2.5 text-sm text-foreground/70 hover:text-gold hover:bg-muted/50 border-b border-border/50 last:border-b-0 transition-colors"
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Side Controls *
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              
              <Link href="/cart" className="relative p-2 hover:text-gold transition-colors">
                <ShoppingBag size={22} className={scrolled || !isHome ? 'text-foreground' : 'text-white'} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className={scrolled || !isHome ? 'text-foreground' : 'text-white'}>
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
                      : 'bg-white text-black hover:bg-gold hover:text-white',
                  )}
                >
                  Inquire
                </Button>
              </Link>

              {/* Drawer Toggle (Visible on Desktop & Mobile) *
              <button
                className={cn(
                  'p-2 transition-colors flex items-center gap-2',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                onClick={() => setDrawerOpen(true)}
                aria-label="Open full menu"
              >
                <Menu size={22} />
                <span className="hidden lg:inline text-xs tracking-widest uppercase font-medium">Menu</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Unified Side Drawer for Mobile & Desktop *
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full max-w-md bg-background border-border p-0">
          <SheetTitle className="sr-only">Main Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            {/* Header section inside Drawer *
            <div className="flex items-center justify-between px-6 h-20 border-b border-border">
              <span className="font-serif text-xl tracking-widest uppercase">
                The Revamp<span className="text-gold ml-1">UG</span>
              </span>
              <button onClick={() => setDrawerOpen(false)} className="text-foreground/60 hover:text-foreground p-2">
                <X size={20} />
              </button>
            </div>

            {/* Navigation links inside Drawer *
            <nav className="flex flex-col px-6 py-6 overflow-y-auto flex-1 gap-1" aria-label="Expanded menu navigation">
              {allNavLinks.map((link) => (
                <div key={link.href} className="border-b border-border/40">
                  {link.submenu ? (
                    <button
                      onClick={() => toggleSubmenu(link.href)}
                      className={cn(
                        'w-full text-left font-sans text-sm tracking-widest uppercase py-4 text-foreground/80 hover:text-gold transition-colors flex items-center justify-between',
                        pathname === link.href && 'text-gold',
                      )}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        size={16}
                        className={cn(
                          'transition-transform duration-200',
                          openSubmenu === link.href && 'rotate-180'
                        )}
                      />
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        'block w-full font-sans text-sm tracking-widest uppercase py-4 text-foreground/80 hover:text-gold transition-colors',
                        pathname === link.href && 'text-gold',
                      )}
                    >
                      {link.label}
                    </Link>
                  )}

                  {/* Submenu expansion inside drawer *
                  {link.submenu && openSubmenu === link.href && (
                    <div className="bg-muted/30 mb-2 rounded-sm border-l-2 border-gold pl-4 py-2">
                      {link.submenu.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          onClick={() => setDrawerOpen(false)}
                          className="block py-2 text-xs uppercase tracking-wider text-foreground/70 hover:text-gold transition-colors"
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Bottom Actions *
            <div className="p-6 border-t border-border mt-auto flex flex-col gap-3">
              <Link href="/contact" onClick={() => setDrawerOpen(false)}>
                <Button className="w-full rounded-none bg-foreground text-background hover:bg-gold hover:text-white font-sans text-xs tracking-widest uppercase py-6">
                  Book a Consultation
                </Button>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}*/}




{/*'use client'

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
            {/* Logo *
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

            {/* Desktop nav *
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
                  
                  {/* Submenu *
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

            {/* Right actions *
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
              {/* Mobile menu toggle *
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

      {/* Mobile drawer *
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-full max-w-sm bg-background border-border p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            {/* Header *
            <div className="flex items-center justify-between px-6 h-20 border-b border-border">
              <span className="font-serif text-xl tracking-widest uppercase">
                The Revamp<span className="text-gold ml-1">UG</span>
              </span>
              <button onClick={() => setMobileOpen(false)} className="text-foreground/60 hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            {/* Links *
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
                  
                  {/* Mobile Submenu *
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

            {/* CTA *
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
*/}
