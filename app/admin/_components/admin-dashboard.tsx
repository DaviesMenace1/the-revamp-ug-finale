'use client'

import Link from 'next/link'
import { ArrowUpRight, BarChart3, Boxes, ClipboardList, FolderKanban, UsersRound } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const PIE_COLORS = ['#b88a3f', '#8a6d3b', '#5c4a2e', '#d4af6a', '#a67c3d', '#726143', '#c19a5b']

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(value || 0)
}

function formatActivityDate(value: string) {
  return new Date(value).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

type DashboardData = {
  kpis: { totalRevenue: number; totalOrders: number; activeClients: number; pendingProjects: number }
  revenueByMonth: { month: string; revenue: number }[]
  ordersByWeek: { week: string; orders: number }[]
  productsByCategory: { category: string; count: number }[]
  activity: { action: string; detail: string; time: string }[]
  loadError?: string | null
}

export default function AdminDashboard({ data }: { data: DashboardData }) {
  const { kpis, revenueByMonth, ordersByWeek, productsByCategory, activity, loadError } = data
  const metrics = [
    { label: 'Revenue to date', value: formatCurrency(kpis.totalRevenue), icon: BarChart3, tone: 'bg-foreground text-background' },
    { label: 'Orders processed', value: kpis.totalOrders.toLocaleString('en-UG'), icon: ClipboardList, tone: 'bg-gold text-obsidian' },
    { label: 'Active clients', value: kpis.activeClients.toLocaleString('en-UG'), icon: UsersRound, tone: 'bg-card text-foreground' },
    { label: 'Projects in motion', value: kpis.pendingProjects.toLocaleString('en-UG'), icon: FolderKanban, tone: 'bg-card text-foreground' },
  ]

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <header className="mx-auto flex max-w-[1500px] flex-col gap-6 border-b border-border/70 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] uppercase tracking-[0.3em] text-primary">The Revamp operations · 01</p><h1 className="mt-3 font-serif text-4xl leading-none text-foreground sm:text-6xl">Dashboard</h1><p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">A live view of the studio’s commercial pulse, project work, and latest client activity.</p></div>
        <div className="flex flex-wrap gap-2"><Link prefetch={false} href="/admin/orders" className="inline-flex min-h-11 items-center gap-2 rounded border border-border bg-background px-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground hover:border-gold">Orders <ArrowUpRight className="size-4" /></Link><Link prefetch={false} href="/admin/client-projects" className="inline-flex min-h-11 items-center gap-2 rounded bg-foreground px-4 text-xs font-semibold uppercase tracking-[0.14em] text-background hover:bg-gold hover:text-obsidian">Projects <ArrowUpRight className="size-4" /></Link></div>
      </header>

      <main className="mx-auto mt-8 max-w-[1500px] space-y-6">
        {loadError && <div role="status" className="flex flex-col items-start justify-between gap-3 rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-50 sm:flex-row sm:items-center sm:gap-4"><span>{loadError}</span><button type="button" onClick={() => window.location.reload()} className="min-h-11 font-medium underline underline-offset-4">Retry</button></div>}

        <section aria-label="Business overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <Card key={metric.label} className="rounded-xl border-border/70 bg-card shadow-soft"><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><span className={`flex size-10 items-center justify-center rounded-lg ${metric.tone}`}><metric.icon className="size-4" /></span><span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Live</span></div><p className="mt-8 font-serif text-3xl text-foreground">{metric.value}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{metric.label}</p></CardContent></Card>)}</section>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
          <Card className="rounded-xl border-border/70 bg-card shadow-soft"><CardHeader className="flex flex-row items-end justify-between gap-4 border-b border-border/70 pb-5"><div><CardDescription className="text-[10px] uppercase tracking-[0.24em] text-primary">Commercial pulse</CardDescription><CardTitle className="mt-2 font-serif text-3xl font-normal">Revenue over time</CardTitle></div><span className="text-xs text-muted-foreground">Last six months</span></CardHeader><CardContent className="pt-6">{revenueByMonth.length === 0 ? <div className="flex h-[310px] items-center justify-center text-sm text-muted-foreground">No paid or pending orders yet.</div> : <ResponsiveContainer width="100%" height={310}><LineChart data={revenueByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} /><Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} contentStyle={{ borderRadius: 12, borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))' }} /><Line type="monotone" dataKey="revenue" stroke="#b88a3f" strokeWidth={3} dot={{ r: 3, fill: '#b88a3f' }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer>}</CardContent></Card>
          <Card className="rounded-xl border-border/70 bg-foreground text-background shadow-lift"><CardHeader><CardDescription className="text-[10px] uppercase tracking-[0.24em] text-gold">Studio pulse</CardDescription><CardTitle className="mt-2 font-serif text-3xl font-normal text-background">What needs attention.</CardTitle></CardHeader><CardContent className="space-y-5"><div className="border-t border-background/15 pt-5"><p className="font-serif text-4xl text-gold">{kpis.pendingProjects}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-background/55">Client projects in motion</p></div><div className="border-t border-background/15 pt-5"><p className="font-serif text-4xl text-background">{activity.length}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-background/55">Recent activity signals</p></div><Link prefetch={false} href="/admin/finance/documents" className="inline-flex min-h-11 items-center gap-2 border-b border-gold pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold hover:text-background">Open finance workspace <ArrowUpRight className="size-4" /></Link></CardContent></Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-xl border-border/70 bg-card shadow-soft"><CardHeader><CardDescription className="text-[10px] uppercase tracking-[0.24em] text-primary">Catalog mix</CardDescription><CardTitle className="mt-2 font-serif text-3xl font-normal">Products by category</CardTitle></CardHeader><CardContent>{productsByCategory.length === 0 ? <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No published products yet.</div> : <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={productsByCategory} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={94} paddingAngle={3} label={({ payload }) => { const entry = payload as { category?: string; count?: number } | undefined; return `${entry?.category ?? ''} (${entry?.count ?? 0})` }}>{productsByCategory.map((entry, index) => <Cell key={entry.category} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>}</CardContent></Card>
          <Card className="rounded-xl border-border/70 bg-card shadow-soft"><CardHeader className="flex flex-row items-end justify-between gap-4"><div><CardDescription className="text-[10px] uppercase tracking-[0.24em] text-primary">Latest movement</CardDescription><CardTitle className="mt-2 font-serif text-3xl font-normal">Recent activity</CardTitle></div><Link prefetch={false} href="/admin/orders" className="text-xs font-semibold uppercase tracking-[0.14em] text-primary hover:underline">Open records</Link></CardHeader><CardContent>{activity.length === 0 ? <div className="flex min-h-[250px] items-center justify-center text-sm text-muted-foreground">No recent activity yet.</div> : <div className="divide-y divide-border/70">{activity.map((item, index) => <div key={`${item.time}-${index}`} className="flex min-w-0 items-start gap-3 py-4 sm:items-center sm:gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-primary"><Boxes className="size-4" /></span><div className="min-w-0 flex-1"><p className="font-medium text-foreground">{item.action}</p><p className="truncate text-sm text-muted-foreground">{item.detail}</p></div><p className="max-w-[7rem] shrink-0 text-right text-xs text-muted-foreground sm:max-w-none">{formatActivityDate(item.time)}</p></div>)}</div>}</CardContent></Card>
        </section>

        <Card className="rounded-xl border-border/70 bg-card shadow-soft"><CardHeader className="flex flex-row items-end justify-between gap-4"><div><CardDescription className="text-[10px] uppercase tracking-[0.24em] text-primary">Order volume</CardDescription><CardTitle className="mt-2 font-serif text-3xl font-normal">Orders by week</CardTitle></div><span className="text-xs text-muted-foreground">Last four weeks</span></CardHeader><CardContent>{ordersByWeek.length === 0 ? <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">No orders in the past four weeks.</div> : <ResponsiveContainer width="100%" height={240}><BarChart data={ordersByWeek} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><Tooltip /><Bar dataKey="orders" fill="#b88a3f" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>}</CardContent></Card>
      </main>
    </div>
  )
}
