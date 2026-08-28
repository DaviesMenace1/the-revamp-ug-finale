'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Menu, ChevronDown, ShoppingBag, Search, Heart, User } from 'lucide-react'
import NotificationBell from '@/components/notifications/notification-bell'
import { cn } from '@/lib/utils'
import { useCart } from '@/lib/context/cart-context'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ThemeSwitcher } from '@/components/theme-switcher'
{/*import PromotionBanner from '@/components/promotions/promotion-banner'*/}

  interface NavLink {
    label: string
    href: string
    submenu?: NavLink[]
  }

  // Primary links shown directly in the header bar
  const primaryNavLinks: NavLink[] = [
  { label: 'About', href: '/about' },
  { 
    label: 'Services', 
    href: '/services',
    submenu: [
      { label: 'Interior Design', href: '/services' },
      { label: 'Architecture', href: '/services/architecture' },
      { label: 'Custom Services', href: '/custom-services' },
      { label: 'View all services', href: '/services' },
    ]
  },
  { label: 'Projects', href: '/portfolio' },
  { label: 'Collections', href: '/collections' },
  { label: 'Journal', href: '/journal' },
  { label: 'FAQs', href: '/faqs' },
]

// Secondary links available via the Drawer/Sheet
const secondaryNavLinks: NavLink[] = [
  { label: 'Source With Revamp', href: '/source-with-revamp' },
  { label: 'Trade Program', href: '/trade-program' },
  { label: 'Membership', href: '/membership-program' },
  { label: 'Request a Quote', href: '/request-quote' },
  { label: 'Product Inquiry', href: '/product-inquiry' },
  { label: 'Contact', href: '/contact' },
]

// Complete list rendered inside the Drawer
const allNavLinks = [...primaryNavLinks, ...secondaryNavLinks]

export function SiteHeader() {
  const CartContext = useCart()
  const cartCount = CartContext ? CartContext.cartCount : 0
  const { user } = useUser()
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState<string | null>(null)

  const pathname = usePathname()
  const isHome = pathname === '/'
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop
      setScrolled(currentScroll > 40)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDesktopDropdownOpen(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menus on page route changes
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDesktopDropdownOpen(null)
      setDrawerOpen(false)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [pathname])

  const toggleSubmenu = (href: string) => {
    setOpenSubmenu(prev => (prev === href ? null : href))
  }

  const toggleDesktopDropdown = (href: string) => {
    setDesktopDropdownOpen(prev => (prev === href ? null : href))
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50">
        {/*<PromotionBanner />*/}
        <header
        className={cn(
          'relative w-full transition-all duration-300',
          scrolled || !isHome
            ? 'bg-background/95 backdrop-blur-md border-b border-border'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto max-w-[1440px] px-2 sm:px-6 lg:px-12">
          <div className="flex min-h-16 items-center justify-between md:min-h-20">
          
            {/* 1. LEFT SECTION */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Only: Menu & Search */}
              <div className="hidden">
                <button
                  className={cn(
                    'flex size-11 items-center justify-center transition-colors',
                    scrolled || !isHome ? 'text-foreground' : 'text-white',
                  )}
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </button>

                <Link
                prefetch={false}
                  href="/search"
                  className={cn(
                    'hidden size-11 items-center justify-center hover:text-gold transition-colors lg:flex',
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
                prefetch={false}
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

            {/* 2. CENTER SECTION */}
            {/* Mobile: Clean Logo */}
            <div className="mr-auto flex items-center justify-start px-0 text-left md:hidden">
              <Link
                prefetch={false}
                href="/"
                className={cn(
                  'font-serif text-xs sm:text-sm font-medium tracking-wider uppercase transition-colors whitespace-nowrap',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
              >
                The Revamp<span className="text-gold ml-0.5">UG</span>
              </Link>
            </div>

            {/* Desktop: Navigation Links with Fixed Dropdown */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8" aria-label="Main navigation" ref={dropdownRef}>
              {primaryNavLinks.map((link) => (
                <div 
                  key={link.href} 
                  className="relative group"
                  onMouseEnter={() => link.submenu && setDesktopDropdownOpen(link.href)}
                  onMouseLeave={() => link.submenu && setDesktopDropdownOpen(null)}
                >
                  {link.submenu ? (
                    <div className="flex items-center gap-1 cursor-pointer">
                      <Link
                prefetch={false}
                        href={link.href}
                        className={cn(
                          'font-sans text-xs lg:text-sm tracking-wide uppercase transition-colors',
                          scrolled || !isHome ? 'text-foreground/80 hover:text-foreground' : 'text-white/80 hover:text-white',
                          pathname.startsWith(link.href) && 'text-gold',
                        )}
                      >
                        {link.label}
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          toggleDesktopDropdown(link.href)
                        }}
                        className={cn(
                          'flex size-11 items-center justify-center transition-colors',
                          scrolled || !isHome ? 'text-foreground/80 hover:text-foreground' : 'text-white/80 hover:text-white'
                        )}
                        aria-expanded={desktopDropdownOpen === link.href}
                        aria-label={`Toggle ${link.label} submenu`}
                      >
                        <ChevronDown 
                          size={14} 
                          className={cn(
                            'transition-transform duration-200 opacity-70',
                            desktopDropdownOpen === link.href && 'rotate-180 text-gold'
                          )} 
                        />
                      </button>
                    </div>
                  ) : (
                    <Link
                prefetch={false}
                      href={link.href}
                      className={cn(
                        'font-sans text-xs lg:text-sm tracking-wide uppercase transition-colors',
                        scrolled || !isHome ? 'text-foreground/80 hover:text-foreground' : 'text-white/80 hover:text-white',
                        pathname === link.href && 'text-gold',
                      )}
                    >
                      {link.label}
                    </Link>
                  )}
                
                  {/* Dropdown Container */}
                  {link.submenu && (
                    <div
                      className={cn(
                        'absolute left-0 top-full pt-2 w-64 transition-all duration-200 z-50',
                        desktopDropdownOpen === link.href
                          ? 'opacity-100 visible translate-y-0'
                          : 'opacity-0 invisible -translate-y-2 pointer-events-none'
                      )}
                    >
                      <div className="bg-background border border-border shadow-xl rounded-sm py-2 max-h-80 overflow-y-auto">
                        {link.submenu.map((subitem) => (
                          <Link
                prefetch={false}
                            key={`${subitem.href}-${subitem.label}`}
                            href={subitem.href}
                            className="block px-4 py-2 text-xs uppercase tracking-wider text-foreground/70 hover:text-gold hover:bg-muted/50 border-b border-border/30 last:border-b-0 transition-colors"
                          >
                            {subitem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* 3. RIGHT SECTION */}
            <div className="flex items-center gap-0 sm:gap-1.5 md:gap-3">
              {/* Compact mobile search */}
              <Link
                prefetch={false}
                href="/search"
                className={cn(
                  'hidden size-10 items-center justify-center transition-colors hover:text-gold sm:flex sm:size-11 md:hidden',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                aria-label="Search"
              >
                <Search size={19} />
              </Link>

              {/* Desktop Search Icon */}
              <Link
                prefetch={false}
                href="/search"
                className={cn(
                  'hidden size-11 items-center justify-center md:flex hover:text-gold transition-colors',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                aria-label="Search"
              >
                <Search size={20} />
              </Link>

              {/* Theme Switcher */}
              <div className="flex scale-90 sm:scale-100 md:flex">
                <ThemeSwitcher />
              </div>

              {/* Notifications */}
              <NotificationBell className={cn('size-10 sm:size-11', scrolled || !isHome ? 'text-foreground' : 'text-white')} />

              {/* Wishlist Icon */}
              <Link
                prefetch={false}
                href="/wishlist"
                                  className={cn(
                    'hidden size-11 items-center justify-center hover:text-gold transition-colors lg:flex',
                    scrolled || !isHome ? 'text-foreground' : 'text-white',
                  )}
                  aria-label="Wishlist"

              >
                <Heart size={18} className="sm:w-[20px] sm:h-[20px]" />
              </Link>

              {/* Profile / Account Icon */}
              <Link
                prefetch={false}
                href="/account"
                                  className={cn(
                    'flex size-10 items-center justify-center hover:text-gold transition-colors sm:size-11',
                    scrolled || !isHome ? 'text-foreground' : 'text-white',
                  )}
                  aria-label="Account"

                >
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt=""
                      className="size-5 rounded-full object-cover ring-1 ring-current/20"
                    />
                  ) : (
                    <User size={18} className="sm:w-[20px] sm:h-[20px]" />
                  )}
                </Link>

              {/* Shopping Cart Icon */}
              <Link
                prefetch={false}
                href="/cart"
                className={cn(
                  'relative flex size-10 items-center justify-center hover:text-gold transition-colors sm:size-11',
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

              {/* Compact mobile menu */}
              <button
                className={cn(
                  'flex size-10 items-center justify-center transition-colors sm:size-11 md:hidden',
                  scrolled || !isHome ? 'text-foreground' : 'text-white',
                )}
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>

              {/* Desktop Drawer Toggle */}
              <button
                className={cn(
                  'hidden size-11 items-center justify-center md:flex ml-1 transition-colors',
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
      </div>

      {/* Side Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="safe-bottom w-full max-w-md border-border bg-background p-0">
          <SheetTitle className="sr-only">Main Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            {/* Header section inside Drawer */}
            <div className="flex items-center justify-between px-6 h-20 border-b border-border">
              <span className="font-serif text-xl tracking-widest uppercase">
                The Revamp<span className="text-gold ml-1">UG</span>
              </span>
              {/*  <button onClick={() => setDrawerOpen(false)} className="text-foreground/60 hover:text-foreground p-2">
                <X size={20} />
              </button>*/}
            </div>

            {/* Navigation links inside Drawer */}
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-6" aria-label="Expanded menu navigation">
              {allNavLinks.map((link) => (
                <div key={link.href} className="border-b border-border/40">
                  {link.submenu ? (
                    <button
                      onClick={() => toggleSubmenu(link.href)}
                      aria-expanded={openSubmenu === link.href}
                      className={cn(
                        'flex min-h-11 w-full items-center justify-between py-4 text-left font-sans text-sm uppercase tracking-widest text-foreground/80 transition-colors hover:text-gold',
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
                prefetch={false}
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
                prefetch={false}
                          key={`${subitem.href}-${subitem.label}`}
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
            <div className="mt-auto flex flex-col gap-3 border-t border-border p-6">
              <div className="flex min-h-12 items-center justify-between border border-border px-4">
                <span className="text-xs uppercase tracking-widest text-foreground/70">Theme</span>
                <ThemeSwitcher />
              </div>
              <Link prefetch={false} href="/client/tickets" onClick={() => setDrawerOpen(false)} className="flex min-h-12 items-center justify-center rounded bg-foreground px-5 py-4 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold hover:text-white">
                Support Tickets
              </Link>
              <Link prefetch={false} href="/book-consultation" onClick={() => setDrawerOpen(false)} className="flex min-h-12 items-center justify-center rounded bg-foreground px-5 py-4 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold hover:text-white">
                Book a Consultation
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}



