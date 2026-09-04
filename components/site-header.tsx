'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { MessageCircle, ShoppingBag, User, Search, Menu, X } from '@/components/ui/luxury-icons'
import { useCart } from '@/lib/context/cart-context'
import { cn } from '@/lib/utils'
import { SearchDrawer } from '@/components/search/search-drawer'

const nav = [
  { label: 'Collections', href: '/collections' },
  { label: 'Services', href: '/services' },
  { label: 'Architecture', href: '/architecture' },
  { label: 'The Studio', href: '/about' },
  { label: 'Journal', href: '/journal' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const cart = useCart()
  const cartCount = cart?.cartCount ?? 0
  const active = (href: string) => href === '/about' ? pathname.startsWith('/about') : pathname === href || pathname.startsWith(`${href}/`)
  const close = () => setOpen(false)
  const account = () => { close(); window.dispatchEvent(new Event('revamp:open-auth')) }

  return <>
    <header className="sticky top-0 z-50 border-b border-obsidian/10 bg-canvas/95 text-obsidian shadow-[0_1px_0_rgba(28,28,28,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[4.75rem] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
        <Link href="/" className="shrink-0 font-serif text-[1.45rem] font-medium tracking-tighter sm:text-2xl">The Revamp <span className="font-normal italic text-gilded">UG</span></Link>
        <nav className="hidden items-center gap-6 text-[10px] font-semibold uppercase tracking-[0.16em] lg:flex xl:gap-8" aria-label="Main navigation">
          {nav.map((item) => <Link key={item.href} href={item.href} className={cn('whitespace-nowrap transition-colors hover:text-gilded', active(item.href) && 'text-gilded')}>{item.label}</Link>)}
          <Link href="/book-consultation" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-obsidian px-4 text-canvas transition-colors hover:bg-gilded hover:text-obsidian"><MessageCircle className="size-4" aria-hidden="true" />Book a consultation</Link>
          <button type="button" aria-label="Open search" onClick={() => setSearchOpen(true)} className="p-2 text-obsidian/65 hover:text-gilded"><Search className="size-4" /></button>
          <Link href="/cart" aria-label={`Cart${cartCount ? `, ${cartCount} items` : ''}`} className="relative p-2 text-obsidian/65 hover:text-gilded"><ShoppingBag className="size-4" />{cartCount > 0 && <span className="absolute right-0 top-0 text-[9px] font-semibold text-gilded">{cartCount}</span>}</Link>
          <button type="button" aria-label="Account access" onClick={account} className="p-2 text-obsidian/65 hover:text-gilded"><User className="size-4" /></button>
        </nav>
        <div className="flex items-center gap-1 lg:hidden"><button type="button" aria-label="Open search" onClick={() => setSearchOpen(true)} className="p-2 text-obsidian/70"><Search className="size-5" /></button><Link href="/cart" aria-label="Cart" className="relative p-2 text-obsidian/70"><ShoppingBag className="size-5" />{cartCount > 0 && <span className="absolute right-0 top-0 text-[9px] font-semibold text-gilded">{cartCount}</span>}</Link><button type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((value) => !value)} className="ml-1 flex size-11 items-center justify-center rounded-md border border-obsidian/15 text-obsidian transition-colors hover:border-gilded hover:text-gilded">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button></div>
      </div>
      {open && <div className="border-t border-obsidian/10 bg-canvas px-5 pb-7 pt-5 sm:px-8 lg:px-12"><nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile navigation"><Link href="/" onClick={close} className="border-b border-border py-3 text-[11px] font-semibold uppercase tracking-[0.2em]">Home</Link>{nav.map((item) => <Link key={item.href} href={item.href} onClick={close} className={cn('border-b border-border py-3 text-[11px] font-semibold uppercase tracking-[0.2em]', active(item.href) ? 'text-gilded' : 'text-obsidian')}>{item.label}</Link>)}<div className="mt-4 flex flex-wrap gap-3"><Link href="/book-consultation" onClick={close} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-obsidian px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-canvas">Book a consultation <MessageCircle className="size-4" /></Link><Link href="/contact" onClick={close} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-obsidian/20 px-5 text-[10px] font-semibold uppercase tracking-[0.2em]">General inquiry</Link><button type="button" onClick={account} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-obsidian/20 px-5 text-[10px] font-semibold uppercase tracking-[0.2em]">Account <User className="size-4" /></button></div></nav></div>}
    </header>
    <SearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />
  </>
}
