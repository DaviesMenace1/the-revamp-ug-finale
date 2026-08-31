'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, BarChart3, Boxes, ClipboardList, FolderKanban, RefreshCw, UsersRound } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const PIE_COLORS = ['#b88a3f', '#8a6d3b', '#5c4a2e', '#d4af6a', '#a67c3d', '#726143', '#c19a5b']
const TIMELINES = [
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '6h', label: '6 hours' },
  { value: '24h', label: '24 hours' },
  { value: '30d', label: '30 days' },
  { value: '6m', label: '6 months' },
  { value: '1y', label: '1 year' },
] as const

type Timeline = typeof TIMELINES[number]['value']
type TrendPoint = { label: string; revenue: number; orders: number }

type DashboardData = {
  kpis: { totalRevenue: number; totalOrders: number; activeClients: number; pendingProjects: number }
  trend: TrendPoint[]
  productsByCategory: { category: string; count: number }[]
  activity: { action: string; detail: string; time: string }[]
  loadError?: string | null
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(value || 0)
}

function formatCompactCurrency(value: number) {
  const amount = Number(value || 0)
  if (amount >= 1_000_000) return `UGX ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `UGX ${(amount / 1_000).toFixed(0)}K`
  return `UGX ${amount.toFixed(0)}`
}

function formatActivityDate(value: string) {
  return new Date(value).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function TimelinePicker({ value, onChange }: { value: Timeline; onChange: (value: Timeline) => void }) {
  return (
    <div className="grid w-full grid-cols-2 gap-1 rounded-lg border border-border/70 bg-muted/35 p-1 sm:flex sm:flex-wrap" aria-label="Chart timeline">
      {TIMELINES.map((timeline) => (
        <button key={timeline.value} type="button" aria-pressed={value === timeline.value} onClick={() => onChange(timeline.value)} className={`min-h-9 min-w-0 rounded-md px-2 py-2 text-[11px] font-medium leading-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 sm:px-3 ${value === timeline.value ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}>
          {timeline.label}
        </button>
      ))}
    </div>
  )
}

function ChartState({ loading, error, empty, onRetry }: { loading: boolean; error: string | null; empty: boolean; onRetry: () => void }) {
  if (loading) return <div className="flex h-[280px] items-center justify-center" aria-busy="true"><div className="flex items-center gap-2 text-sm text-muted-foreground"><RefreshCw className="size-4 animate-spin" aria-hidden="true" /> Updating chart…</div></div>
  if (error) return <div className="flex h-[280px] flex-col items-center justify-center gap-3 px-4 text-center"><p className="text-sm text-muted-foreground">{error}</p><button type="button" onClick={onRetry} className="inline-flex min-h-10 items-center gap-2 rounded border border-border px-3 text-xs font-semibold uppercase tracking-[0.12em] text-foreground hover:bg-muted"><RefreshCw className="size-3.5" aria-hidden="true" /> Retry</button></div>
  if (empty) return <div className="flex h-[280px] items-center justify-center px-4 text-center text-sm text-muted-foreground">No activity in this time window yet.</div>
  return null
}

export default function AdminDashboard({ data }: { data: DashboardData }) {
  const { kpis, trend: initialTrend, productsByCategory, activity, loadError } = data
  const [timeline, setTimeline] = useState<Timeline>('30d')
  const [remoteTrend, setRemoteTrend] = useState<TrendPoint[] | null>(null)
  const [trendError, setTrendError] = useState<string | null>(null)
  const [isTrendLoading, setIsTrendLoading] = useState(false)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (timeline === '30d') return

    const controller = new AbortController()
    fetch(`/api/admin/dashboard?range=${timeline}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as { trend?: TrendPoint[]; error?: string }
        if (!response.ok) throw new Error(payload.error || 'The chart data could not be loaded.')
        return payload
      })
      .then((payload) => {
        if (!controller.signal.aborted) setRemoteTrend(Array.isArray(payload.trend) ? payload.trend : [])
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setTrendError(error instanceof Error ? error.message : 'The chart data could not be loaded.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsTrendLoading(false)
      })

    return () => controller.abort()
  }, [timeline, retryToken])

  const handleTimelineChange = (value: Timeline) => {
    setTimeline(value)
    setRemoteTrend(value === '30d' ? initialTrend : null)
    setTrendError(null)
    setIsTrendLoading(value !== '30d')
  }

  const retryTrend = () => {
    setTrendError(null)
    setIsTrendLoading(true)
    setRetryToken((value) => value + 1)
  }

  const trend = useMemo(() => timeline === '30d' ? initialTrend : remoteTrend || [], [timeline, initialTrend, remoteTrend])
  const revenueTrend = useMemo(() => trend.map((point) => ({ ...point, revenueLabel: formatCompactCurrency(point.revenue) })), [trend])
  const orderTotal = useMemo(() => trend.reduce((total, point) => total + point.orders, 0), [trend])
  const revenueWindowTotal = useMemo(() => trend.reduce((total, point) => total + point.revenue, 0), [trend])
  const metrics = [
    { label: 'Revenue to date', value: formatCurrency(kpis.totalRevenue), icon: BarChart3, tone: 'bg-foreground text-background', accent: 'from-foreground/10' },
    { label: 'Orders processed', value: kpis.totalOrders.toLocaleString('en-UG'), icon: ClipboardList, tone: 'bg-gold text-obsidian', accent: 'from-gold/20' },
    { label: 'Active clients', value: kpis.activeClients.toLocaleString('en-UG'), icon: UsersRound, tone: 'bg-card text-foreground', accent: 'from-primary/10' },
    { label: 'Projects in motion', value: kpis.pendingProjects.toLocaleString('en-UG'), icon: FolderKanban, tone: 'bg-card text-foreground', accent: 'from-muted' },
  ]
  const selectedTimeline = TIMELINES.find((item) => item.value === timeline)?.label || '30 days'
  const chartEmpty = trend.length === 0

  return (
    <div className="min-h-dvh bg-muted/30 px-3 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
      <header className="mx-auto flex max-w-[1500px] flex-col gap-6 border-b border-border/70 pb-7 lg:flex-row lg:items-end lg:justify-between lg:pb-8">
        <div><p className="text-[10px] uppercase tracking-[0.3em] text-primary">The Revamp operations · 01</p><h1 className="mt-3 font-serif text-4xl leading-none text-foreground sm:text-6xl">Dashboard</h1><p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">A live view of the studio’s commercial pulse, project work, and latest client activity.</p></div>
        <div className="flex flex-wrap gap-2"><Link prefetch={false} href="/admin/orders" className="inline-flex min-h-11 items-center gap-2 rounded border border-border bg-background px-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-gold">Orders <ArrowUpRight className="size-4" /></Link><Link prefetch={false} href="/admin/client-projects" className="inline-flex min-h-11 items-center gap-2 rounded bg-foreground px-4 text-xs font-semibold uppercase tracking-[0.14em] text-background transition-colors hover:bg-gold hover:text-obsidian">Projects <ArrowUpRight className="size-4" /></Link></div>
      </header>

      <main className="mx-auto mt-6 max-w-[1500px] space-y-6 lg:mt-8">
        {loadError && <div role="status" className="flex flex-col items-start justify-between gap-3 rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-50 sm:flex-row sm:items-center sm:gap-4"><span>{loadError}</span><button type="button" onClick={() => window.location.reload()} className="min-h-11 font-medium underline underline-offset-4">Retry</button></div>}

        <section aria-label="Business overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric, index) => <Card key={metric.label} className={`group relative overflow-hidden rounded-xl border-border/70 bg-gradient-to-br ${metric.accent} to-card shadow-soft transition-transform duration-200 hover:-translate-y-0.5`}><div className="absolute -right-8 -top-8 size-28 rounded-full bg-primary/5 blur-2xl transition-transform duration-300 group-hover:scale-125" aria-hidden="true" /><CardContent className="relative p-5"><div className="flex items-start justify-between gap-4"><span className={`flex size-10 items-center justify-center rounded-lg ${metric.tone}`}><metric.icon className="size-4" aria-hidden="true" /></span><span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><span className={`size-1.5 rounded-full ${index === 0 ? 'bg-emerald-500' : 'bg-primary'}`} aria-hidden="true" />Live</span></div><p className="mt-8 font-serif text-3xl text-foreground">{metric.value}</p><p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{metric.label}</p></CardContent></Card>)}</section>

        <section aria-label="Business trends" className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/75 p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Time window</p><p className="mt-1 text-sm text-muted-foreground">Compare activity from the last {selectedTimeline.toLowerCase()}.</p></div><TimelinePicker value={timeline} onChange={handleTimelineChange} /></div>
          <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
            <Card className="rounded-xl border-border/70 bg-card shadow-soft"><CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><CardDescription className="text-[10px] uppercase tracking-[0.24em] text-primary">Commercial pulse</CardDescription><CardTitle className="mt-2 font-serif text-3xl font-normal">Revenue over time</CardTitle></div><span className="text-xs tabular-nums text-muted-foreground">{formatCompactCurrency(revenueWindowTotal)} in window</span></CardHeader><CardContent className="pt-6"><ChartState loading={isTrendLoading} error={trendError} empty={chartEmpty} onRetry={retryTrend} />{!isTrendLoading && !trendError && !chartEmpty && <><div className="h-[280px] w-full" role="img" aria-label={`Revenue trend for the last ${selectedTimeline.toLowerCase()}`}><ResponsiveContainer width="100%" height="100%"><LineChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} minTickGap={18} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(value) => formatCompactCurrency(Number(value))} width={58} /><Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} contentStyle={{ borderRadius: 12, borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))' }} /><Line type="monotone" dataKey="revenue" name="Revenue" stroke="#b88a3f" strokeWidth={3} dot={{ r: 3, fill: '#b88a3f' }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div><p className="sr-only">Revenue in this window totals {formatCurrency(revenueWindowTotal)}.</p></>}</CardContent></Card>
            <Card className="rounded-xl border-border/70 bg-card shadow-soft"><CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><CardDescription className="text-[10px] uppercase tracking-[0.24em] text-primary">Order activity</CardDescription><CardTitle className="mt-2 font-serif text-3xl font-normal">Orders in time</CardTitle></div><span className="text-xs tabular-nums text-muted-foreground">{orderTotal.toLocaleString('en-UG')} orders</span></CardHeader><CardContent className="pt-6"><ChartState loading={isTrendLoading} error={trendError} empty={chartEmpty} onRetry={retryTrend} />{!isTrendLoading && !trendError && !chartEmpty && <><div className="h-[280px] w-full" role="img" aria-label={`Order trend for the last ${selectedTimeline.toLowerCase()}`}><ResponsiveContainer width="100%" height="100%"><BarChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} minTickGap={18} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={30} /><Tooltip formatter={(value) => `${Number(value ?? 0).toLocaleString('en-UG')} orders`} contentStyle={{ borderRadius: 12, borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))' }} /><Legend /><Bar dataKey="orders" name="Orders" fill="#b88a3f" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div><p className="sr-only">There were {orderTotal.toLocaleString('en-UG')} orders in this window.</p></>}</CardContent></Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-xl border-border/70 bg-card shadow-soft"><CardHeader><CardDescription className="text-[10px] uppercase tracking-[0.24em] text-primary">Catalog mix</CardDescription><CardTitle className="mt-2 font-serif text-3xl font-normal">Products by category</CardTitle></CardHeader><CardContent>{productsByCategory.length === 0 ? <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No published products yet.</div> : <div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={productsByCategory} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={94} paddingAngle={3} label={({ payload }) => { const entry = payload as { category?: string; count?: number } | undefined; return `${entry?.category ?? ''} (${entry?.count ?? 0})` }}>{productsByCategory.map((entry, index) => <Cell key={entry.category} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>}</CardContent></Card>
          <Card className="rounded-xl border-border/70 bg-card shadow-soft"><CardHeader className="flex flex-row items-end justify-between gap-4"><div><CardDescription className="text-[10px] uppercase tracking-[0.24em] text-primary">Latest movement</CardDescription><CardTitle className="mt-2 font-serif text-3xl font-normal">Recent activity</CardTitle></div><Link prefetch={false} href="/admin/orders" className="text-xs font-semibold uppercase tracking-[0.14em] text-primary hover:underline">Open records</Link></CardHeader><CardContent>{activity.length === 0 ? <div className="flex min-h-[250px] items-center justify-center text-sm text-muted-foreground">No recent activity yet.</div> : <div className="divide-y divide-border/70">{activity.map((item, index) => <div key={`${item.time}-${index}`} className="flex min-w-0 items-start gap-3 py-4 sm:items-center sm:gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-primary"><Boxes className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="font-medium text-foreground">{item.action}</p><p className="truncate text-sm text-muted-foreground">{item.detail}</p></div><p className="max-w-[7rem] shrink-0 text-right text-xs text-muted-foreground sm:max-w-none">{formatActivityDate(item.time)}</p></div>)}</div>}</CardContent></Card>
        </section>

        <Card className="rounded-xl border-border/70 bg-foreground text-background shadow-lift"><CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><p className="text-[10px] uppercase tracking-[0.24em] text-gold">Studio pulse</p><h2 className="mt-2 font-serif text-3xl font-normal text-background">What needs attention.</h2><p className="mt-2 text-sm text-background/65">{kpis.pendingProjects} client projects are in motion, with {activity.length} recent activity signals to review.</p></div><Link prefetch={false} href="/admin/finance/documents" className="inline-flex min-h-11 shrink-0 items-center gap-2 border-b border-gold pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold hover:text-background">Open finance workspace <ArrowUpRight className="size-4" /></Link></CardContent></Card>
      </main>
    </div>
  )
}
