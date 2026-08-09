// app/admin/layout.tsx
import { requirePortalUser } from '@/lib/auth/portal-auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortalUser(['admin'])

    return (
        <div>
              <div className="bg-muted/40 p-4 border-b">
                      <p className="text-sm font-medium">Welcome back, {user.firstName || 'Admin'}!</p>
                            </div>
                                  {children}
                                      </div>
                                        )
                                        }
                                        