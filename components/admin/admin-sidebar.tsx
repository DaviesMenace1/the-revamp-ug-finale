'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { SignOutButton } from '@clerk/nextjs'
import {
  BarChart3,
  Package,
  FolderOpen,
  FolderKanban,
  Users,
  ShoppingCart,
  FileText,
  FileCog,
  Receipt,
  Settings,
  LogOut,
  Grid3x3,
  Briefcase,
  HelpCircle,
  MessageSquare,
  LifeBuoy,
  CalendarDays,
  Gift,
  Megaphone,
  Menu,
  X,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

const sidebarItems = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3 },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: Grid3x3 },
  { label: 'Services', href: '/admin/services', icon: Briefcase },
  { label: 'FAQs', href: '/admin/faqs', icon: HelpCircle },
  { label: 'Projects (Portfolio)', href: '/admin/projects', icon: FolderOpen },
  { label: 'Client Projects', href: '/admin/client-projects', icon: FolderKanban },
  { label: 'Billing', href: '/admin/billing', icon: Receipt },
  { label: 'Finance Documents', href: '/admin/finance/documents', icon: FileCog },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { label: 'Support Tickets', href: '/admin/tickets', icon: LifeBuoy },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Consultations', href: '/admin/consultations', icon: FileText },
  { label: 'Events', href: '/admin/events', icon: CalendarDays },
  { label: 'Community', href: '/admin/community', icon: Megaphone },
  { label: 'Loyalty Rewards', href: '/admin/loyalty', icon: Gift },
  { label: 'Studio Inquiries', href: '/admin/service-requests', icon: MessageSquare },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

function isItemActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin navigation" className="space-y-1">
      {sidebarItems.map((item) => {
        const Icon = item.icon
        const active = isItemActive(pathname, item.href)
        return (
          <Link
            prefetch={false}
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              active
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function AdminSignOut() {
  return (
    <SignOutButton redirectUrl="/">
      <button
        type="button"
        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <LogOut className="size-4 shrink-0" aria-hidden="true" />
        Sign Out
      </button>
    </SignOutButton>
  )
}

function AdminBrand() {
  return (
    <div className="mb-7">
      <Link prefetch={false} href="/admin" className="font-serif text-2xl font-light text-foreground">
        The Revamp UG
      </Link>
      <p className="mt-1 text-xs text-muted-foreground">Admin Portal</p>
    </div>
  )
}

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border/20 bg-card p-5 md:sticky md:top-0 md:block md:h-screen md:overflow-y-auto lg:p-6">
        <AdminBrand />
        <AdminNav />
        <div className="mt-8 border-t border-border/20 pt-5">
          <AdminSignOut />
        </div>
      </aside>

      <div className="md:hidden">
        <button
          type="button"
          aria-label={mobileOpen ? 'Close admin navigation' : 'Open admin navigation'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
          className="fixed left-2.5 top-2.5 z-50 flex size-11 items-center justify-center rounded-lg border border-border/70 bg-background/95 text-foreground shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {mobileOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="safe-bottom w-[min(20rem,calc(100vw-1rem))] border-border bg-card p-0">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <div className="flex h-full flex-col overflow-y-auto p-5">
              <AdminBrand />
              <AdminNav onNavigate={() => setMobileOpen(false)} />
              <div className="mt-8 border-t border-border/20 pt-5">
                <AdminSignOut />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
