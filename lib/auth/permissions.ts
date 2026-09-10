import type { UserRole } from '@/lib/auth/utils'

export type { UserRole }

export const STAFF_ROLES = [
  'admin',
  'editor',
  'operations_manager',
  'logistics_coordinator',
  'support_agent',
  'finance_viewer',
] as const satisfies readonly UserRole[]

export type StaffRole = (typeof STAFF_ROLES)[number]

export const ADMIN_ROLES = ['admin'] as const satisfies readonly UserRole[]

export type AdminPermission =
  | 'view_admin'
  | 'manage_staff'
  | 'manage_settings'
  | 'view_finance'
  | 'manage_finance'
  | 'manage_content'
  | 'view_orders'
  | 'manage_orders'
  | 'manage_logistics'
  | 'view_customers'
  | 'manage_support'
  | 'manage_loyalty'
  | 'manage_projects'

const permissionRoles: Record<AdminPermission, readonly UserRole[]> = {
  view_admin: STAFF_ROLES,
  manage_staff: ADMIN_ROLES,
  manage_settings: ADMIN_ROLES,
  view_finance: ['admin', 'finance_viewer'],
  manage_finance: ['admin', 'finance_viewer'],
  manage_content: ['admin', 'editor'],
  view_orders: ['admin', 'operations_manager', 'logistics_coordinator', 'support_agent', 'finance_viewer'],
  manage_orders: ['admin', 'operations_manager'],
  manage_logistics: ['admin', 'operations_manager', 'logistics_coordinator'],
  view_customers: ['admin', 'operations_manager', 'support_agent'],
  manage_support: ['admin', 'operations_manager', 'support_agent'],
  manage_loyalty: ['admin', 'operations_manager'],
  manage_projects: ['admin', 'designer', 'architect', 'interior_designer', 'operations_manager'],
}

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  designer: 'Designer',
  admin: 'Administrator',
  trade_member: 'Trade member',
  architect: 'Architect',
  interior_designer: 'Interior designer',
  editor: 'Content editor',
  operations_manager: 'Operations manager',
  logistics_coordinator: 'Logistics coordinator',
  support_agent: 'Support agent',
  finance_viewer: 'Finance viewer',
}

export function hasPermission(role: UserRole | null | undefined, permission: AdminPermission) {
  return Boolean(role && permissionRoles[permission].includes(role))
}

export function requiredPermissionForAdminPath(pathname: string): AdminPermission {
  const path = pathname.replace(/\/$/, '') || '/admin'
  if (path === '/admin' || path === '/admin/dashboard') return 'view_admin'
  if (path === '/admin/users' || path.startsWith('/admin/users/')) return 'manage_staff'
  if (path === '/admin/trade-applications' || path.startsWith('/admin/trade-applications/')) return 'manage_staff'
  if (path === '/admin/settings' || path.startsWith('/admin/settings/')) return 'manage_settings'
  if (path === '/admin/billing' || path.startsWith('/admin/billing/') || path === '/admin/finance' || path.startsWith('/admin/finance/')) return 'view_finance'
  if (path === '/admin/orders' || path.startsWith('/admin/orders/')) return 'view_orders'
  if (path === '/admin/logistics' || path.startsWith('/admin/logistics/')) return 'manage_logistics'
  if (path === '/admin/messages' || path.startsWith('/admin/messages/') || path === '/admin/tickets' || path.startsWith('/admin/tickets/') || path === '/admin/service-requests' || path.startsWith('/admin/service-requests/')) return 'manage_support'
  if (path === '/admin/projects' || path.startsWith('/admin/projects/') || path === '/admin/client-projects' || path.startsWith('/admin/client-projects/') || path === '/admin/consultations' || path.startsWith('/admin/consultations/')) return 'manage_projects'
  if (path === '/admin/loyalty' || path.startsWith('/admin/loyalty/')) return 'manage_loyalty'
  if (path === '/admin/products' || path.startsWith('/admin/products/') || path === '/admin/categories' || path.startsWith('/admin/categories/') || path === '/admin/blogs' || path.startsWith('/admin/blogs/') || path === '/admin/faqs' || path.startsWith('/admin/faqs/') || path === '/admin/services' || path.startsWith('/admin/services/') || path === '/admin/events' || path.startsWith('/admin/events/') || path === '/admin/community' || path.startsWith('/admin/community/')) return 'manage_content'
  return 'manage_settings'
}

export function adminPathIsAllowed(role: UserRole | null | undefined, pathname: string) {
  return hasPermission(role, requiredPermissionForAdminPath(pathname))
}

export function roleLabel(role: UserRole | null | undefined) {
  return role ? ROLE_LABELS[role] : 'Staff'
}
