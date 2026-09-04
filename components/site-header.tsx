'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { MessageCircle, ShoppingBag, User, Search, Menu, X } from '@/components/ui/luxury-icons'
import { useCart } from '@/lib/context/cart-context'
import { cn } from '@/lib/utils'

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
  const cart = useCart()
  const cartCount = cart?.cartCount ?? 0
  const active = (href: string) => href === '/about' ? pathname.startsWith('/about') : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="sticky top-0 z-50 border-b border-obsidian/10 bg-canvas/90 px-6 py-4 backdrop-blur-xl lg:px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-medium tracking-tighter">
          The Revamp <span className="font-normal italic text-gilded">UG</span>
        </Link>
        <nav className="hidden items-center gap-10 text-[11px] font-medium uppercase tracking-[0.2em] md:flex" aria-label="Main navigation">
          {nav.map((item) => <Link key={item.href} href={item.href} className={cn('transition-colors hover:text-gilded', active(item.href) && 'text-gilded')}>{item.label}</Link>)}
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-obsidian py-2 pl-3 pr-4 text-canvas transition-colors hover:bg-obsidian/90"><MessageCircle className="size-4" aria-hidden="true" />Inquire</Link>
          <Link href="/search" aria-label="Search" className="p-1 text-muted-foreground hover:text-gilded"><Search className="size-4" /></Link>
          <Link href="/cart" aria-label={`Cart${cartCount ? `, ${cartCount} items` : ''}`} className="relative p-1 text-muted-foreground hover:text-gilded"><ShoppingBag className="size-4" />{cartCount > 0 && <span className="absolute -right-1 -top-1 text-[9px] text-gilded">{cartCount}</span>}</Link>
          <button type="button" aria-label="Account access" onClick={() => window.dispatchEvent(new Event('revamp:open-auth'))} className="p-1 text-muted-foreground hover:text-gilded"><User className="size-4" /></button>
        </nav>
        <button type="button" aria-label={open ? 'Close menu' : 'Toggle menu'} onClick={() => setOpen((value) => !value)} className="p-2 md:hidden">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
      </div>
      {open && <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4 text-[11px] font-medium uppercase tracking-[0.2em] md:hidden">
        <Link href="/" onClick={() => setOpen(false)} className="hover:text-gilded">Home</Link>
        {nav.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn('hover:text-gilded', active(item.href) && 'text-gilded')}>{item.label}</Link>)}
        <Link href="/contact" onClick={() => setOpen(false)} className="hover:text-gilded">Contact</Link>
      </div>}
    </header>
  )
}
