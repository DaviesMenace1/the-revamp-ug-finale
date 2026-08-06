import AdminSidebar from '@/components/admin/admin-sidebar'

export const metadata = {
  title: 'Admin Portal | The Revamp UG',
  description: 'Administration dashboard for The Revamp UG',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
