import AdminSidebar from '@/components/admin/admin-sidebar'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Admin Portal | The Revamp UG',
  description: 'Administration dashboard for The Revamp UG',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { authorized } = await getCurrentUserWithRole(['admin'])
  if (!authorized) redirect('/unauthorized')

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
