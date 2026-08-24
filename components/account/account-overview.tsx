'use client'

import Link from 'next/link'
import { ArrowUpRight, CalendarDays, Heart, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCart } from '@/lib/context/cart-context' // 👈 Import useCart

type AccountData = Awaited<ReturnType<typeof import('@/lib/account/queries').getAccountOverview>>

// Live Client-Side Cart Count Component
function CartCount({ fallbackCount }: { fallbackCount: number }) {
  const { cartCount } = useCart()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Show live client cartCount once mounted in browser, fallback to server count during SSR
  const displayCount = isMounted ? cartCount : fallbackCount

  return <>{`${displayCount} ${displayCount === 1 ? 'item' : 'items'}`}</>
}

function WishlistCount() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('wishlist')
      const parsed = saved ? JSON.parse(saved) : []
      setCount(Array.isArray(parsed) ? parsed.length : 0)
    } catch {
      setCount(null)
    }
  }, [])

  return <>{count === null ? 'Saved pieces' : `${count} ${count === 1 ? 'piece' : 'pieces'} saved`}</>
}

export function AccountOverview({ data }: { data: NonNullable<AccountData> }) {
  const { user, cartCount: serverCartCount, orders, nextConsultation, membership, loadError } = data
  const firstName = user.firstName || ''
  const greeting = firstName ? `Welcome back, ${firstName}` : 'Welcome back'

  return (
    <div className="flex flex-col gap-14">
      <header className="flex flex-col gap-5 border-b border-border/70 pb-10 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-5">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="size-16 rounded-full object-cover" />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full border border-border font-serif text-2xl text-primary">
              {(firstName || user.email).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Your Revamp account
            </p>
            <h1 className="font-serif text-4xl tracking-tight text-balance md:text-5xl">
              {greeting}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Link
          href="/user-profile"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Manage account <ArrowUpRight className="ml-1 inline size-4" aria-hidden="true" />
        </Link>
      </header>

      {loadError && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <span>{loadError}</span>
          <button type="button" onClick={() => window.location.reload()} className="min-h-11 shrink-0 font-medium underline underline-offset-4">
            Retry
          </button>
        </div>
      )}

      <section className="flex flex-col gap-5" aria-labelledby="shopping-heading">
        <SectionHeading
          id="shopping-heading"
          eyebrow="Shopping"
          title="Everything you love, in one place."
        />
        <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
          {/* 👈 Pass live CartCount component here */}
          <AccountCard
            href="/cart"
            icon={<ShoppingBag aria-hidden="true" />}
            title="Your Cart"
            detail={<CartCount fallbackCount={serverCartCount} />}
          />
          <AccountCard
            href="/wishlist"
            icon={<Heart aria-hidden="true" />}
            title="Saved Pieces"
            detail={<WishlistCount />}
          />
          <AccountCard
            href="/client/orders"
            icon={<ShoppingBag aria-hidden="true" />}
            title="Order History"
            detail={orders.length ? `${orders.length} recent orders` : 'No orders yet'}
          />
        </div>
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="design-heading">
        <SectionHeading
          id="design-heading"
          eyebrow="Your design journey"
          title="A more considered way forward."
        />
        <div className="border border-border p-6 md:p-8">
          <div className="flex flex-col gap-4">
            <p className="max-w-lg font-serif text-2xl leading-tight">
              Your design journey starts here.
            </p>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Considering transforming a space? Our design team is here to help you make the next decision with confidence.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/services"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Explore design services <ArrowUpRight className="ml-1 inline size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/book-consultation"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                Book a consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-14 md:grid-cols-2">
        <section className="flex flex-col gap-5" aria-labelledby="consultation-heading">
          <SectionHeading
            id="consultation-heading"
            eyebrow="Upcoming consultation"
            title="Make space for the conversation."
          />
          <div className="border border-border p-6">
            {nextConsultation ? (
              <div className="flex flex-col gap-3">
                <CalendarDays className="size-5 text-primary" aria-hidden="true" />
                <p className="font-serif text-2xl">{nextConsultation.title}</p>
                <p className="text-sm text-muted-foreground">
                  {nextConsultation.preferredDate?.toLocaleDateString()} · {nextConsultation.status}
                </p>
                <Link href="/client/consultations" className="mt-2 text-sm text-primary hover:underline">
                  View consultation <ArrowUpRight className="ml-1 inline size-4" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="font-serif text-2xl">Speak with our design team.</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Start with a considered conversation about your space and your ambitions.
                </p>
                <Link href="/book-consultation" className="text-sm text-primary hover:underline">
                  Book a consultation <ArrowUpRight className="ml-1 inline size-4" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-5" aria-labelledby="membership-heading">
          <SectionHeading
            id="membership-heading"
            eyebrow="Membership"
            title="A closer relationship with Revamp."
          />
          <div className="border border-border p-6">
            {membership && membership.status === 'active' ? (
              <div className="flex flex-col gap-3">
                <p className="font-serif text-2xl capitalize">
                  {membership.membershipType} membership
                </p>
                <p className="text-sm text-muted-foreground">
                  Active since {membership.startDate.toLocaleDateString()}
                </p>
                <Link href="/membership" className="text-sm text-primary hover:underline">
                  View membership <ArrowUpRight className="ml-1 inline size-4" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="font-serif text-2xl">Discover The Revamp Membership</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Explore a more personal way to access our world of design, objects and experiences.
                </p>
                <Link href="/membership" className="text-sm text-primary hover:underline">
                  Explore benefits <ArrowUpRight className="ml-1 inline size-4" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-5" aria-labelledby="activity-heading">
        <SectionHeading
          id="activity-heading"
          eyebrow="Recent activity"
          title="Your latest moments with Revamp."
        />
        <div className="border border-border p-6">
          <p className="text-sm text-muted-foreground">
            {orders.length || nextConsultation
              ? 'Your account activity will appear here as your journey continues.'
              : 'No recent activity yet. Your orders, consultations and design milestones will appear here.'}
          </p>
        </div>
      </section>
    </div>
  )
}

function SectionHeading({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
      <h2 id={id} className="font-serif text-3xl tracking-tight">{title}</h2>
    </div>
  )
}

function AccountCard({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail: React.ReactNode }) {
  return (
    <Link href={href} className="group flex min-h-36 flex-col justify-between bg-background p-6 transition-colors hover:bg-muted/40">
      <span className="text-primary">{icon}</span>
      <span className="flex flex-col gap-1">
        <span className="font-serif text-2xl">{title}</span>
        <span className="text-sm text-muted-foreground">{detail}</span>
        <span className="mt-2 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
          View <ArrowUpRight className="ml-1 inline size-3" aria-hidden="true" />
        </span>
      </span>
    </Link>
  )
}
