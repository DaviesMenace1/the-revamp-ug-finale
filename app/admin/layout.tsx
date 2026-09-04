import AdminSidebar from '@/components/admin/admin-sidebar'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { adminPathIsAllowed, roleLabel } from '@/lib/auth/permissions'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import NotificationBell from '@/components/notifications/notification-bell'
import { ThemeSwitcher } from '@/components/theme-switcher'
import PageLoadError from '@/components/system/page-load-error'

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
      <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16">
        <PageLoadError
          title="The admin portal is temporarily unavailable."
          message="We could not confirm your admin profile right now. No changes were made. Please retry in a moment."
        />
      </main>
    )
  }

  if (!authorized || !user || !adminPathIsAllowed(user.role, pathname)) redirect('/unauthorized')

  return (
    <div className="flex min-h-dvh min-w-0 bg-canvas">
      <AdminSidebar role={user.role ?? 'customer'} />
      <main className="relative min-w-0 flex-1 overflow-x-hidden">
        <header className="sticky top-0 z-40 flex min-h-20 items-center justify-between gap-3 border-b border-obsidian/10 bg-canvas/90 px-4 pl-16 backdrop-blur-xl sm:px-6 sm:pl-16 md:pl-6">
          <div className="min-w-0"><p className="truncate text-[10px] font-semibold uppercase tracking-[0.3em] text-gilded">The Revamp UG / Studio workspace</p><p className="mt-1 truncate font-serif text-xl text-foreground">{roleLabel(user.role)}</p></div>
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
