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
  Truck,
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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { hasPermission, type AdminPermission, type UserRole } from '@/lib/auth/permissions'

const sidebarItems: Array<{ label: string; href: string; icon: typeof BarChart3; permission: AdminPermission }> = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3, permission: 'view_admin' },
  { label: 'Products', href: '/admin/products', icon: Package, permission: 'manage_content' },
  { label: 'Categories', href: '/admin/categories', icon: Grid3x3, permission: 'manage_content' },
  { label: 'Services', href: '/admin/services', icon: Briefcase, permission: 'manage_content' },
  { label: 'FAQs', href: '/admin/faqs', icon: HelpCircle, permission: 'manage_content' },
  { label: 'Projects (Portfolio)', href: '/admin/projects', icon: FolderOpen, permission: 'manage_projects' },
  { label: 'Client Projects', href: '/admin/client-projects', icon: FolderKanban, permission: 'manage_projects' },
  { label: 'Billing', href: '/admin/billing', icon: Receipt, permission: 'view_finance' },
  { label: 'Refund Requests', href: '/admin/billing/refunds', icon: Receipt, permission: 'view_finance' },
  { label: 'Finance Documents', href: '/admin/finance/documents', icon: FileCog, permission: 'view_finance' },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart, permission: 'view_orders' },
  { label: 'Logistics', href: '/admin/logistics', icon: Truck, permission: 'manage_logistics' },
  { label: 'Messages', href: '/admin/messages', icon: MessageSquare, permission: 'manage_support' },
  { label: 'Support Tickets', href: '/admin/tickets', icon: LifeBuoy, permission: 'manage_support' },
  { label: 'Users', href: '/admin/users', icon: Users, permission: 'manage_staff' },
  { label: 'Consultations', href: '/admin/consultations', icon: FileText, permission: 'manage_projects' },
  { label: 'Events', href: '/admin/events', icon: CalendarDays, permission: 'manage_content' },
  { label: 'Community', href: '/admin/community', icon: Megaphone, permission: 'manage_content' },
  { label: 'Loyalty Rewards', href: '/admin/loyalty', icon: Gift, permission: 'manage_loyalty' },
  { label: 'Studio Inquiries', href: '/admin/service-requests', icon: MessageSquare, permission: 'manage_support' },
  { label: 'Settings', href: '/admin/settings', icon: Settings, permission: 'manage_settings' },
]

function isItemActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

function AdminNav({ role, onNavigate, collapsed = false }: { role: UserRole; onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin navigation" className="space-y-1">
      {sidebarItems.filter((item) => hasPermission(role, item.permission)).map((item) => {
        const Icon = item.icon
        const active = isItemActive(pathname, item.href)
        return (
          <Link
            prefetch={false}
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? item.label : undefined}
            className={`group relative flex min-h-11 items-center rounded-lg py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${active ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className={collapsed ? 'sr-only' : 'min-w-0 truncate'}>{item.label}</span>
            {collapsed && active && <span className="absolute right-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary" aria-hidden="true" />}
          </Link>
        )
      })}
    </nav>
  )
}

function AdminSignOut({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <SignOutButton redirectUrl="/">
      <button
        type="button"
        aria-label="Sign out"
        title={collapsed ? 'Sign out' : undefined}
        className={`flex min-h-11 w-full items-center rounded-lg py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'}`}
      >
        <LogOut className="size-4 shrink-0" aria-hidden="true" />
        <span className={collapsed ? 'sr-only' : undefined}>Sign Out</span>
      </button>
    </SignOutButton>
  )
}

function AdminBrand({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return <Link prefetch={false} href="/admin" aria-label="The Revamp UG admin dashboard" title="The Revamp UG" className="mx-auto flex size-10 items-center justify-center rounded-xl bg-foreground font-serif text-lg text-background">R</Link>
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Link prefetch={false} href="/admin" className="font-serif text-2xl font-light text-foreground">The Revamp UG</Link>
        <p className="mt-1 text-xs text-muted-foreground">Admin Portal</p>
      </div>
    </div>
  )
}

function DesktopSidebar({ role }: { role: UserRole }) {
  const [collapsed, setCollapsed] = useState(true)

  function toggle() {
    setCollapsed((current) => {
      const next = !current
      window.localStorage.setItem('revamp-admin-sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <aside className={`hidden shrink-0 border-r border-border/70 bg-card transition-[width] duration-200 md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:overflow-y-auto ${collapsed ? 'md:w-16' : 'md:w-64'}`}>
      <div className={`flex min-h-16 items-center border-b border-border/50 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        <AdminBrand collapsed={collapsed} />
        <button type="button" onClick={toggle} aria-label={collapsed ? 'Expand admin navigation' : 'Collapse admin navigation'} title={collapsed ? 'Expand navigation' : 'Collapse navigation'} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          {collapsed ? <PanelLeftOpen className="size-4" aria-hidden="true" /> : <PanelLeftClose className="size-4" aria-hidden="true" />}
        </button>
      </div>
      <div className={`flex-1 py-4 ${collapsed ? 'px-2' : 'px-3'}`}><AdminNav role={role} collapsed={collapsed} /></div>
      <div className={`border-t border-border/50 py-3 ${collapsed ? 'px-2' : 'px-3'}`}><AdminSignOut collapsed={collapsed} /></div>
    </aside>
  )
}

export default function AdminSidebar({ role }: { role: UserRole }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <DesktopSidebar role={role} />

      <div className="md:hidden">
        <button type="button" aria-label={mobileOpen ? 'Close admin navigation' : 'Open admin navigation'} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)} className="fixed left-2.5 top-2.5 z-50 flex size-11 items-center justify-center rounded-lg border border-border/70 bg-background/95 text-foreground shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          {mobileOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="safe-bottom w-[min(20rem,calc(100vw-1rem))] border-border bg-card p-0">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <div className="flex h-full flex-col overflow-y-auto p-5">
              <AdminBrand />
              <div className="mt-7"><AdminNav role={role} onNavigate={() => setMobileOpen(false)} /></div>
              <div className="mt-8 border-t border-border/20 pt-5"><AdminSignOut /></div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
