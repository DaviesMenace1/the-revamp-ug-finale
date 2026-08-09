import { requirePortalUser } from '@/lib/auth/portal-auth'
import AdminDashboard from './_components/admin-dashboard'

export default async function AdminPage() {
  // Protect route on the server
    const user = await requirePortalUser(['admin'])

      return <AdminDashboard />
      }
