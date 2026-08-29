'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useCart } from '@/lib/context/cart-context'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ThemeSwitcher } from '@/components/theme-switcher'
import NotificationBell from '@/components/notifications/notification-bell'

interface NavLink {
  label: string
  href: string
  submenu?: NavLink[]
}

/* -------------------------------------------------------------------------- */
/*                           PRIMARY NAVIGATION                               */
/* -------------------------------------------------------------------------- */

const primaryNavLinks: NavLink[] = [
  {
    label: 'About',
    href: '/about',
  },
  {
    label: 'Services',
    href: '/services',
    submenu: [
      {
        label: 'Interior Design',
        href: '/services',
      },
      {
        label: 'Architecture',
        href: '/services/architecture',
      },
      {
        label: 'Custom Services',
        href: '/custom-services',
      },
      {
        label: 'View All Services',
        href: '/services',
      },
    ],
  },
  {
    label: 'Projects',
    href: '/portfolio',
  },
  {
    label: 'Collections',
    href: '/collections',
  },
  {
    label: 'Journal',
    href: '/journal',
  },
]

/* -------------------------------------------------------------------------- */
/*                          EXPANDED MENU NAVIGATION                          */
/* -------------------------------------------------------------------------- */

const secondaryNavLinks: NavLink[] = [
  {
    label: 'FAQs',
    href: '/faqs',
  },
  {
    label: 'Source With Revamp',
    href: '/source-with-revamp',
  },
  {
    label: 'Trade Program',
    href: '/trade-program',
  },
  {
    label: 'Membership',
    href: '/membership-program',
  },
  {
    label: 'Request a Quote',
    href: '/request-quote',
  },
  {
    label: 'Product Inquiry',
    href: '/product-inquiry',
  },
  {
    label: 'Contact',
    href: '/contact',
  },
]

const allNavLinks = [...primaryNavLinks, ...secondaryNavLinks]

/* -------------------------------------------------------------------------- */
/*                               SITE HEADER                                  */
/* -------------------------------------------------------------------------- */

export function SiteHeader() {
  const pathname = usePathname()
  const { user } = useUser()

  const CartContext = useCart()
  const cartCount = CartContext?.cartCount ?? 0

  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState<string | null>(
    null,
  )

  const dropdownRef = useRef<HTMLDivElement>(null)

  const isHome = pathname === '/'

  const isSolidHeader = scrolled || !isHome

  /* ------------------------------------------------------------------------ */
  /*                              SCROLL STATE                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }

    handleScroll()

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  /* ------------------------------------------------------------------------ */
  /*                         CLOSE DESKTOP DROPDOWN                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDesktopDropdownOpen(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  /* ------------------------------------------------------------------------ */
  /*                         CLOSE MENUS ON NAVIGATION                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    setDesktopDropdownOpen(null)
    setDrawerOpen(false)
    setOpenSubmenu(null)
  }, [pathname])

  const toggleSubmenu = (href: string) => {
    setOpenSubmenu((previous) =>
      previous === href ? null : href,
    )
  }

  const toggleDesktopDropdown = (href: string) => {
    setDesktopDropdownOpen((previous) =>
      previous === href ? null : href,
    )
  }

  const textColor = isSolidHeader
    ? 'text-foreground'
    : 'text-white'

  const mutedTextColor = isSolidHeader
    ? 'text-foreground/70 hover:text-foreground'
    : 'text-white/70 hover:text-white'

  return (
    <>
      {/* ================================================================== */}
      {/*                            FIXED HEADER                            */}
      {/* ================================================================== */}

      <div className="fixed inset-x-0 top-0 z-50">
        <header
          className={cn(
            'relative w-full transition-all duration-500 ease-out',
            isSolidHeader
              ? 'border-b border-border bg-background/95 backdrop-blur-xl'
              : 'bg-transparent',
          )}
        >
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-12">
            <div className="relative flex min-h-16 items-center md:min-h-20">

              {/* ========================================================== */}
              {/* LEFT: MENU + BRAND                                        */}
              {/* ========================================================== */}

              <div className="z-10 flex items-center gap-2 sm:gap-3">

                {/* MENU */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className={cn(
                    'flex size-10 items-center justify-center transition-colors duration-300 hover:text-gold sm:size-11',
                    textColor,
                  )}
                  aria-label="Open full menu"
                >
                  <Menu size={21} strokeWidth={1.5} />
                </button>

                {/* BRAND */}
                <Link
                  prefetch={false}
                  href="/"
                  className={cn(
                    'font-serif text-xs font-medium tracking-[0.14em] uppercase transition-colors duration-300 sm:text-sm md:text-base lg:text-lg',
                    textColor,
                  )}
                >
                  The Revamp
                  <span className="ml-1 text-gold">UG</span>
                </Link>
              </div>

              {/* ========================================================== */}
              {/* DESKTOP CENTER: FLOATING NAVIGATION PILL                  */}
              {/* ========================================================== */}

              <div className="absolute left-1/2 hidden -translate-x-1/2 xl:block">
                <nav
                  ref={dropdownRef}
                  aria-label="Main navigation"
                  className={cn(
                    'relative flex items-center rounded-full px-2 py-1.5 transition-all duration-500',
                    isSolidHeader
                      ? 'border border-border bg-foreground text-background shadow-lg shadow-black/5'
                      : 'border border-white/15 bg-black/25 text-white backdrop-blur-xl',
                  )}
                >
                  {primaryNavLinks.map((link) => {
                    const isActive =
                      link.href === '/services'
                        ? pathname.startsWith('/services')
                        : pathname === link.href

                    return (
                      <div
                        key={link.label}
                        className="relative"
                        onMouseEnter={() => {
                          if (link.submenu) {
                            setDesktopDropdownOpen(link.href)
                          }
                        }}
                        onMouseLeave={() => {
                          if (link.submenu) {
                            setDesktopDropdownOpen(null)
                          }
                        }}
                      >
                        {/* ------------------------------------------------ */}
                        {/* STANDARD LINK                                  */}
                        {/* ------------------------------------------------ */}

                        {!link.submenu && (
                          <Link
                            prefetch={false}
                            href={link.href}
                            className={cn(
                              'relative flex items-center rounded-full px-4 py-2.5 text-[10px] font-medium tracking-[0.13em] uppercase transition-all duration-300',

                              isActive
                                ? isSolidHeader
                                  ? 'bg-background text-foreground'
                                  : 'bg-white/15 text-white'
                                : isSolidHeader
                                  ? 'text-background/70 hover:text-background'
                                  : 'text-white/70 hover:text-white',
                            )}
                          >
                            {link.label}

                            {/* ACTIVE INDICATOR */}
                            {isActive && (
                              <span className="absolute inset-x-5 bottom-1 h-px bg-gold" />
                            )}
                          </Link>
                        )}

                        {/* ------------------------------------------------ */}
                        {/* LINK WITH SUBMENU                              */}
                        {/* ------------------------------------------------ */}

                        {link.submenu && (
                          <>
                            <div
                              className={cn(
                                'flex items-center rounded-full transition-all duration-300',

                                isActive
                                  ? isSolidHeader
                                    ? 'bg-background'
                                    : 'bg-white/15'
                                  : '',
                              )}
                            >
                              <Link
                                prefetch={false}
                                href={link.href}
                                className={cn(
                                  'relative px-4 py-2.5 text-[10px] font-medium tracking-[0.13em] uppercase transition-colors',

                                  isActive
                                    ? isSolidHeader
                                      ? 'text-foreground'
                                      : 'text-white'
                                    : isSolidHeader
                                      ? 'text-background/70 hover:text-background'
                                      : 'text-white/70 hover:text-white',
                                )}
                              >
                                {link.label}

                                {isActive && (
                                  <span className="absolute inset-x-4 bottom-1 h-px bg-gold" />
                                )}
                              </Link>

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault()
                                  toggleDesktopDropdown(link.href)
                                }}
                                className={cn(
                                  'mr-1 flex size-7 items-center justify-center transition-colors',

                                  isSolidHeader
                                    ? 'text-background/60 hover:text-background'
                                    : 'text-white/60 hover:text-white',
                                )}
                                aria-label={`Toggle ${link.label} menu`}
                                aria-expanded={
                                  desktopDropdownOpen === link.href
                                }
                              >
                                <ChevronDown
                                  size={13}
                                  strokeWidth={1.5}
                                  className={cn(
                                    'transition-transform duration-300',
                                    desktopDropdownOpen === link.href &&
                                      'rotate-180 text-gold',
                                  )}
                                />
                              </button>
                            </div>

                            {/* ------------------------------------------ */}
                            {/* SERVICES DROPDOWN                           */}
                            {/* ------------------------------------------ */}

                            <div
                              className={cn(
                                'absolute left-0 top-full w-72 pt-4 transition-all duration-300',

                                desktopDropdownOpen === link.href
                                  ? 'visible translate-y-0 opacity-100'
                                  : 'invisible -translate-y-2 opacity-0 pointer-events-none',
                              )}
                            >
                              <div className="overflow-hidden border border-border bg-background shadow-2xl">
                                <div className="border-b border-border px-5 py-4">
                                  <span className="font-serif text-lg">
                                    {link.label}
                                  </span>
                                </div>

                                <div className="py-2">
                                  {link.submenu.map((subitem) => (
                                    <Link
                                      prefetch={false}
                                      key={`${subitem.href}-${subitem.label}`}
                                      href={subitem.href}
                                      className="group flex items-center justify-between px-5 py-3 text-xs tracking-[0.12em] uppercase text-foreground/70 transition-colors hover:bg-muted/50 hover:text-gold"
                                    >
                                      {subitem.label}

                                      <span className="translate-x-0 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                                        →
                                      </span>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </nav>
              </div>

              {/* ========================================================== */}
              {/* RIGHT: ESSENTIAL UTILITIES                                */}
              {/* ========================================================== */}

              <div className="z-10 ml-auto flex items-center gap-0.5 sm:gap-1 md:gap-2">

                {/* SEARCH */}
                <Link
                  prefetch={false}
                  href="/search"
                  className={cn(
                    'hidden size-10 items-center justify-center transition-colors duration-300 hover:text-gold sm:flex sm:size-11',
                    textColor,
                  )}
                  aria-label="Search"
                >
                  <Search size={19} strokeWidth={1.5} />
                </Link>

                {/* ACCOUNT */}
                <Link
                  prefetch={false}
                  href="/account"
                  className={cn(
                    'flex size-10 items-center justify-center transition-colors duration-300 hover:text-gold sm:size-11',
                    textColor,
                  )}
                  aria-label="Account"
                >
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt=""
                      className="size-6 rounded-full object-cover ring-1 ring-current/20"
                    />
                  ) : (
                    <User size={19} strokeWidth={1.5} />
                  )}
                </Link>

                {/* SHOPPING BAG */}
                <Link
                  prefetch={false}
                  href="/cart"
                  className={cn(
                    'relative flex size-10 items-center justify-center transition-colors duration-300 hover:text-gold sm:size-11',
                    textColor,
                  )}
                  aria-label="Shopping Bag"
                >
                  <ShoppingBag size={19} strokeWidth={1.5} />

                  {cartCount > 0 && (
                    <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-gold text-[9px] font-semibold text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* ================================================================== */}
      {/*                          EXPANDED MENU                             */}
      {/* ================================================================== */}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="safe-bottom w-full max-w-md border-border bg-background p-0"
        >
          <SheetTitle className="sr-only">
            Main Navigation Menu
          </SheetTitle>

          <div className="flex h-full flex-col">

            {/* ============================================================ */}
            {/* DRAWER HEADER                                               */}
            {/* ============================================================ */}

            <div className="flex h-20 items-center justify-between border-b border-border px-6">
              <Link
                prefetch={false}
                href="/"
                onClick={() => setDrawerOpen(false)}
                className="font-serif text-lg tracking-[0.12em] uppercase"
              >
                The Revamp
                <span className="ml-1 text-gold">UG</span>
              </Link>
            </div>

            {/* ============================================================ */}
            {/* MAIN NAVIGATION                                             */}
            {/* ============================================================ */}

            <nav
              className="flex flex-1 flex-col overflow-y-auto px-6 py-5"
              aria-label="Expanded menu navigation"
            >
              {allNavLinks.map((link) => {
                const isActive =
                  link.href === '/services'
                    ? pathname.startsWith('/services')
                    : pathname === link.href

                return (
                  <div
                    key={`${link.href}-${link.label}`}
                    className="border-b border-border/40"
                  >
                    {/* SUBMENU */}
                    {link.submenu ? (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleSubmenu(link.href)}
                          aria-expanded={openSubmenu === link.href}
                          className={cn(
                            'flex w-full items-center justify-between py-4 text-left text-sm tracking-[0.12em] uppercase transition-colors',

                            isActive
                              ? 'text-gold'
                              : 'text-foreground/80 hover:text-gold',
                          )}
                        >
                          {link.label}

                          <ChevronDown
                            size={16}
                            strokeWidth={1.5}
                            className={cn(
                              'transition-transform duration-300',
                              openSubmenu === link.href && 'rotate-180',
                            )}
                          />
                        </button>

                        {openSubmenu === link.href && (
                          <div className="mb-3 border-l border-gold bg-muted/20 py-2 pl-5">
                            {link.submenu.map((subitem) => (
                              <Link
                                prefetch={false}
                                key={`${subitem.href}-${subitem.label}`}
                                href={subitem.href}
                                onClick={() => setDrawerOpen(false)}
                                className="block py-2.5 text-xs tracking-[0.12em] uppercase text-foreground/65 transition-colors hover:text-gold"
                              >
                                {subitem.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        prefetch={false}
                        href={link.href}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          'block py-4 text-sm tracking-[0.12em] uppercase transition-colors',

                          isActive
                            ? 'text-gold'
                            : 'text-foreground/80 hover:text-gold',
                        )}
                      >
                        {link.label}
                      </Link>
                    )}
                  </div>
                )
              })}
            </nav>

            {/* ============================================================ */}
            {/* DRAWER UTILITIES                                            */}
            {/* ============================================================ */}

            <div className="border-t border-border px-6 py-5">

              {/* ACCOUNT UTILITIES */}

              <div className="grid grid-cols-2 gap-2">

                <Link
                  prefetch={false}
                  href="/wishlist"
                  onClick={() => setDrawerOpen(false)}
                  className="flex min-h-12 items-center justify-center gap-2 border border-border text-xs tracking-[0.1em] uppercase transition-colors hover:border-gold hover:text-gold"
                >
                  <Heart size={15} strokeWidth={1.5} />
                  Wishlist
                </Link>

                <Link
                  prefetch={false}
                  href="/account"
                  onClick={() => setDrawerOpen(false)}
                  className="flex min-h-12 items-center justify-center gap-2 border border-border text-xs tracking-[0.1em] uppercase transition-colors hover:border-gold hover:text-gold"
                >
                  <User size={15} strokeWidth={1.5} />
                  Account
                </Link>

                <Link
                  prefetch={false}
                  href="/cart"
                  onClick={() => setDrawerOpen(false)}
                  className="flex min-h-12 items-center justify-center gap-2 border border-border text-xs tracking-[0.1em] uppercase transition-colors hover:border-gold hover:text-gold"
                >
                  <ShoppingBag size={15} strokeWidth={1.5} />
                  Bag
                  {cartCount > 0 && ` (${cartCount})`}
                </Link>

                <div className="flex min-h-12 items-center justify-center border border-border">
                  <ThemeSwitcher />
                </div>
              </div>

              {/* NOTIFICATIONS */}

              <div className="mt-3 flex min-h-12 items-center justify-between border border-border px-4">
                <span className="text-xs tracking-[0.1em] uppercase text-foreground/70">
                  Notifications
                </span>

                <NotificationBell className="size-10 text-foreground" />
              </div>

              {/* CLIENT ACTIONS */}

              <div className="mt-5 grid gap-2">

                <Link
                  prefetch={false}
                  href="/client/tickets"
                  onClick={() => setDrawerOpen(false)}
                  className="flex min-h-12 items-center justify-center border border-border px-5 text-xs tracking-[0.12em] uppercase transition-colors hover:border-gold hover:text-gold"
                >
                  Support Tickets
                </Link>

                <Link
                  prefetch={false}
                  href="/book-consultation"
                  onClick={() => setDrawerOpen(false)}
                  className="flex min-h-12 items-center justify-center bg-foreground px-5 text-xs tracking-[0.12em] uppercase text-background transition-colors hover:bg-gold hover:text-white"
                >
                  Book a Consultation
                </Link>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
     


