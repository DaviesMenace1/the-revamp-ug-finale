import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Search, Shield } from 'lucide-react'
import { Input } from '@/components/ui/input'

const users = [
  { id: 1, name: 'Faridah Nakayiwa', email: 'faridah@revampug.com', role: 'ADMIN', status: 'Active', joinDate: '2024-01-15' },
  { id: 2, name: 'Davis Musinguzi', email: 'davis@revampug.com', role: 'ADMIN', status: 'Active', joinDate: '2024-01-15' },
  { id: 3, name: 'Sarah Kiwanuka', email: 'sarah.k@example.com', role: 'CLIENT', status: 'Active', joinDate: '2024-06-10' },
  { id: 4, name: 'John Mutua', email: 'john.m@example.com', role: 'TRADE', status: 'Active', joinDate: '2024-07-22' },
  { id: 5, name: 'Emma Rodriguez', email: 'emma.r@example.com', role: 'MEMBERSHIP', status: 'Active', joinDate: '2024-08-01' },
]

export default function AdminUsers() {
  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground">Users & Members</h1>
          <p className="text-muted-foreground mt-2">Manage user accounts and permissions</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none">
          <Plus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>{users.length} total users</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-10 rounded-none border-muted" />
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Join Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-border/20 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 text-sm text-foreground font-medium">{user.name}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="py-4 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        {user.role === 'ADMIN' && <Shield className="w-4 h-4 text-primary" />}
                        <span className="px-2 py-1 bg-muted rounded text-xs font-medium text-foreground">{user.role}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">{user.status}</span>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{user.joinDate}</td>
                    <td className="py-4 px-4 text-sm flex gap-2">
                      <button className="p-1.5 hover:bg-muted rounded transition-colors">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 hover:bg-muted rounded transition-colors">
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
