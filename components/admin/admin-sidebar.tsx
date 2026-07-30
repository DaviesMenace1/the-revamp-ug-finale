import Link from 'next/link'
import {
  BarChart3,
  Package,
  FolderOpen,
  Users,
  ShoppingCart,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react'

const sidebarItems = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3 },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Projects', href: '/admin/projects', icon: FolderOpen },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Consultations', href: '/admin/consultations', icon: FileText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminSidebar() {
  return (
    <aside className="w-64 border-r border-border/20 bg-card p-6 sticky top-0 h-screen overflow-y-auto">
      <div className="mb-8">
        <Link href="/admin" className="font-serif text-2xl font-light text-foreground">
          The Revamp UG
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
        <Link
          href="/sign-out"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Link>
      </div>
    </aside>
  )
}
