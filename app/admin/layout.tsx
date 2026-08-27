import AdminSidebar from '@/components/admin/admin-sidebar'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { adminPathIsAllowed, roleLabel } from '@/lib/auth/permissions'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import NotificationBell from '@/components/notifications/notification-bell'
import PageLoadError from '@/components/system/page-load-error'
import { ThemeSwitcher } from '@/components/theme-switcher'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin Portal | The Revamp UG',
  description: 'Administration dashboard for The Revamp UG',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers()
  const pathname = requestHeaders.get('x-revamp-path') || '/admin'
  const authorization = await getCurrentUserWithRole()
  const { user, authorized, reason } = authorization
  if (reason === 'unauthenticated') redirect('/sign-in?redirect_url=%2Fadmin')

  if (reason === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
        <PageLoadError
          title="The admin portal is temporarily unavailable."
          message="We could not confirm your admin profile right now. No changes were made. Please retry in a moment."
        />
      </main>
    )
  }

  if (!authorized || !user || !adminPathIsAllowed(user.role, pathname)) redirect('/unauthorized')

  return (
    <div className="flex min-h-dvh min-w-0 bg-background">
      <AdminSidebar role={user.role ?? 'customer'} />
      <main className="relative min-w-0 flex-1 overflow-x-hidden">
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-border/70 bg-background/90 px-4 pl-16 backdrop-blur-xl sm:px-6 sm:pl-16 md:pl-6">
          <div className="min-w-0"><p className="truncate text-[10px] uppercase tracking-[0.24em] text-primary">The Revamp UG</p><p className="truncate text-sm text-muted-foreground">{roleLabel(user.role)} workspace</p></div>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <ThemeSwitcher />
            <NotificationBell />
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
