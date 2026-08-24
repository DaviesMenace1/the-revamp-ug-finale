import AdminSidebar from '@/components/admin/admin-sidebar'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import NotificationBell from '@/components/notifications/notification-bell'

export const metadata = {
  title: 'Admin Portal | The Revamp UG',
  description: 'Administration dashboard for The Revamp UG',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { authorized, reason } = await getCurrentUserWithRole(['admin'])
  if (reason === 'unauthenticated') redirect('/sign-in?redirect_url=%2Fadmin')
  if (!authorized) redirect('/unauthorized')

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="relative flex-1 overflow-auto">
        <div className="fixed right-6 top-5 z-40"><NotificationBell /></div>
        {children}
      </main>
    </div>
  )
}
