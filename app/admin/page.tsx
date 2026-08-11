import { requirePortalUser } from '@/lib/auth/portal-auth'
import AdminDashboard from './_components/admin-dashboard'

export default async function AdminPage() {
  // Protect route on the server: admin role required.
  await requirePortalUser(['admin'], '/admin')

  return <AdminDashboard />
}
