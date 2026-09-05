'use client'

import Link from 'next/link'
import { ArrowRight, CalendarDays, Heart, Package, UserRound, BriefcaseBusiness, ShoppingBag, ShieldCheck, MapPin, Settings, Bell } from '@/components/ui/luxury-icons'
import { useEffect, useState } from 'react'
import { useCart } from '@/lib/context/cart-context'

type AccountData = Awaited<ReturnType<typeof import('@/lib/account/queries').getAccountOverview>>

export function AccountOverview({ data }: { data: NonNullable<AccountData> }) {
  const { user, cartCount: serverCartCount, orders, nextConsultation, membership, loadError, loyalty } = data
  const { cartCount } = useCart()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const firstName = user.firstName || user.email.split('@')[0] || 'Member'
  const displayCartCount = mounted ? cartCount : serverCartCount
  const balance = loyalty?.balancePoints ?? 0
  const nextTier = loyalty?.pointsToNextTier ?? 0
  const progress = loyalty?.nextTier ? Math.min(100, (loyalty.lifetimeEarned / Math.max(1, loyalty.lifetimeEarned + nextTier)) * 100) : 100
  const recentOrder = orders[0]
  const orderStatus = recentOrder?.status ? String(recentOrder.status).replaceAll('_', ' ') : 'No orders yet'
  const formatDate = (value: unknown) => value instanceof Date ? value.toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  const recentOrderImage = (() => {
    if (!recentOrder || !Array.isArray(recentOrder.items)) return ''
    const item = recentOrder.items.find((entry) => typeof entry === 'object' && entry !== null && typeof (entry as { image?: unknown }).image === 'string') as { image?: string } | undefined
    return item?.image || ''
  })()

  return (
    <div className="bg-background">
      {loadError && <div role="status" className="mx-auto max-w-[1440px] border-b border-amber-400/30 bg-amber-50 px-5 py-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100 sm:px-8 lg:px-12">Some account details are temporarily unavailable. You can retry the page.</div>}

      <section className="relative overflow-hidden border-b border-border/70 bg-canvas px-5 pb-8 pt-10 text-foreground sm:px-8 sm:pb-10 lg:px-12 lg:pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(200,166,106,0.18),transparent_32%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1440px]">
          <div className="flex items-center gap-5 sm:gap-7">
            {user.avatar ? <img src={user.avatar} alt="" className="size-20 rounded-full border border-gilded/70 object-cover sm:size-24" /> : <div className="flex size-20 shrink-0 items-center justify-center rounded-full border border-gilded/70 font-serif text-4xl text-gilded sm:size-24 sm:text-5xl">{firstName.charAt(0).toUpperCase()}</div>}
            <div className="min-w-0"><p className="font-serif text-lg text-foreground/70">Welcome back,</p><h1 className="mt-1 truncate font-serif text-4xl font-light leading-none sm:text-5xl">{firstName}</h1><span className="mt-3 inline-flex rounded border border-primary/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-primary">{membership?.status === 'active' ? `${membership.membershipType} member` : 'Signature member'}</span></div>
          </div>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-white/10 sm:grid-cols-[0.8fr_1.2fr]">
            <div className="bg-background/70 p-5 sm:p-6"><p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Loyalty points</p><p className="mt-2 font-serif text-4xl text-foreground sm:text-5xl">{balance.toLocaleString('en-UG')}</p><p className="mt-1 text-sm text-primary">points</p></div>
            <div className="bg-background/70 p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-foreground/85">{loyalty?.nextTier ? `You are ${nextTier.toLocaleString('en-UG')} points away` : 'You have reached our highest tier'}</p><p className="mt-1 text-sm text-muted-foreground">from {loyalty?.nextTier || loyalty?.tier || 'Signature'} tier</p></div><span className="text-xs text-muted-foreground">{balance.toLocaleString('en-UG')} / {(balance + nextTier).toLocaleString('en-UG')}</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-foreground/10"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div><Link href="/membership" className="mt-5 flex min-h-11 items-center justify-between rounded border border-border px-4 text-sm text-foreground/85 transition hover:border-primary hover:text-primary">View membership benefits <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
        <section aria-labelledby="quick-access-heading"><div className="mb-4 flex items-center justify-between"><h2 id="quick-access-heading" className="font-sans text-xs font-medium uppercase tracking-[0.2em]">Quick access</h2><span className="text-xs text-muted-foreground">{displayCartCount} {displayCartCount === 1 ? 'item' : 'items'} in cart</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5"><QuickAccess href="/client/orders" icon={Package} label="Orders" /><QuickAccess href="/wishlist" icon={Heart} label="Wishlist" badge={typeof window !== 'undefined' ? undefined : undefined} /><QuickAccess href="/client/projects" icon={BriefcaseBusiness} label="My projects" /><QuickAccess href="/trade-program" icon={BriefcaseBusiness} label="Trade program" /><QuickAccess href="/client" icon={ShieldCheck} label="Client portal" /></div></section>

        <section className="mt-10" aria-labelledby="recent-order-heading"><div className="mb-4 flex items-center justify-between"><h2 id="recent-order-heading" className="font-sans text-xs font-medium uppercase tracking-[0.2em]">Recent order</h2><Link href="/client/orders" className="text-xs text-muted-foreground transition hover:text-foreground">View all orders <ArrowRight className="ml-1 inline size-3" aria-hidden="true" /></Link></div>{recentOrder ? <Link href="/client/orders" className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition hover:border-gilded sm:p-5"><div className="flex min-w-0 items-center gap-4"><div className="size-16 shrink-0 overflow-hidden rounded bg-muted text-muted-foreground">{recentOrderImage ? <img src={recentOrderImage} alt="" className="h-full w-full object-cover" loading="lazy" /> : <span className="flex h-full w-full items-center justify-center"><ShoppingBag className="size-6" aria-hidden="true" /></span>}</div><div className="min-w-0"><p className="font-serif text-xl">Order #{recentOrder.orderNumber}</p><span className="mt-2 inline-flex rounded bg-emerald-500/10 px-2 py-1 text-xs capitalize text-emerald-700 dark:text-emerald-300">{orderStatus}</span><p className="mt-2 text-xs text-muted-foreground">{formatDate(recentOrder.createdAt)}</p></div></div><ArrowRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" /></Link> : <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">Your orders will appear here after your first purchase.</div>}</section>

        {nextConsultation && <section className="mt-10 rounded-lg border border-gold/40 bg-gilded/10 p-5 sm:p-6"><div className="flex items-start gap-4"><CalendarDays className="mt-1 size-5 text-gilded" aria-hidden="true" /><div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Upcoming consultation</p><h2 className="mt-2 font-serif text-2xl">{nextConsultation.title}</h2><p className="mt-2 text-sm text-muted-foreground">{formatDate(nextConsultation.preferredDate)} · {nextConsultation.status}</p><Link href="/client/consultations" className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-foreground">View consultation <ArrowRight className="size-3" aria-hidden="true" /></Link></div></div></section>}

        <section className="mt-10" aria-labelledby="account-heading"><h2 id="account-heading" className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.2em]">Account</h2><div className="overflow-hidden rounded-lg border border-border bg-card"><AccountRow href="/user-profile" icon={UserRound} label="Personal information" /><AccountRow href="/user-profile#addresses" icon={MapPin} label="Addresses" /><AccountRow href="/user-profile#notifications" icon={Bell} label="Notifications" /><AccountRow href="/user-profile#settings" icon={Settings} label="Account settings" /><AccountRow href="/user-profile#security" icon={ShieldCheck} label="Security" /></div></section>

        <div className="mt-10 grid gap-3 sm:grid-cols-2"><Link href="/trade-program" className="block rounded-lg border border-primary/30 bg-primary/5 px-5 py-5 transition hover:border-primary sm:px-6"><span className="text-[10px] uppercase tracking-[0.2em] text-primary">For design professionals</span><span className="mt-2 block font-serif text-2xl">Trade Program</span><span className="mt-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Explore trade access <ArrowRight className="size-3" aria-hidden="true" /></span></Link><Link href="/services" className="block rounded-lg bg-primary px-5 py-5 text-primary-foreground transition hover:bg-primary/90 sm:px-6"><span className="font-serif text-2xl">Your space deserves a point of view.</span><span className="mt-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-primary-foreground/70">Continue your design journey <ArrowRight className="size-3" aria-hidden="true" /></span></Link></div>
      </div>
    </div>
  )
}

function QuickAccess({ href, icon: Icon, label, badge }: { href: string; icon: typeof Package; label: string; badge?: number }) {
  return <Link href={href} className="relative flex min-h-28 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-2 text-center transition hover:border-primary hover:bg-muted/40"><Icon className="size-6 text-foreground" strokeWidth={1.4} aria-hidden="true" /><span className="text-xs text-foreground/80">{label}</span>{badge ? <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">{badge}</span> : null}</Link>
}

function AccountRow({ href, icon: Icon, label }: { href: string; icon: typeof UserRound; label: string }) {
  return <Link href={href} className="flex min-h-14 items-center gap-4 border-b border-border px-4 text-sm transition last:border-b-0 hover:bg-muted/40 sm:px-5"><Icon className="size-5 shrink-0 text-foreground" strokeWidth={1.4} aria-hidden="true" /><span className="flex-1 font-serif text-lg">{label}</span><ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" /></Link>
}
