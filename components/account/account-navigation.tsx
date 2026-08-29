'use client'

import Link from 'next/link'
import { useClerk } from '@clerk/nextjs'
import { Home, LogOut, Menu, X, Settings, ShieldCheck, ArrowUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'

const groups = [
  { label: 'My account', links: [['Overview', '/account'], ['Orders', '/orders'], ['Wishlist', '/wishlist'], ['Cart', '/cart']] },
  { label: 'Design', links: [['Client Portal', '/client'], ['Projects', '/client/projects'], ['Consultations', '/client/consultations'], ['Messages', '/client/messages'], ['Documents', '/client/documents']] },
  { label: 'Membership', links: [['Membership', '/membership'], ['Benefits', '/membership/benefits'], ['Loyalty points', '/account#loyalty'], ['Trade program', '/trade-program']] },
  { label: 'Account', links: [['Profile', '/user-profile'], ['Settings', '/user-profile'], ['Devices & security', '/user-profile#devices']] },
]

export function AccountNavigation() {
  const { signOut } = useClerk()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const closeAfterNavigation = () => setOpen(false)
  const handleSignOut = () => signOut({ redirectUrl: '/' })

  return (
    <div className="contents">
      <header className="col-span-1 flex min-h-20 items-center justify-between border-b border-border/70 py-4 lg:col-span-2 lg:min-h-24">
        <Link href="/account" className="group flex min-w-0 items-center gap-3" aria-label="The Revamp member house">
          <span className="flex size-10 shrink-0 items-center justify-center border border-foreground bg-foreground font-serif text-lg text-background transition-transform group-hover:rotate-[-8deg]">R</span>
          <span className="min-w-0"><span className="block truncate font-serif text-xl leading-none tracking-tight text-foreground">The Revamp</span><span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Member house / Kampala</span></span>
        </Link>
        <div className="hidden items-center gap-5 lg:flex"><Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary"><Home className="size-4" aria-hidden="true" /> Home</Link><Link href="/client" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary">Client portal <ArrowUpRight className="size-3.5" aria-hidden="true" /></Link><Link href="/user-profile" className="text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary">Profile</Link><button type="button" onClick={handleSignOut} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary"><LogOut className="size-4" aria-hidden="true" /> Sign out</button></div>
        <div className="flex items-center gap-2 lg:hidden"><Link href="/" aria-label="Go to home" className="flex size-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-primary hover:text-primary"><Home className="size-5" aria-hidden="true" /></Link><button type="button" aria-label="Open account menu" aria-expanded={open} onClick={() => setOpen(true)} className="flex size-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"><Menu className="size-5" aria-hidden="true" /></button></div>
      </header>

      <aside className="hidden w-56 shrink-0 py-5 lg:block">
        <nav aria-label="Account navigation" className="flex flex-col gap-7">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p>
              <div className="flex flex-col gap-1">{group.links.map(([label, href]) => <Link prefetch={false} key={href + label} href={href} className="py-1 text-sm text-foreground/75 transition-colors hover:text-primary">{label}</Link>)}</div>
            </div>
          ))}
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-50 bg-black/45" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
        <aside className="absolute right-0 top-0 flex h-full w-[min(92vw,25rem)] max-w-full flex-col overflow-y-auto bg-background p-5 shadow-2xl" role="dialog" aria-modal="true" aria-label="Account menu">
          <div className="flex items-center justify-between border-b border-border/70 pb-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">The Revamp UG</p><p className="mt-1 text-sm font-medium">Member house</p></div><button type="button" aria-label="Close account menu" onClick={() => setOpen(false)} className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-5" aria-hidden="true" /></button></div>
          <nav aria-label="Mobile account navigation" className="flex flex-1 flex-col gap-6 py-5">{groups.map((group) => <div key={group.label} className="border-b border-border/50 pb-5 last:border-0"><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p><div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">{group.links.map(([label, href]) => <Link prefetch={false} key={href + label} href={href} onClick={closeAfterNavigation} className="flex min-h-11 items-center border-b border-border/30 py-2 text-sm text-foreground/85 transition-colors hover:text-primary">{label}</Link>)}</div></div>)}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4"><div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="size-4 text-primary" />Devices signed in</div><p className="mt-1 text-xs leading-5 text-muted-foreground">Review this device and sign out individual sessions or all devices.</p><Link href="/user-profile#devices" onClick={closeAfterNavigation} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">Manage devices <Settings className="size-3.5" /></Link></div>
            <button type="button" onClick={handleSignOut} className="flex min-h-11 items-center gap-2 text-left text-sm text-muted-foreground transition-colors hover:text-primary"><LogOut className="size-4" aria-hidden="true" />Sign out</button>
          </nav>
        </aside>
      </div>}
    </div>
  )
}
