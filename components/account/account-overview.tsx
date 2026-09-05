'use client'

import Link from 'next/link'
import { ArrowRight, CalendarDays, Heart, MapPin, Package, Settings, ShieldCheck, ShoppingBag, UserRound, BriefcaseBusiness } from '@/components/ui/luxury-icons'
import { useEffect, useState } from 'react'
import { useCart } from '@/lib/context/cart-context'

type AccountData = Awaited<ReturnType<typeof import('@/lib/account/queries').getAccountOverview>>

const heroImage = '/prototype/hero-natural-light.jpg'

export function AccountOverview({ data }: { data: NonNullable<AccountData> }) {
  const { user, cartCount: serverCartCount, orders, nextConsultation, membership, loadError } = data
  const { cartCount } = useCart()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const firstName = user.firstName || user.email.split('@')[0] || 'Member'
  const displayCartCount = mounted ? cartCount : serverCartCount
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
      {loadError && <div role="status" className="border-b border-amber-400/30 bg-amber-50 px-5 py-3 text-sm text-amber-950 sm:px-8 lg:px-12">Some account details are temporarily unavailable. You can retry the page.</div>}

      <section className="relative overflow-hidden bg-obsidian text-ivory">
        <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
        <img src={heroImage} alt="A considered Revamp interior" className="absolute inset-0 h-full w-full object-cover opacity-75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/10" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[22rem] max-w-[1440px] items-end px-5 pb-10 pt-24 sm:min-h-[26rem] sm:px-8 sm:pb-14 lg:px-12">
          <div className="max-w-2xl"><p className="text-[10px] uppercase tracking-[0.3em] text-ivory/65">My account</p><h1 className="mt-5 max-w-xl font-serif text-6xl font-light leading-[0.86] sm:text-8xl">Your space,<br />your story.</h1><p className="mt-6 max-w-md text-sm leading-6 text-ivory/75">Manage your orders, details, preferences, and the pieces that shape your life.</p></div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-12 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-center gap-3 border-b border-border pb-6"><div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted font-serif text-2xl text-foreground">{firstName.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="font-serif text-lg leading-tight">Welcome back,<br />{firstName}</p><Link href="/user-profile" className="mt-2 inline-block text-[10px] uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-4">Edit profile</Link></div></div>
            <nav className="mt-5 grid gap-1" aria-label="Account sections"><AccountNav href="/account" icon={UserRound} label="Overview" active /><AccountNav href="/client/orders" icon={Package} label="Orders" /><AccountNav href="/user-profile#addresses" icon={MapPin} label="Addresses" /><AccountNav href="/wishlist" icon={Heart} label="Saved items" /><AccountNav href="/user-profile#settings" icon={Settings} label="Preferences" /><AccountNav href="/user-profile" icon={ShieldCheck} label="Account details" /></nav>
            <div className="mt-6 border-t border-border pt-5"><Link href="/trade-program" className="flex items-center gap-3 px-3 py-3 text-sm text-foreground/75 transition hover:text-primary"><BriefcaseBusiness className="size-4" />Trade Program</Link></div>
          </aside>

          <main className="min-w-0">
            <section className="grid gap-3 border-b border-border pb-8 sm:grid-cols-2 xl:grid-cols-4" aria-label="Account overview">
              <Metric label="Cart items" value={displayCartCount} href="/cart" icon={ShoppingBag} />
              <Metric label="Orders" value={orders.length} href="/client/orders" icon={Package} />
              <Metric label="Membership" value={membership?.status === 'active' ? 'Active' : 'Signature'} href="/membership" icon={Heart} />
              <Metric label="Consultations" value={nextConsultation ? '1' : '0'} href="/client/consultations" icon={CalendarDays} />
            </section>

            <section className="mt-10 grid gap-5 border-b border-border pb-10 md:grid-cols-[1fr_0.82fr]">
              <div className="border border-border bg-muted/25 p-6 sm:p-8"><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Curated living, closer to you.</p><h2 className="mt-4 max-w-sm font-serif text-4xl leading-[0.95] sm:text-5xl">Pieces that bring your vision to life.</h2><Link href="/collections" className="mt-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-foreground underline underline-offset-4">Shop the collection <ArrowRight className="size-3" /></Link></div>
              <div className="relative min-h-60 overflow-hidden bg-muted"><img src="/prototype/feature-console.jpg" alt="Curated interior detail" className="absolute inset-0 h-full w-full object-cover" /></div>
            </section>

            <AccountSectionTitle title="Recent orders" href="/client/orders" />
            <section className="divide-y divide-border border-b border-border">{recentOrder ? <Link href="/client/orders" className="flex items-center gap-4 py-4 transition hover:bg-muted/30 sm:gap-5"><div className="size-16 shrink-0 overflow-hidden bg-muted">{recentOrderImage ? <img src={recentOrderImage} alt="" className="h-full w-full object-cover" /> : <ShoppingBag className="m-5 size-6 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><p className="font-serif text-xl">Order #{recentOrder.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(recentOrder.createdAt)}</p><span className="mt-2 inline-flex text-xs capitalize text-foreground/65">●&nbsp; {orderStatus}</span></div><ArrowRight className="size-4 shrink-0 text-muted-foreground" /></Link> : <p className="py-8 text-sm text-muted-foreground">Your orders will appear here after your first purchase.</p>}</section>

            <div className="mt-10 grid gap-8 md:grid-cols-2"><section><AccountSectionTitle title="Saved items" href="/wishlist" /><Link href="/wishlist" className="flex min-h-28 items-center justify-center border border-dashed border-border text-sm text-muted-foreground transition hover:border-primary hover:text-primary"><Heart className="mr-2 size-4" />View your saved pieces</Link></section><section><AccountSectionTitle title="Addresses" href="/user-profile#addresses" /><Link href="/user-profile#addresses" className="flex min-h-28 items-center gap-3 border border-border p-5 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"><MapPin className="size-5" /><span>Manage your delivery addresses</span><ArrowRight className="ml-auto size-4" /></Link></section></div>

            {nextConsultation && <section className="mt-10 border border-border bg-muted/25 p-5 sm:p-6"><p className="text-[10px] uppercase tracking-[0.2em] text-primary">Upcoming appointment</p><h2 className="mt-3 font-serif text-2xl">{nextConsultation.title}</h2><p className="mt-2 text-sm text-muted-foreground">{formatDate(nextConsultation.preferredDate)} · {nextConsultation.status}</p><Link href="/client/consultations" className="mt-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] underline underline-offset-4">View appointments <ArrowRight className="size-3" /></Link></section>}
          </main>
        </div>
      </div>
    </div>
  )
}

function AccountNav({ href, icon: Icon, label, active = false }: { href: string; icon: typeof UserRound; label: string; active?: boolean }) {
  return <Link href={href} className={`flex min-h-11 items-center gap-3 px-3 text-sm transition ${active ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}><Icon className="size-4" />{label}</Link>
}

function Metric({ label, value, href, icon: Icon }: { label: string; value: string | number; href: string; icon: typeof Package }) {
  return <Link href={href} className="border border-border bg-muted/20 p-5 transition hover:border-primary"><Icon className="size-5 text-foreground" /><p className="mt-6 font-serif text-4xl">{value}</p><p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p><span className="mt-4 block text-[10px] uppercase tracking-[0.14em] text-foreground/70">View <ArrowRight className="ml-1 inline size-3" /></span></Link>
}

function AccountSectionTitle({ title, href }: { title: string; href: string }) {
  return <div className="mb-4 mt-10 flex items-center justify-between"><h2 className="font-serif text-3xl">{title}</h2><Link href={href} className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">View all <ArrowRight className="ml-1 inline size-3" /></Link></div>
}
