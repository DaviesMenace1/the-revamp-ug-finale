'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  ArrowUpRight,
  ChevronDown,
  Facebook,
  Heart,
  Instagram,
  Linkedin,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'

import NotificationBell from '@/components/notifications/notification-bell'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { useCart } from '@/lib/context/cart-context'
import { cn } from '@/lib/utils'

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

interface NavLink {
  label: string
  href: string
  description?: string
  submenu?: NavLink[]
}

/* -------------------------------------------------------------------------- */
/* PRIMARY NAVIGATION                                                         */
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

/* -------------------------------------------------------------------------- */
/* EXPANDED MENU                                                              */
/* -------------------------------------------------------------------------- */

const exploreLinks: NavLink[] = [
  {
    label: 'Source With Revamp',
    href: '/source-with-revamp',
    description: 'Global sourcing and procurement.',
  },
  {
    label: 'Trade Program',
    href: '/trade-program',
    description: 'For designers and industry professionals.',
  },
  {
    label: 'Membership',
    href: '/membership-program',
    description: 'A closer relationship with the world of Revamp.',
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
    icon: Instagram,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.snapchat.com/add/ree_onit?share_id=llRDQ3VnVrE&locale=en-US',
    icon: Linkedin,
  },
  {
    label: 'Facebook',
    href: 'https://www.tiktok.com/@revamp_ree?_r=1&_t=ZS-986bYbyqHDg
',
    icon: Facebook,
  },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { user } = useUser()

  const CartContext = useCart()
  const cartCount = CartContext?.cartCount ?? 0

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [desktopDropdownOpen, setDesktopDropdownOpen] =
    useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)

  const isHome = pathname === '/'

  /* ------------------------------------------------------------------------ */
  /* SCROLL STATE                                                             */
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
  /* CLOSE DROPDOWNS                                                          */
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

  useEffect(() => {
    setDesktopDropdownOpen(null)
    setMenuOpen(false)
  }, [pathname])

  const headerDark = !scrolled && isHome

  const navText = headerDark
    ? 'text-white/75 hover:text-white'
    : 'text-foreground/70 hover:text-foreground'

  const iconText = headerDark
    ? 'text-white hover:text-gold'
    : 'text-foreground hover:text-gold'

  return (
    <>
      {/* ==================================================================== */}
      {/* MAIN HEADER                                                         */}
      {/* ==================================================================== */}

      <div className="fixed inset-x-0 top-0 z-50">

        <header
          className={cn(
            'relative w-full transition-all duration-500',
            scrolled || !isHome
              ? 'border-b border-border/70 bg-background/95 shadow-sm backdrop-blur-xl'
              : 'bg-transparent',
          )}
        >
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-14">

            <div className="grid min-h-[72px] grid-cols-[1fr_auto_1fr] items-center md:min-h-[82px]">

              {/* ============================================================ */}
              {/* LEFT: BRAND                                                  */}
              {/* ============================================================ */}

              <div className="flex items-center justify-start">

                <Link
                  prefetch={false}
                  href="/"
                  className={cn(
                    'font-serif text-[15px] tracking-[0.16em] uppercase transition-colors sm:text-lg lg:text-xl',
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
              {/* CENTER: PRIMARY NAV                                         */}
              {/* ============================================================ */}

              <nav
                ref={dropdownRef}
                className="hidden items-center gap-7 lg:flex xl:gap-9"
                aria-label="Main navigation"
              >
                {primaryNavLinks.map((link) => {
                  const isActive =
                    link.href === '/portfolio'
                      ? pathname.startsWith('/portfolio')
                      : pathname === link.href ||
                        pathname.startsWith(`${link.href}/`)

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
                      <div className="flex items-center">

                        <Link
                          prefetch={false}
                          href={link.href}
                          className={cn(
                            'relative py-8 font-sans text-[10px] font-medium uppercase tracking-[0.14em] transition-colors xl:text-[11px]',
                            navText,
                            isActive && 'text-gold',
                          )}
                        >
                          {link.label}

                          {isActive && (
                            <span className="absolute bottom-[21px] left-0 h-px w-full bg-gold" />
                          )}
                        </Link>

                        {link.submenu && (
                          <button
                            onClick={() => {
                              setDesktopDropdownOpen((current) =>
                                current === link.href
                                  ? null
                                  : link.href,
                              )
                            }}
                            className={cn(
                              'ml-1 flex h-8 w-6 items-center justify-center transition-colors',
                              navText,
                            )}
                            aria-label={`Open ${link.label} menu`}
                          >
                            <ChevronDown
                              size={13}
                              className={cn(
                                'transition-transform duration-300',
                                desktopDropdownOpen === link.href &&
                                  'rotate-180 text-gold',
                              )}
                            />
                          </button>
                        )}

                      </div>

                      {/* ==================================================== */}
                      {/* EDITORIAL SERVICES DROPDOWN                         */}
                      {/* ==================================================== */}

                      {link.submenu && (
                        <div
                          className={cn(
                            'absolute left-1/2 top-full w-[520px] -translate-x-1/2 pt-3 transition-all duration-300',
                            desktopDropdownOpen === link.href
                              ? 'visible translate-y-0 opacity-100'
                              : 'invisible -translate-y-2 opacity-0 pointer-events-none',
                          )}
                        >
                          <div className="overflow-hidden border border-border bg-background shadow-2xl">

                            <div className="grid grid-cols-[180px_1fr]">

                              {/* LEFT EDITORIAL PANEL */}

                              <div className="bg-foreground px-6 py-7 text-background">

                                <p className="mb-4 text-[9px] uppercase tracking-[0.22em] text-background/55">
                                  The Revamp UG
                                </p>

                                <h3 className="font-serif text-2xl leading-tight">
                                  Designed
                                  <br />
                                  without
                                  <br />
                                  compromise.
                                </h3>

                                <Link
                                  href="/services"
                                  className="mt-7 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-gold"
                                >
                                  View Services
                                  <ArrowUpRight size={14} />
                                </Link>

                              </div>

                              {/* SERVICE LINKS */}

                              <div className="divide-y divide-border/60">

                                {link.submenu.map((item) => (
                                  <Link
                                    key={item.label}
                                    prefetch={false}
                                    href={item.href}
                                    className="group flex items-center justify-between px-7 py-5 transition-colors hover:bg-muted/40"
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
                                      className="text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold"
                                    />

                                  </Link>
                                ))}

                              </div>

                            </div>

                          </div>
                        </div>
                      )}

                    </div>
                  )
                })}
              </nav>

              {/* ============================================================ */}
              {/* RIGHT: ACTIONS                                              */}
              {/* ============================================================ */}

              <div className="flex items-center justify-end gap-0.5 sm:gap-1">

                {/* Search */}

                <Link
                  prefetch={false}
                  href="/search"
                  className={cn(
                    'hidden size-10 items-center justify-center transition-colors sm:flex',
                    iconText,
                  )}
                  aria-label="Search"
                >
                  <Search size={18} />
                </Link>

                {/* Theme stays permanently in navbar */}

                <div className="flex size-10 items-center justify-center">
                  <ThemeSwitcher />
                </div>

                {/* Notifications */}

                <div className="hidden sm:block">
                  <NotificationBell
                    className={cn(
                      'size-10',
                      headerDark
                        ? 'text-white'
                        : 'text-foreground',
                    )}
                  />
                </div>

                {/* Wishlist */}

                <Link
                  prefetch={false}
                  href="/wishlist"
                  className={cn(
                    'hidden size-10 items-center justify-center transition-colors xl:flex',
                    iconText,
                  )}
                  aria-label="Wishlist"
                >
                  <Heart size={18} />
                </Link>

                {/* Account */}

                <Link
                  prefetch={false}
                  href="/account"
                  className={cn(
                    'flex size-10 items-center justify-center transition-colors',
                    iconText,
                  )}
                  aria-label="Account"
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
                  prefetch={false}
                  href="/cart"
                  className={cn(
                    'relative flex size-10 items-center justify-center transition-colors',
                    iconText,
                  )}
                  aria-label="Shopping cart"
                >
                  <ShoppingBag size={18} />

                  {cartCount > 0 && (
                    <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-gold text-[8px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* ========================================================== */}
                {/* FLOATING MENU BUTTON                                      */}
                {/* Available on tablet AND desktop                           */}
                {/* ========================================================== */}

                <button
                  onClick={() => setMenuOpen(true)}
                  className={cn(
                    'ml-1 flex size-11 items-center justify-center border transition-all duration-300',
                    headerDark
                      ? 'border-white/20 bg-black/10 text-white hover:border-gold hover:text-gold'
                      : 'border-border bg-background text-foreground hover:border-gold hover:text-gold',
                  )}
                  aria-label="Open full navigation"
                >
                  <Menu size={20} />
                </button>

              </div>

            </div>

          </div>
        </header>

        {/* ================================================================= */}
        {/* HANGING SOCIAL EXTENSION                                          */}
        {/* Gensler inspired but adapted for Revamp                          */}
        {/* ================================================================= */}

        <div className="absolute right-6 top-full hidden lg:right-10 lg:flex xl:right-14">

          <div
            className={cn(
              'flex overflow-hidden border-x border-b shadow-lg backdrop-blur-xl',
              headerDark
                ? 'border-white/10 bg-black/75'
                : 'border-border bg-background/95',
            )}
          >
            {socialLinks.map((social) => {
              const Icon = social.icon

              return (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  className={cn(
                    'flex size-11 items-center justify-center border-r last:border-r-0 transition-all',
                    headerDark
                      ? 'border-white/10 text-white/70 hover:bg-white hover:text-black'
                      : 'border-border text-foreground/70 hover:bg-foreground hover:text-background',
                  )}
                  aria-label={social.label}
                >
                  <Icon size={16} />
                </Link>
              )
            })}
          </div>

        </div>

      </div>

      {/* ==================================================================== */}
      {/* EXPANDED EDITORIAL MENU                                             */}
      {/* ==================================================================== */}

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>

        <SheetContent
          side="right"
          className="w-full max-w-none overflow-hidden border-l border-border bg-background p-0 sm:max-w-[760px] lg:max-w-[900px]"
        >

          <SheetTitle className="sr-only">
            The Revamp UG Navigation
          </SheetTitle>

          <div className="flex h-full flex-col">

            {/* ============================================================= */}
            {/* MENU HEADER                                                   */}
            {/* ============================================================= */}

            <div className="flex min-h-[82px] items-center justify-between border-b border-border px-6 sm:px-10">

              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="font-serif text-xl tracking-[0.14em] uppercase sm:text-2xl"
              >
                The Revamp
                <span className="ml-1 text-gold">UG</span>
              </Link>

              <button
                onClick={() => setMenuOpen(false)}
                className="flex size-11 items-center justify-center border border-border transition-colors hover:border-gold hover:text-gold"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>

            </div>

            {/* ============================================================= */}
            {/* MENU BODY                                                     */}
            {/* ============================================================= */}

            <div className="grid flex-1 overflow-y-auto lg:grid-cols-[1.25fr_0.75fr]">

              {/* =========================================================== */}
              {/* PRIMARY WORLD                                              */}
              {/* =========================================================== */}

              <div className="px-6 py-10 sm:px-10 lg:px-14 lg:py-14">

                <p className="mb-7 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Explore The Revamp
                </p>

                <nav className="space-y-1">

                  {primaryNavLinks.map((link) => (
                    <Link
                      key={link.label}
                      prefetch={false}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        'group flex items-center justify-between border-b border-border/60 py-5 font-serif text-3xl transition-colors sm:text-4xl lg:text-5xl',
                        pathname.startsWith(link.href)
                          ? 'text-gold'
                          : 'hover:text-gold',
                      )}
                    >
                      {link.label}

                      <ArrowUpRight
                        size={20}
                        className="opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100"
                      />

                    </Link>
                  ))}

                </nav>

                {/* Secondary */}

                <div className="mt-12">

                  <p className="mb-5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    More from Revamp
                  </p>

                  <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">

                    {exploreLinks.map((link) => (
                      <Link
                        key={link.label}
                        prefetch={false}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-center justify-between border-b border-border/50 py-3 text-sm transition-colors hover:text-gold"
                      >
                        {link.label}

                        <ArrowUpRight
                          size={14}
                          className="opacity-40 transition-all group-hover:text-gold"
                        />
                      </Link>
                    ))}

                  </div>

                </div>

              </div>

              {/* =========================================================== */}
              {/* RIGHT EDITORIAL PANEL                                       */}
              {/* =========================================================== */}

              <div className="flex flex-col border-t border-border bg-muted/20 px-6 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:px-12 lg:py-14">

                <div>

                  <p className="mb-6 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Begin a project
                  </p>

                  <h2 className="font-serif text-3xl leading-tight lg:text-4xl">
                    The architecture
                    <br />
                    of refined living.
                  </h2>

                  <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
                    From the first conversation to the final installation,
                    we create considered spaces and experiences shaped around
                    your world.
                  </p>

                  <Link
                    prefetch={false}
                    href="/book-consultation"
                    onClick={() => setMenuOpen(false)}
                    className="mt-8 inline-flex min-h-12 items-center gap-3 bg-foreground px-6 text-[10px] uppercase tracking-[0.16em] text-background transition-colors hover:bg-gold hover:text-white"
                  >
                    Book a Consultation
                    <ArrowUpRight size={15} />
                  </Link>

                </div>

                <div className="mt-12 border-t border-border pt-8">

                  <p className="mb-5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Need something else?
                  </p>

                  <div className="space-y-3">

                    {supportLinks.map((link) => (
                      <Link
                        key={link.label}
                        prefetch={false}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between text-sm text-foreground/75 transition-colors hover:text-gold"
                      >
                        {link.label}
                        <ArrowUpRight size={14} />
                      </Link>
                    ))}

                  </div>

                </div>

                {/* Social */}

                <div className="mt-auto pt-12">

                  <p className="mb-4 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Follow our world
                  </p>

                  <div className="flex gap-2">

                    {socialLinks.map((social) => {
                      const Icon = social.icon

                      return (
                        <Link
                          key={social.label}
                          href={social.href}
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
    </>
  )
}
