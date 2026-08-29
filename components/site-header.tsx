'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

import {
  ArrowUpRight,
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'

import {
  FaInstagram,
  FaSnapchatGhost,
  FaTiktok,
} from 'react-icons/fa'

import NotificationBell from '@/components/notifications/notification-bell'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { useCart } from '@/lib/context/cart-context'
import { cn } from '@/lib/utils'

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

/* ========================================================================== */
/* TYPES                                                                      */
/* ========================================================================== */

interface NavLink {
  label: string
  href: string
  description?: string
  submenu?: NavLink[]
}

/* ========================================================================== */
/* NAVIGATION                                                                 */
/* ========================================================================== */

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

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/therevamp_ug?igsh=Nnl3YnY5NGN6eDht',
    icon: FaInstagram,
  },
  {
    label: 'Snapchat',
    href: 'https://www.snapchat.com/add/ree_onit?share_id=llRDQ3VnVrE&locale=en-US',
    icon: FaSnapchatGhost,
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@revamp_ree?_r=1&_t=ZS-986bYbyqHDg',
    icon: FaTiktok,
  },
]

/* ========================================================================== */
/* COMPONENT                                                                  */
/* ========================================================================== */

export function SiteHeader() {
  const pathname = usePathname()
  const { user } = useUser()

  const cart = useCart()
  const cartCount = cart?.cartCount ?? 0

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)

  const servicesRef = useRef<HTMLDivElement>(null)

  const isHome = pathname === '/'
  const transparentHeader = isHome && !scrolled

  /* ------------------------------------------------------------------------ */
  /* SCROLL                                                                   */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30)
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
    setMenuOpen(false)
    setServicesOpen(false)
  }, [pathname])

  /* ------------------------------------------------------------------------ */
  /* CLICK OUTSIDE                                                            */
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
  /* STYLES                                                                   */
  /* ------------------------------------------------------------------------ */

  const navColor = transparentHeader
    ? 'text-white/75 hover:text-white'
    : 'text-foreground/70 hover:text-foreground'

  const iconColor = transparentHeader
    ? 'text-white hover:text-gold'
    : 'text-foreground hover:text-gold'

  const headerBackground = transparentHeader
    ? 'bg-transparent'
    : 'border-b border-border/60 bg-background/95 shadow-sm backdrop-blur-xl'

  return (
    <>
      {/* ==================================================================== */}
      {/* HEADER                                                              */}
      {/* ==================================================================== */}

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          headerBackground,
        )}
      >
        <div className="mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-10 xl:px-14">

          <div className="grid h-[68px] grid-cols-[1fr_auto] items-center lg:h-[82px] lg:grid-cols-[1fr_auto_1fr]">

            {/* ============================================================= */}
            {/* BRAND                                                         */}
            {/* ============================================================= */}

            <div className="flex items-center">

              <Link
                href="/"
                prefetch={false}
                className={cn(
                  'font-serif text-[14px] uppercase tracking-[0.18em] transition-colors sm:text-[15px] lg:text-[18px]',
                  transparentHeader
                    ? 'text-white'
                    : 'text-foreground',
                )}
              >
                The Revamp
                <span className="ml-1 text-gold">UG</span>
              </Link>

            </div>

            {/* ============================================================= */}
            {/* DESKTOP NAVIGATION                                            */}
            {/* ============================================================= */}

            <nav
              className="hidden items-center gap-7 xl:gap-9 lg:flex"
              aria-label="Primary navigation"
            >
              {primaryNavLinks.map((link) => {
                const active =
                  link.href === '/portfolio'
                    ? pathname.startsWith('/portfolio')
                    : pathname === link.href ||
                      pathname.startsWith(`${link.href}/`)

                if (link.submenu) {
                  return (
                    <div
                      key={link.label}
                      ref={servicesRef}
                      className="relative"
                    >
                      <button
                        onClick={() => setServicesOpen(!servicesOpen)}
                        className={cn(
                          'flex items-center gap-1.5 py-8 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors xl:text-[11px]',
                          navColor,
                          active && 'text-gold',
                        )}
                      >
                        {link.label}

                        <ChevronDown
                          size={13}
                          className={cn(
                            'transition-transform duration-300',
                            servicesOpen && 'rotate-180 text-gold',
                          )}
                        />
                      </button>

                      {/* SERVICES DROPDOWN */}

                      <div
                        className={cn(
                          'absolute left-1/2 top-full w-[650px] -translate-x-1/2 pt-3 transition-all duration-300',
                          servicesOpen
                            ? 'visible translate-y-0 opacity-100'
                            : 'invisible -translate-y-2 pointer-events-none opacity-0',
                        )}
                      >
                        <div className="overflow-hidden border border-border bg-background shadow-2xl">

                          <div className="grid grid-cols-[220px_1fr]">

                            {/* Editorial side */}

                            <div className="bg-foreground px-8 py-9 text-background">

                              <p className="text-[9px] uppercase tracking-[0.24em] text-background/50">
                                The Revamp UG
                              </p>

                              <h3 className="mt-5 font-serif text-3xl leading-[1.1]">
                                Designed
                                <br />
                                around
                                <br />
                                your world.
                              </h3>

                              <Link
                                href="/services"
                                onClick={() => setServicesOpen(false)}
                                className="mt-10 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-gold"
                              >
                                View all services
                                <ArrowUpRight size={15} />
                              </Link>

                            </div>

                            {/* Links */}

                            <div className="divide-y divide-border/60">

                              {link.submenu.map((item) => (
                                <Link
                                  key={item.label}
                                  href={item.href}
                                  prefetch={false}
                                  onClick={() => setServicesOpen(false)}
                                  className="group flex items-center justify-between px-8 py-5 transition-colors hover:bg-muted/40"
                                >
                                  <div>
                                    <p className="font-serif text-xl transition-colors group-hover:text-gold">
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
                                    className="text-muted-foreground transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-gold"
                                  />
                                </Link>
                              ))}

                            </div>

                          </div>

                        </div>
                      </div>

                    </div>
                  )
                }

                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    prefetch={false}
                    className={cn(
                      'relative py-8 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors xl:text-[11px]',
                      navColor,
                      active && 'text-gold',
                    )}
                  >
                    {link.label}

                    {active && (
                      <span className="absolute bottom-[22px] left-0 h-px w-full bg-gold" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* ============================================================= */}
            {/* ACTIONS                                                       */}
            {/* ============================================================= */}

            <div className="flex items-center justify-end gap-1">

              {/* Desktop search */}

              <Link
                href="/search"
                prefetch={false}
                aria-label="Search"
                className={cn(
                  'hidden size-10 items-center justify-center transition-colors md:flex',
                  iconColor,
                )}
              >
                <Search size={18} />
              </Link>

              {/* Theme */}

              <div className="hidden size-10 items-center justify-center sm:flex">
                <ThemeSwitcher />
              </div>

              {/* Notifications */}

              <div className="hidden md:block">
                <NotificationBell
                  className={cn(
                    'size-10',
                    transparentHeader
                      ? 'text-white'
                      : 'text-foreground',
                  )}
                />
              </div>

              {/* Wishlist */}

              <Link
                href="/wishlist"
                prefetch={false}
                aria-label="Wishlist"
                className={cn(
                  'hidden size-10 items-center justify-center xl:flex',
                  iconColor,
                )}
              >
                <Heart size={18} />
              </Link>

              {/* Account */}

              <Link
                href="/account"
                prefetch={false}
                aria-label="Account"
                className={cn(
                  'hidden size-10 items-center justify-center transition-colors sm:flex',
                  iconColor,
                )}
              >
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt=""
                    className="size-6 rounded-full object-cover"
                  />
                ) : (
                  <User size={18} />
                )}
              </Link>

              {/* Cart */}

              <Link
                href="/cart"
                prefetch={false}
                aria-label="Shopping cart"
                className={cn(
                  'relative flex size-10 items-center justify-center transition-colors',
                  iconColor,
                )}
              >
                <ShoppingBag size={18} />

                {cartCount > 0 && (
                  <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-gold text-[8px] font-bold text-white">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile / Main menu */}

              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation"
                className={cn(
                  'ml-1 flex size-11 items-center justify-center border transition-all duration-300',
                  transparentHeader
                    ? 'border-white/20 text-white hover:border-gold hover:text-gold'
                    : 'border-border text-foreground hover:border-gold hover:text-gold',
                )}
              >
                <Menu size={20} />
              </button>

            </div>

          </div>

        </div>
      </header>

      {/* ==================================================================== */}
      {/* FLOATING SOCIAL BUBBLE                                               */}
      {/* This is intentionally FIXED and independent from the header          */}
      {/* ==================================================================== */}

      <div className="fixed right-4 top-[88px] z-40 hidden lg:block xl:right-8">

        <div className="flex overflow-hidden rounded-full border border-border bg-background/95 shadow-xl backdrop-blur-xl">

          {socialLinks.map((social) => {
            const Icon = social.icon

            return (
              <Link
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex size-11 items-center justify-center border-r border-border last:border-r-0 transition-all hover:bg-foreground hover:text-background"
              >
                <Icon size={16} />
              </Link>
            )
          })}

        </div>

      </div>

      {/* ==================================================================== */}
      {/* FULL NAVIGATION MENU                                                 */}
      {/* ==================================================================== */}

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>

        <SheetContent
          side="right"
          className="h-[100dvh] w-full max-w-none overflow-hidden border-none bg-background p-0 md:max-w-[680px] xl:max-w-[820px]"
        >

          <SheetTitle className="sr-only">
            The Revamp UG Navigation
          </SheetTitle>

          <div className="flex h-full flex-col">

            {/* ============================================================= */}
            {/* MENU HEADER                                                   */}
            {/* ============================================================= */}

            <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-border px-5 sm:px-7 lg:h-[82px] lg:px-10">

              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="font-serif text-[15px] uppercase tracking-[0.18em] sm:text-lg"
              >
                The Revamp
                <span className="ml-1 text-gold">UG</span>
              </Link>

              <div className="flex items-center gap-2">

                {/* Mobile theme */}

                <div className="flex size-10 items-center justify-center sm:hidden">
                  <ThemeSwitcher />
                </div>

                {/* Close */}

                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close navigation"
                  className="flex size-10 items-center justify-center border border-border transition-colors hover:border-gold hover:text-gold"
                >
                  <X size={19} />
                </button>

              </div>

            </div>

            {/* ============================================================= */}
            {/* MENU CONTENT                                                  */}
            {/* ============================================================= */}

            <div className="flex-1 overflow-y-auto">

              <div className="grid lg:min-h-full lg:grid-cols-[1.15fr_0.85fr]">

                {/* ========================================================= */}
                {/* LEFT / PRIMARY NAV                                        */}
                {/* ========================================================= */}

                <div className="px-5 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-12">

                  <p className="mb-5 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                    Explore The Revamp
                  </p>

                  {/* Primary links */}

                  <nav className="border-t border-border">

                    {primaryNavLinks.map((link) => {
                      const active =
                        pathname === link.href ||
                        pathname.startsWith(`${link.href}/`)

                      return (
                        <Link
                          key={link.label}
                          href={link.href}
                          prefetch={false}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            'group flex min-h-[58px] items-center justify-between border-b border-border py-3 font-serif text-[24px] transition-colors sm:text-[27px] lg:text-[30px]',
                            active
                              ? 'text-gold'
                              : 'hover:text-gold',
                          )}
                        >
                          {link.label}

                          <ArrowUpRight
                            size={17}
                            className="text-muted-foreground transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-gold"
                          />
                        </Link>
                      )
                    })}

                  </nav>

                  {/* More from Revamp */}

                  <div className="mt-8">

                    <p className="mb-4 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                      More From Revamp
                    </p>

                    <div className="grid border-t border-border sm:grid-cols-2">

                      {exploreLinks.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          prefetch={false}
                          onClick={() => setMenuOpen(false)}
                          className="flex min-h-[52px] items-center justify-between border-b border-border py-3 pr-2 text-sm transition-colors hover:text-gold sm:mr-6"
                        >
                          {link.label}

                          <ArrowUpRight size={14} />
                        </Link>
                      ))}

                    </div>

                  </div>

                  {/* Mobile quick actions */}

                  <div className="mt-8 grid grid-cols-2 gap-3 lg:hidden">

                    <Link
                      href="/search"
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-[48px] items-center justify-center gap-2 border border-border text-[10px] uppercase tracking-[0.14em]"
                    >
                      <Search size={15} />
                      Search
                    </Link>

                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-[48px] items-center justify-center gap-2 border border-border text-[10px] uppercase tracking-[0.14em]"
                    >
                      <User size={15} />
                      Account
                    </Link>

                  </div>

                </div>

                {/* ========================================================= */}
                {/* RIGHT / EDITORIAL PANEL                                   */}
                {/* ========================================================= */}

                <div className="border-t border-border bg-muted/20 px-5 py-8 sm:px-7 lg:border-l lg:border-t-0 lg:px-10 lg:py-12">

                  <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                    Begin a project
                  </p>

                  <h2 className="mt-4 max-w-md font-serif text-[28px] leading-[1.1] sm:text-4xl lg:text-[42px]">
                    The architecture
                    <br />
                    of refined living.
                  </h2>

                  <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
                    From the first conversation to the final installation,
                    we create considered spaces and experiences shaped
                    around your world.
                  </p>

                  <Link
                    href="/book-consultation"
                    onClick={() => setMenuOpen(false)}
                    className="mt-7 inline-flex min-h-[50px] items-center gap-3 bg-foreground px-6 text-[10px] uppercase tracking-[0.16em] text-background transition-colors hover:bg-gold hover:text-white"
                  >
                    Book a Consultation
                    <ArrowUpRight size={15} />
                  </Link>

                  {/* Support */}

                  <div className="mt-9 border-t border-border pt-7">

                    <p className="mb-4 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                      Need Something Else?
                    </p>

                    <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-1">

                      {supportLinks.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          prefetch={false}
                          onClick={() => setMenuOpen(false)}
                          className="flex min-h-[42px] items-center justify-between border-b border-border/60 text-sm text-foreground/75 transition-colors hover:text-gold"
                        >
                          {link.label}

                          <ArrowUpRight size={14} />
                        </Link>
                      ))}

                    </div>

                  </div>

                  {/* Social */}

                  <div className="mt-8">

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
                            aria-label={social.label}
                            className="flex size-10 items-center justify-center border border-border transition-colors hover:border-gold hover:text-gold"
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

          </div>

        </SheetContent>

      </Sheet>
    </>
  )
}
