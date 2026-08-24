import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
import {
  BarChart3,
  Package,
  FolderOpen,
  FolderKanban,
  Users,
  ShoppingCart,
  FileText,
  Receipt,
  Settings,
  LogOut,
  Grid3x3,
  Briefcase,
  HelpCircle,
  MessageSquare,
  LifeBuoy,
  FileCog,
} from 'lucide-react'

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
  { label: 'Studio Inquiries', href: '/admin/service-requests', icon: MessageSquare },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminSidebar() {
  return (
    <aside className="w-64 border-r border-border/20 bg-card p-6 sticky top-0 h-screen overflow-y-auto">
      <div className="mb-8">
        <Link href="/admin" className="font-serif text-2xl font-light text-foreground">
          The Revamp Ug
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Admin Portal</p>
      </div>

      <nav className="space-y-2 mb-12">
        {sidebarItems.map(item => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border/20 pt-6 mt-auto">
        <SignOutButton redirectUrl="/">
          <button
            type="button"
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </aside>
  )
}

