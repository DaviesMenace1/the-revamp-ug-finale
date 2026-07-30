import { ClerkProvider } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/admin-sidebar'
import { getCurrentUser } from '@/lib/auth/utils'

export const metadata = {
  title: 'Admin Portal | The Revamp UG',
  description: 'Administration dashboard for The Revamp UG',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'ADMIN') {
    redirect('/sign-in')
  }

  return (
    <ClerkProvider>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </ClerkProvider>
  )
}
