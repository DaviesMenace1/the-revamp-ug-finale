'use client'

import Link from 'next/link'
import { ArrowUpRight, CalendarDays, Compass, Heart, MessageCircle, PackageOpen, ShoppingBag, Sparkles, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCart } from '@/lib/context/cart-context'

type AccountData = Awaited<ReturnType<typeof import('@/lib/account/queries').getAccountOverview>>

type LoyaltySummary = {
  balancePoints: number
  tier: string
  nextTier: string | null
  pointsToNextTier: number
}

function CartCount({ fallbackCount }: { fallbackCount: number }) {
  const { cartCount } = useCart()
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])
  const displayCount = isMounted ? cartCount : fallbackCount
  return <>{displayCount} {displayCount === 1 ? 'item' : 'items'}</>
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
  const { user, cartCount: serverCartCount, orders, nextConsultation, membership, loadError, loyalty } = data
  const firstName = user.firstName || ''
  const displayName = firstName || user.email?.split('@')[0] || 'Member'
  const loyaltySummary = loyalty as LoyaltySummary | null

  return (
    <div className="min-w-0 space-y-10 pb-10 sm:space-y-14 sm:pb-16">
      <section className="relative overflow-hidden rounded-[2rem] bg-foreground px-6 py-7 text-background shadow-2xl sm:px-10 sm:py-10" aria-labelledby="account-welcome">
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full border border-background/10" />
        <div className="pointer-events-none absolute -bottom-36 left-1/3 size-96 rounded-full border border-background/10" />
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(15rem,0.75fr)] lg:items-end">
          <div className="min-w-0">
            <div className="flex items-center gap-3 text-background/55"><span className="flex size-8 items-center justify-center rounded-full border border-background/30 font-serif text-sm">R</span><p className="font-mono text-[10px] uppercase tracking-[0.24em]">Private client dashboard</p></div>
            <h1 id="account-welcome" className="mt-8 max-w-3xl font-serif text-5xl font-light leading-[0.94] tracking-tight text-balance sm:text-7xl">Make space for what’s next, {displayName}.</h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-background/65 sm:text-base">A considered place for your projects, conversations, orders and the objects that belong in your world.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/client" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-background px-5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-transform hover:-translate-y-0.5">Open client portal <ArrowUpRight className="size-4" /></Link><Link href="/book-consultation" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-background/25 px-5 text-xs uppercase tracking-[0.14em] text-background/80 transition-colors hover:border-background/60 hover:text-background">Begin a conversation <ArrowUpRight className="size-4" /></Link></div>
          </div>
          <div className="border-t border-background/15 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0"><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-background/45">Account index</p><div className="mt-5 grid gap-5"><IndexRow label="Member" value={user.email || 'Private account'} /><IndexRow label="Current chapter" value={nextConsultation ? 'Conversation scheduled' : membership?.status === 'active' ? 'Membership active' : 'Open to possibilities'} /><IndexRow label="Next action" value={nextConsultation ? 'View consultation' : 'Explore services'} /></div></div>
        </div>
      </section>

      {loadError && <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-100"><span>{loadError}</span><button type="button" onClick={() => window.location.reload()} className="min-h-11 shrink-0 font-medium underline underline-offset-4">Retry</button></div>}

      <section aria-label="Account snapshot" className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
        <SnapshotTile icon={<PackageOpen aria-hidden="true" />} label="Orders" value={orders.length ? `${orders.length} recent` : 'No orders yet'} href="/client/orders" />
        <SnapshotTile icon={<ShoppingBag aria-hidden="true" />} label="In your selection" value={<CartCount fallbackCount={serverCartCount} />} href="/cart" />
        <SnapshotTile icon={<Heart aria-hidden="true" />} label="Saved pieces" value={<WishlistCount />} href="/wishlist" />
      </section>

      <section aria-labelledby="now-heading" className="space-y-5"><SectionHeading id="now-heading" eyebrow="The now" title="A clear view of what is moving." /><div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8"><div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.14),_transparent_68%)]" /><div className="relative flex min-h-56 flex-col justify-between"><div className="flex items-start justify-between gap-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">{nextConsultation ? 'Next conversation' : 'Design direction'}</p><h3 className="mt-4 max-w-lg font-serif text-4xl font-light leading-tight sm:text-5xl">{nextConsultation ? nextConsultation.title : 'Your space is ready for a point of view.'}</h3></div><CalendarDays className="size-6 shrink-0 text-primary" aria-hidden="true" /></div>{nextConsultation ? <div className="mt-8 flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm text-foreground">{nextConsultation.preferredDate?.toLocaleDateString('en-UG', { weekday: 'long', month: 'long', day: 'numeric' })}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{nextConsultation.status}</p></div><Link href="/client/consultations" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">View consultation <ArrowUpRight className="size-4" /></Link></div> : <div className="mt-8 flex flex-wrap gap-4"><Link href="/services" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 text-xs font-semibold uppercase tracking-[0.14em] text-background">Explore services <ArrowUpRight className="size-4" /></Link><Link href="/portfolio" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground">View the portfolio <Compass className="size-4" /></Link></div>}</div></div>
        <div className="rounded-2xl border border-border bg-muted/30 p-6 sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Relationship</p><h3 className="mt-4 font-serif text-3xl font-light leading-tight">{membership?.status === 'active' ? 'Your membership is active.' : 'There is more to discover.'}</h3><p className="mt-4 text-sm leading-6 text-muted-foreground">{membership?.status === 'active' ? `A closer relationship with The Revamp since ${membership.startDate.toLocaleDateString('en-UG', { month: 'long', year: 'numeric' })}.` : 'Explore access to design experiences, objects and conversations shaped around you.'}</p><Link href="/membership" className="mt-8 inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{membership?.status === 'active' ? 'View membership' : 'Explore membership'} <ArrowUpRight className="size-4" /></Link></div>
      </div></section>

      <section aria-labelledby="path-heading" className="space-y-5"><SectionHeading id="path-heading" eyebrow="Your paths" title="Move between the things that matter." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><PathCard href="/client/projects" icon={<Compass />} title="Projects" detail="See work in progress, milestones and documents." /><PathCard href="/client/messages" icon={<MessageCircle />} title="Messages" detail="Keep the conversation with our team moving." /><PathCard href="/user-profile" icon={<UserRound />} title="Your profile" detail="Personal details, security and preferences." /><PathCard href="/trade-program" icon={<Sparkles />} title="Trade program" detail="A considered way to work with us professionally." /></div></section>

      <section aria-labelledby="orders-heading" className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-4"><SectionHeading id="orders-heading" eyebrow="Objects in motion" title="Recent orders." /><Link href="/client/orders" className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.14em] text-primary">View all <ArrowUpRight className="size-4" /></Link></div><div className="overflow-hidden rounded-2xl border border-border bg-card">{orders.length ? <div className="divide-y divide-border">{orders.map((order) => <div key={order.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-7"><div className="flex min-w-0 items-center gap-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary"><ShoppingBag className="size-4" /></span><div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">Order {order.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">{order.createdAt.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })} · {order.status || 'Processing'}</p></div></div><p className="font-serif text-xl tabular-nums text-foreground">UGX {Number(order.total || 0).toLocaleString('en-UG')}</p></div>)}</div> : <div className="flex flex-col gap-4 px-6 py-10 sm:px-8"><p className="font-serif text-3xl font-light">Your first considered object is still ahead.</p><p className="max-w-xl text-sm leading-6 text-muted-foreground">When you order from The Revamp, the details and progress will live here.</p><Link href="/collections" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Browse the collection <ArrowUpRight className="size-4" /></Link></div>}</div></section>

      <section id="loyalty" aria-labelledby="rewards-heading" className="rounded-2xl border border-border bg-muted/20 p-6 sm:p-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">A quiet benefit</p><h2 id="rewards-heading" className="mt-3 font-serif text-3xl font-light">Rewards, kept in the background.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Your relationship with The Revamp carries value. We keep the numbers light here so the work, spaces and conversations stay in focus.</p></div>{loyaltySummary ? <div className="flex items-end gap-6"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{loyaltySummary.tier} tier</p><p className="mt-2 font-serif text-4xl text-foreground">{loyaltySummary.balancePoints.toLocaleString('en-UG')}</p><p className="mt-1 text-xs text-muted-foreground">points available</p></div><Link href="/account#loyalty" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Open rewards <ArrowUpRight className="size-4" /></Link></div> : <Link href="/membership" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Discover membership <ArrowUpRight className="size-4" /></Link>}</div></section>
    </div>
  )
}

function IndexRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-background/15 pb-3 text-sm"><span className="text-background/45">{label}</span><span className="max-w-[11rem] truncate text-right text-background/85">{value}</span></div>
}

function SectionHeading({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return <div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">{eyebrow}</p><h2 id={id} className="mt-2 font-serif text-3xl font-light tracking-tight sm:text-4xl">{title}</h2></div>
}

function SnapshotTile({ href, icon, label, value }: { href: string; icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return <Link href={href} className="group flex min-h-32 min-w-0 flex-col justify-between bg-card p-5 transition-colors hover:bg-muted/40 sm:p-6"><span className="text-primary">{icon}</span><span className="mt-5 min-w-0"><span className="block truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span><span className="mt-2 block truncate font-serif text-2xl text-foreground">{value}</span></span></Link>
}

function PathCard({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail: string }) {
  return <Link href={href} className="group flex min-h-44 min-w-0 flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg sm:p-6"><span className="text-primary">{icon}</span><span><span className="block font-serif text-2xl text-foreground">{title}</span><span className="mt-2 block text-sm leading-6 text-muted-foreground">{detail}</span><span className="mt-4 inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-primary opacity-0 transition-opacity group-hover:opacity-100">Open <ArrowUpRight className="size-3.5" /></span></span></Link>
}
