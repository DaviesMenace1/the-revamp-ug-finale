'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const PIE_COLORS = ['#b88a3f', '#8a6d3b', '#5c4a2e', '#d4af6a', '#a67c3d', '#726143', '#c19a5b']

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

type DashboardData = {
  kpis: {
    totalRevenue: number
    totalOrders: number
    activeClients: number
    pendingProjects: number
  }
  revenueByMonth: { month: string; revenue: number }[]
  ordersByWeek: { week: string; orders: number }[]
  productsByCategory: { category: string; count: number }[]
  activity: { action: string; detail: string; time: string }[]
}

export default function AdminDashboard({ data }: { data: DashboardData }) {
  const { kpis, revenueByMonth, ordersByWeek, productsByCategory, activity } = data

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="font-serif text-4xl font-light text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back. Here's your business overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-foreground">{formatCurrency(kpis.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-foreground">{kpis.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-foreground">{kpis.activeClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-foreground">{kpis.pendingProjects}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the past 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByMonth.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No orders yet — revenue will appear here once orders come in.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="revenue" stroke="#b88a3f" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Week</CardTitle>
            <CardDescription>Order volume over the past 4 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersByWeek.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No orders in the past 4 weeks.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ordersByWeek}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#b88a3f" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown + Recent activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Products by Category</CardTitle>
            <CardDescription>Published catalog items grouped by category</CardDescription>
          </CardHeader>
          <CardContent>
            {productsByCategory.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No published products yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productsByCategory}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.category} (${entry.count})`}
                  >
                    {productsByCategory.map((entry, index) => (
                      <Cell key={entry.category} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your business</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No recent activity yet.</p>
            ) : (
              <div className="space-y-4">
                {activity.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between border-b border-border/20 pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{item.action}</p>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.time).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
