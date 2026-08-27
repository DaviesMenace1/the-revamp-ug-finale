import UsersClient from './users-client'

export const dynamic = 'force-dynamic'

export default function AdminUsersPage() {
  return <UsersClient initialUsers={[]} />
}
