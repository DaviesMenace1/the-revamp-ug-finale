
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

import {
  ArrowUpRight,
  ChevronDown,
  Heart,
  ShoppingBag,
  User,
} from '@/components/ui/luxury-icons'

import { FaInstagram, FaSnapchatGhost, FaTiktok } from '@/components/ui/luxury-icons'

import NotificationBell from '@/components/notifications/notification-bell'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { useCart } from '@/lib/context/cart-context'
import { cn } from '@/lib/utils'
import { LuxuryAccountIcon, LuxuryBagIcon, LuxuryCloseIcon, LuxuryMenuIcon, LuxurySearchIcon, LuxuryBellIcon } from '@/components/ui/luxury-nav-icons'

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

interface NavLink {
  label: string
  href: string
  description?: string
  submenu?: NavLink[]
}

/* -------------------------------------------------------------------------- */
/* NAVIGATION DATA                                                            */
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
        description: 'Spaces shaped around the way you live.',
      },
      {
        label: 'Architecture',
        href: '/services/architecture',
        description: 'Architecture with enduring intention.',
      },
      {
        label: 'Custom Services',
        href: '/custom-services',
        description: 'Tailored solutions for exceptional projects.',
      },
      {
        label: 'All Services',
        href: '/services',
        description: 'Explore the complete Revamp offering.',
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

const exploreLinks: NavLink[] = [
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
]

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/therevamp_ug', icon: FaInstagram },
  { label: 'Snapchat', href: 'https://www.snapchat.com/add/therevamp_ug', icon: FaSnapchatGhost },
  { label: 'TikTok', href: 'https://www.tiktok.com/@revamp_ree', icon: FaTiktok },
]

const supportLinks: NavLink[] = [
  {
    label: 'FAQs',
    href: '/faqs',
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

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export function SiteHeader() {
  const pathname = usePathname()
  const { user, isSignedIn } = useUser()

  const cart = useCart()
  const cartCount = cart?.cartCount ?? 0

  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)

  const servicesRef = useRef<HTMLDivElement>(null)

  const isHome = pathname === '/'
  const headerDark = isHome && !scrolled

  /* ------------------------------------------------------------------------ */
  /* SCROLL                                                                   */
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
  /* CLOSE MENUS ON ROUTE CHANGE                                              */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    setMobileMenuOpen(false)
    setDesktopMenuOpen(false)
    setServicesOpen(false)
  }, [pathname])

  /* ------------------------------------------------------------------------ */
  /* ESCAPE DESKTOP MENU                                                      */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDesktopMenuOpen(false)
        setServicesOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  /* ------------------------------------------------------------------------ */
  /* SERVICES CLICK OUTSIDE                                                   */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        servicesRef.current &&
        !servicesRef.current.contains(event.target as Node)
      ) {
        setServicesOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  /* ------------------------------------------------------------------------ */
  /* BODY LOCK                                                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (desktopMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [desktopMenuOpen])

  const openAccountAccess = () => window.dispatchEvent(new Event('revamp:open-auth'))

  const navText = headerDark
    ? 'text-white/75 hover:text-white'
    : 'text-foreground/70 hover:text-foreground'

  const iconText = headerDark
    ? 'text-white hover:text-gold'
    : 'text-foreground hover:text-gold'

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'

    if (href === '/portfolio') {
      return pathname.startsWith('/portfolio')
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 w-full transition-all duration-500',
          scrolled || !isHome
            ? 'border-b border-border/70 bg-background/95 shadow-sm backdrop-blur-xl'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-14">

          <div className="grid h-[68px] grid-cols-[1fr_auto] items-center md:h-[76px] lg:grid-cols-[1fr_auto_1fr] lg:h-[82px]">

            {/* ============================================================ */}
            {/* LOGO                                                          */}
            {/* ============================================================ */}

            <div className="flex min-w-0 items-center">

              <Link
                href="/"
                prefetch={false}
                className={cn(
                  'whitespace-nowrap font-serif text-[14px] uppercase tracking-[0.15em] transition-colors sm:text-[16px] lg:text-lg',
                  headerDark
                    ? 'text-white'
                    : 'text-foreground',
                )}
              >
                The Revamp
                <span className="ml-1 text-gold">UG</span>
              </Link>

            </div>

            {/* ============================================================ */}
            {/* DESKTOP NAVIGATION                                            */}
            {/* ============================================================ */}

            <nav
              className="hidden items-center justify-center gap-6 lg:flex xl:gap-8"
              aria-label="Main navigation"
            >
              {primaryNavLinks.map((link) => {

                if (!link.submenu) {
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      prefetch={false}
                      className={cn(
                        'relative py-8 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors xl:text-[11px]',
                        navText,
                        isActive(link.href) && 'text-gold',
                      )}
                    >
                      {link.label}

                      {isActive(link.href) && (
                        <span className="absolute bottom-[22px] left-0 h-px w-full bg-gold" />
                      )}
                    </Link>
                  )
                }

                return (
                  <div
                    key={link.label}
                    ref={servicesRef}
                    className="relative"
                    onMouseEnter={() => setServicesOpen(true)}
                    onMouseLeave={() => setServicesOpen(false)}
                  >

                    <button
                      onClick={() => setServicesOpen(!servicesOpen)}
                      className={cn(
                        'flex items-center gap-1 py-8 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors xl:text-[11px]',
                        navText,
                        isActive(link.href) && 'text-gold',
                      )}
                    >
                      {link.label}

                      <ChevronDown
                        size={13}
                        className={cn(
                          'transition-transform duration-300',
                          servicesOpen && 'rotate-180',
                        )}
                      />
                    </button>

                    {/* SERVICES DROPDOWN */}

                    <div
                      className={cn(
                        'absolute left-1/2 top-full w-[560px] -translate-x-1/2 pt-3 transition-all duration-300',
                        servicesOpen
                          ? 'visible translate-y-0 opacity-100'
                          : 'invisible -translate-y-2 pointer-events-none opacity-0',
                      )}
                    >

                      <div className="grid grid-cols-[190px_minmax(0,1fr)] overflow-hidden border border-border bg-background shadow-2xl">

                        <div className="bg-foreground px-7 py-8 text-background">

                          <p className="text-[9px] uppercase tracking-[0.22em] text-background/50">
                            The Revamp UG
                          </p>

                          <h3 className="mt-5 font-serif text-[27px] leading-[1.05]">
                            Designed
                            <br />
                            without
                            <br />
                            compromise.
                          </h3>

                          <Link
                            href="/services"
                            className="mt-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-gold"
                          >
                            View Services
                            <ArrowUpRight size={14} />
                          </Link>

                        </div>

                        <div className="divide-y divide-border">

                          {link.submenu.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              className="group flex items-center justify-between px-7 py-5 transition-colors hover:bg-muted/50"
                            >

                              <div>

                                <p className="font-serif text-lg transition-colors group-hover:text-gold">
                                  {item.label}
                                </p>

                                {item.description && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {item.description}
                                  </p>
                                )}

                              </div>

                              <ArrowUpRight
                                size={17}
                                className="text-muted-foreground transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-gold"
                              />

                            </Link>
                          ))}

                        </div>

                      </div>

                    </div>

                  </div>
                )
              })}
            </nav>

            {/* ============================================================ */}
            {/* ACTIONS                                                       */}
            {/* ============================================================ */}

            <div className="flex items-center justify-end gap-0.5 sm:gap-1">

              {/* Search */}

              <Link
                href="/search"
                prefetch={false}
                className={cn(
                  'hidden size-10 items-center justify-center transition-colors sm:flex',
                  iconText,
                )}
                aria-label="Search"
              >
                <LuxurySearchIcon size={19} />
              </Link>

              <div className={cn('flex size-10 items-center justify-center', iconText)}>
                <ThemeSwitcher />
              </div>

              {/* Notifications: visible on mobile and desktop */}
              <div className="order-2 flex lg:order-none">
                <NotificationBell
                  className={cn(
                    'size-10',
                    headerDark
                      ? 'text-white'
                      : 'text-foreground',
                  )}
                />
              </div>

              {/* Wishlist desktop */}

              <Link
                href="/wishlist"
                prefetch={false}
                className={cn(
                  'hidden size-10 items-center justify-center xl:flex',
                  iconText,
                )}
                aria-label="Wishlist"
              >
                <Heart size={18} strokeWidth={1} />
              </Link>

              {/* Account */}

              {isSignedIn ? <Link
                href="/account"
                prefetch={false}
                className={cn(
                  'order-1 flex size-10 shrink-0 items-center justify-center transition-colors md:order-none',
                  iconText,
                )}
                aria-label="Account"
              >
                {user?.imageUrl ? <img src={user.imageUrl} alt="" className="size-5 rounded-full object-cover" /> : <LuxuryAccountIcon size={19} />}
              </Link> : <button type="button" onClick={openAccountAccess} className={cn('order-1 flex size-10 shrink-0 items-center justify-center transition-colors md:order-none', iconText)} aria-label="Open account sign in"><LuxuryAccountIcon size={19} /></button>}

              {/* Cart */}

              <Link
                href="/cart"
                prefetch={false}
                className={cn(
                  'relative order-3 flex size-10 shrink-0 items-center justify-center transition-colors lg:order-none',
                  iconText,
                )}
                aria-label="Shopping cart"
              >
                <LuxuryBagIcon size={19} />

                {cartCount > 0 && (
                  <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-gold text-[8px] font-bold text-white">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {!isSignedIn && <div className={cn('hidden items-center gap-2 pl-2 md:flex', iconText)}>
                <Link href="/sign-in" prefetch={false} className="text-[10px] uppercase tracking-[0.14em] transition-colors hover:text-gold">Sign in</Link>
                <Link href="/sign-up" prefetch={false} className="inline-flex min-h-8 items-center rounded-full border border-current/40 px-3 text-[10px] uppercase tracking-[0.14em] transition-colors hover:border-gold hover:text-gold">Sign up</Link>
              </div>}
              {/* MOBILE / TABLET MENU */}

              <div className="relative order-5 flex shrink-0 items-center lg:order-none lg:hidden">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className={cn(
                    'flex size-10 items-center justify-center border transition-colors',
                    headerDark
                      ? 'border-white/20 text-white'
                      : 'border-border text-foreground',
                  )}
                  aria-label="Open navigation"
                >
                  <LuxuryMenuIcon size={20} />
                </button>
              </div>

              {/* DESKTOP MENU */}

              <button
                onClick={() => setDesktopMenuOpen(true)}
                className={cn(
                  'ml-1 hidden size-11 items-center justify-center border transition-all duration-300 lg:flex',
                  headerDark
                    ? 'border-white/20 bg-black/10 text-white hover:border-gold hover:text-gold'
                    : 'border-border bg-background text-foreground hover:border-gold hover:text-gold',
                )}
                aria-label="Open full navigation"
              >
                <LuxuryMenuIcon size={20} />
              </button>

            </div>

          </div>

        </div>
      </header>

      {/* ================================================================== */}
      {/* MOBILE + TABLET MENU                                               */}
      {/* ================================================================== */}

      <Sheet
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      >

        <SheetContent
          side="right"
          className="w-full overflow-hidden border-l border-border bg-background p-0 sm:max-w-[680px] lg:hidden"
        >

          <SheetTitle className="sr-only">
            The Revamp UG Navigation
          </SheetTitle>

          <div className="flex h-full flex-col">

            {/* MOBILE HEADER */}

            <div className="flex h-[70px] shrink-0 items-center justify-between border-b border-border px-5 sm:px-8">

              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="font-serif text-[15px] uppercase tracking-[0.15em] sm:text-lg"
              >
                The Revamp
                <span className="ml-1 text-gold">UG</span>
              </Link>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex size-10 items-center justify-center border border-border transition-colors hover:border-gold hover:text-gold"
                aria-label="Close navigation"
              >
                <LuxuryCloseIcon size={19} />
              </button>

            </div>

            {/* MENU CONTENT */}

            <div className="flex-1 overflow-y-auto">

              <div className="px-5 py-8 sm:px-8 sm:py-10">

                <p className="mb-5 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                  Explore The Revamp
                </p>

                <nav>

                  {primaryNavLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'group flex items-center justify-between border-b border-border py-4 font-serif text-[28px] leading-none transition-colors sm:text-[34px]',
                        isActive(link.href)
                          ? 'text-gold'
                          : 'hover:text-gold',
                      )}
                    >
                      {link.label}

                      <ArrowUpRight
                        size={18}
                        className="opacity-40 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                      />

                    </Link>
                  ))}

                </nav>

                {/* QUICK ACCOUNT ACTIONS */}
                <div className="mt-8 grid grid-cols-2 gap-2 border-y border-border py-5">
                  {isSignedIn ? <Link href="/account" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center gap-2 border border-border px-3 text-xs uppercase tracking-[0.1em] transition-colors hover:border-gold hover:text-gold"><User className="size-4" aria-hidden="true" />Account</Link> : <button type="button" onClick={() => { setMobileMenuOpen(false); openAccountAccess() }} className="flex min-h-11 items-center gap-2 border border-border px-3 text-left text-xs uppercase tracking-[0.1em] transition-colors hover:border-gold hover:text-gold"><User className="size-4" aria-hidden="true" />Account</button>}
                  <Link href="/wishlist" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center gap-2 border border-border px-3 text-xs uppercase tracking-[0.1em] transition-colors hover:border-gold hover:text-gold"><Heart className="size-4" aria-hidden="true" />Wishlist</Link>
                  <Link href="/cart" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center gap-2 border border-border px-3 text-xs uppercase tracking-[0.1em] transition-colors hover:border-gold hover:text-gold"><ShoppingBag className="size-4" aria-hidden="true" />Cart{cartCount > 0 && <span className="ml-auto text-primary">{cartCount}</span>}</Link>
                  <button type="button" onClick={() => { setMobileMenuOpen(false); window.setTimeout(() => document.querySelector<HTMLButtonElement>('[aria-label^="Notifications"]')?.click(), 50) }} className="flex min-h-11 items-center gap-2 border border-border px-3 text-left text-xs uppercase tracking-[0.1em] transition-colors hover:border-gold hover:text-gold"><LuxuryBellIcon className="size-8" aria-hidden="true" />Alerts</button>
                </div>
                {!isSignedIn && <div className="grid grid-cols-2 gap-2 pt-4"><Link href="/sign-in" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center justify-center border border-border px-3 text-xs uppercase tracking-[0.12em] transition-colors hover:border-gold hover:text-gold">Sign in</Link><Link href="/sign-up" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center justify-center bg-foreground px-3 text-xs uppercase tracking-[0.12em] text-background transition-colors hover:bg-gold hover:text-foreground">Sign up</Link></div>}
                {/* MORE FROM REVAMP */}

                <div className="mt-10">

                  <p className="mb-4 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                    More From Revamp
                  </p>

                  <div className="border-t border-border">

                    {exploreLinks.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between border-b border-border py-4 text-sm transition-colors hover:text-gold"
                      >
                        {link.label}
                        <ArrowUpRight size={15} />
                      </Link>
                    ))}

                  </div>

                </div>

                {/* SUPPORT */}

                <div className="mt-10">

                  <p className="mb-4 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                    Need Something Else?
                  </p>

                  <div className="border-t border-border">

                    {supportLinks.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between border-b border-border py-3.5 text-sm transition-colors hover:text-gold"
                      >
                        {link.label}
                        <ArrowUpRight size={14} />
                      </Link>
                    ))}

                  </div>

                </div>

                {/* CTA */}

                <div className="mt-10 border-t border-border pt-8">

                  <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                    Begin A Project
                  </p>

                  <h2 className="mt-4 max-w-md font-serif text-[32px] leading-[1.05] sm:text-4xl">
                    The architecture
                    <br />
                    of refined living.
                  </h2>

                  <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                    From the first conversation to the final installation,
                    we create considered spaces shaped around your world.
                  </p>

                  <Link
                    href="/book-consultation"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-6 inline-flex min-h-12 items-center gap-3 bg-foreground px-6 text-[10px] uppercase tracking-[0.16em] text-background transition-colors hover:bg-gold"
                  >
                    Book A Consultation
                    <ArrowUpRight size={15} />
                  </Link>

                </div>

                {/* SOCIALS */}

                <div className="mt-10 pb-6">

                  <p className="mb-4 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                    Follow Our World
                  </p>

                  <div className="flex gap-2">

                    {socialLinks.map((social) => {
                      const Icon = social.icon

                      return (
                        <Link
                          key={social.label}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex size-10 items-center justify-center border border-border transition-colors hover:border-gold hover:text-gold"
                          aria-label={social.label}
                        >
                          <Icon size={16} />
                        </Link>
                      )
                    })}

                  </div>

                </div>

              </div>

            </div>

          </div>

        </SheetContent>

      </Sheet>

      {/* ================================================================== */}
      {/* DESKTOP EDITORIAL MEGA MENU                                        */}
      {/* ================================================================== */}

      <div
        className={cn(
          'fixed inset-0 z-[100] hidden lg:block transition-all duration-500',
          desktopMenuOpen
            ? 'visible opacity-100'
            : 'invisible pointer-events-none opacity-0',
        )}
      >

        {/* BACKDROP */}

        <button
          onClick={() => setDesktopMenuOpen(false)}
          className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-[6px]"
          aria-label="Close navigation"
        />

        {/* PANEL */}

        <aside
          className={cn(
            'absolute right-0 top-0 flex h-[100dvh] w-[min(1180px,78vw)] min-w-[900px] max-w-full flex-col overflow-hidden border-l border-border bg-background shadow-2xl transition-transform duration-500 ease-out',
            desktopMenuOpen
              ? 'translate-x-0'
              : 'translate-x-full',
          )}
        >

          {/* ============================================================ */}
          {/* DESKTOP MENU HEADER                                           */}
          {/* ============================================================ */}

          <div className="flex h-[92px] shrink-0 items-center justify-between border-b border-border px-10 xl:px-14">

            <Link
              href="/"
              onClick={() => setDesktopMenuOpen(false)}
              className="font-serif text-xl uppercase tracking-[0.16em]"
            >
              The Revamp
              <span className="ml-1 text-gold">UG</span>
            </Link>

            <button
              onClick={() => setDesktopMenuOpen(false)}
              className="flex size-12 items-center justify-center border border-border transition-colors hover:border-gold hover:text-gold"
              aria-label="Close navigation"
            >
              {/*<X size={21} />*/}
            </button>

          </div>

          {/* ============================================================ */}
          {/* DESKTOP CONTENT                                               */}
          {/* ============================================================ */}

          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">

            {/* LEFT SIDE */}

            <div className="min-w-0 overflow-y-auto px-10 py-12 xl:px-14">

              <p className="mb-7 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Explore The Revamp
              </p>

              <nav className="border-t border-border">

                {primaryNavLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setDesktopMenuOpen(false)}
                    className={cn(
                      'group flex items-center justify-between border-b border-border py-5 font-serif text-3xl leading-none transition-colors xl:text-4xl',
                      isActive(link.href)
                        ? 'text-gold'
                        : 'hover:text-gold',
                    )}
                  >
                    {link.label}

                    <ArrowUpRight
                      size={20}
                      className="opacity-35 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100"
                    />

                  </Link>
                ))}

              </nav>

              {/* MORE */}

              <div className="mt-12">

                <p className="mb-5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  More From Revamp
                </p>

                <div className="grid grid-cols-2 gap-x-8 border-t border-border">

                  {exploreLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setDesktopMenuOpen(false)}
                      className="group flex items-center justify-between border-b border-border py-4 text-sm transition-colors hover:text-gold"
                    >
                      <span>{link.label}</span>

                      <ArrowUpRight
                        size={14}
                        className="opacity-40 transition-all group-hover:translate-x-1 group-hover:-translate-y-1"
                      />
                    </Link>
                  ))}

                </div>

              </div>

              {/* SOCIAL */}

              <div className="mt-12">

                <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Follow Our World
                </p>

                <div className="flex gap-2">

                  {socialLinks.map((social) => {
                    const Icon = social.icon

                    return (
                      <Link
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex size-10 items-center justify-center border border-border transition-colors hover:border-gold hover:text-gold"
                        aria-label={social.label}
                      >
                        <Icon size={16} />
                      </Link>
                    )
                  })}

                </div>

              </div>

            </div>

            {/* RIGHT EDITORIAL PANEL */}

            <div className="min-w-0 overflow-y-auto border-l border-border bg-muted/20 px-10 py-12 xl:px-12">

              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Begin A Project
              </p>

              <h2 className="mt-8 font-serif text-4xl leading-[1.05] xl:text-5xl">
                The architecture
                <br />
                of refined living.
              </h2>

              <p className="mt-7 max-w-md text-sm leading-7 text-muted-foreground">
                From the first conversation to the final installation,
                we create considered spaces and experiences shaped
                around your world.
              </p>

              <Link
                href="/book-consultation"
                onClick={() => setDesktopMenuOpen(false)}
                className="mt-9 inline-flex min-h-[52px] items-center gap-3 bg-foreground px-7 text-[10px] uppercase tracking-[0.16em] text-background transition-colors hover:bg-gold hover:text-white"
              >
                Book A Consultation
                <ArrowUpRight size={16} />
              </Link>

              {/* SUPPORT */}

              <div className="mt-16 border-t border-border pt-8">

                <p className="mb-5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Need Something Else?
                </p>

                <div className="space-y-1">

                  {supportLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setDesktopMenuOpen(false)}
                      className="group flex items-center justify-between border-b border-border/70 py-4 text-sm transition-colors hover:text-gold"
                    >
                      {link.label}

                      <ArrowUpRight
                        size={15}
                        className="opacity-40 transition-all group-hover:translate-x-1 group-hover:-translate-y-1"
                      />
                    </Link>
                  ))}

                </div>

              </div>

            </div>

          </div>

        </aside>

      </div>
    </>
  )
}
