'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle2, Trash2, Search, Shield } from '@/components/ui/luxury-icons'
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

export default function UsersClient({ initialUsers = [], loadError = null }: { initialUsers: AdminUser[]; loadError?: string | null }) {
  const [usersList, setUsersList] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(loadError)
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(initialUsers.length === 0 && !loadError)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({})) as { users?: AdminUser[]; error?: string }
      if (!response.ok) throw new Error(payload.error || 'The user list could not be loaded.')
      setUsersList(Array.isArray(payload.users) ? payload.users : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'The user list could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialUsers.length > 0 || loadError) return
    const timer = window.setTimeout(() => { void loadUsers() }, 0)
    return () => window.clearTimeout(timer)
  }, [initialUsers.length, loadError, loadUsers])

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
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const res = await updateUserRole(userId, role)
      if (res.success) {
        setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, role: res.role || role } : u)))
        setMessage('User role updated successfully.')
      } else {
        setError(res.error || 'The user role could not be updated. Please retry.')
      }
    })
  }

  function handleDelete(userId: string) {
    if (!confirm('Delete this user account? This cannot be undone.')) return
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const res = await deleteUser(userId)
      if (res.success) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId))
        setMessage('User account deleted.')
      } else {
        setError(res.error || 'The user account could not be deleted. Please retry.')
      }
    })
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">Team access</p>
        <h1 className="mt-2 font-serif text-4xl font-light text-foreground">Users & Members</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Assign the least access each team member needs for their work.</p>
      </div>

      {(error || message) && <div role={error ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${error ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'}`}>
        {error ? <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
        <span>{error || message}</span>
        {error && <button type="button" onClick={() => void loadUsers()} disabled={isLoading} className="ml-auto shrink-0 font-medium underline underline-offset-4">Retry</button>}
      </div>}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>{usersList.length} total users</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
              <Input placeholder="Search users..." aria-label="Search users" className="min-h-11 rounded-none border-muted pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border/60">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-border/20 bg-muted/20">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Company</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Joined</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-border/20 transition-colors last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-4 text-sm font-medium text-foreground">{[user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A'}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{user.company || 'N/A'}</td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {user.role === 'admin' && <Shield className="size-4 text-primary" aria-label="Administrator" />}
                        <select aria-label={`Role for ${user.email}`} value={user.role ?? 'customer'} disabled={isPending} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="min-h-10 rounded border border-muted bg-background px-2 py-1 text-xs font-medium text-foreground">
                          {ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role] || role}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-sm"><button type="button" aria-label={`Delete ${user.email}`} disabled={isPending} onClick={() => handleDelete(user.id)} className="rounded p-2 transition-colors hover:bg-muted"><Trash2 className="size-4 text-muted-foreground" /></button></td>
                  </tr>
                ))}
                {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">Loading users…</td></tr>}
                {!isLoading && filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No users found.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
