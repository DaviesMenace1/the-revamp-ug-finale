'use client'

import { useState, useTransition, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Trash2, Search, Shield } from 'lucide-react'
import { updateUserRole, deleteUser } from '@/lib/actions/users'
import { ROLE_LABELS, type UserRole } from '@/lib/auth/permissions'

const ROLES: UserRole[] = [
  'customer',
  'designer',
  'admin',
  'trade_member',
  'architect',
  'interior_designer',
  'editor',
  'operations_manager',
  'logistics_coordinator',
  'support_agent',
  'finance_viewer',
]

type AdminUser = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  company: string | null
  role: string | null
  createdAt: string
}

export default function UsersClient({ initialUsers = [] }: { initialUsers: AdminUser[] }) {
  const [usersList, setUsersList] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return usersList
    return usersList.filter((u) =>
      [u.email, u.firstName, u.lastName, u.company]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term)),
    )
  }, [usersList, searchTerm])

  function handleRoleChange(userId: string, role: string) {
    startTransition(async () => {
      const res = await updateUserRole(userId, role)
      if (res.success) {
        setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
      }
    })
  }

  function handleDelete(userId: string) {
    if (!confirm('Delete this user account? This cannot be undone.')) return
    startTransition(async () => {
      const res = await deleteUser(userId)
      if (res.success) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId))
      }
    })
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="font-serif text-4xl font-light text-foreground">Users & Members</h1>
        <p className="text-muted-foreground mt-2">Assign the least access each team member needs for their work.</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>{usersList.length} total users</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10 rounded-none border-muted"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/20">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Company</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Joined</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-border/20 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 text-sm text-foreground font-medium">
                      {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{user.company || 'N/A'}</td>
                    <td className="py-4 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        {user.role === 'admin' && <Shield className="w-4 h-4 text-primary" />}
                        <select
                          value={user.role ?? 'customer'}
                          disabled={isPending}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="rounded border border-muted bg-transparent px-2 py-1 text-xs font-medium text-foreground"
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role as UserRole] || role}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <button
                        disabled={isPending}
                        onClick={() => handleDelete(user.id)}
                        className="p-1.5 hover:bg-muted rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
