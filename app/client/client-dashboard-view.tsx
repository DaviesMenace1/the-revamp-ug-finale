import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowUpRight, Calendar, FileText, MessageSquare, Package, ShoppingBag } from 'lucide-react'
import { formatMoney } from '@/lib/utils'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Support', href: '/client/tickets' },
  { label: 'Documents', href: '/client/documents' },
]

type Stats = {
  orders: number
  activeProjects: number
  consultations: number
  unreadMessages: number
}

type RecentOrder = {
  id: string
  orderNumber: string
  total: string
  status: string | null
  paymentStatus: string | null
  createdAt: string
}

type RecentProject = {
  id: string
  title: string
  slug: string
  status: string | null
  progress: number | null
  updatedAt: string
}

type RecentConsultation = {
  id: string
  title: string
  status: string | null
  preferredDate: string | null
  createdAt: string
}

const statusTone: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900',
  processing: 'bg-blue-100 text-blue-900',
  shipped: 'bg-indigo-100 text-indigo-900',
  delivered: 'bg-emerald-100 text-emerald-900',
  confirmed: 'bg-emerald-100 text-emerald-900',
  consultation_scheduled: 'bg-gold/15 text-foreground',
  in_progress: 'bg-blue-100 text-blue-900',
  completed: 'bg-emerald-100 text-emerald-900',
}

function displayStatus(status: string | null | undefined) {
  return (status || 'pending').replace(/_/g, ' ')
}

function formatDate(value: string | null, withTime = false) {
  if (!value) return 'Date to be confirmed'
  return new Date(value).toLocaleDateString('en-UG', withTime ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ClientDashboardView({
  firstName,
  loadError,
  stats,
  recentOrders = [],
  recentProjects = [],
  recentConsultations = [],
}: {
  firstName: string | null
  loadError?: string | null
  stats: Stats
  recentOrders?: RecentOrder[]
  recentProjects?: RecentProject[]
  recentConsultations?: RecentConsultation[]
}) {
  const cards = [
    { label: 'Active projects', value: stats.activeProjects, icon: FileText, href: '/client/projects', accent: 'bg-foreground text-background' },
    { label: 'Orders placed', value: stats.orders, icon: ShoppingBag, href: '/client/orders', accent: 'bg-gold text-obsidian' },
    { label: 'Consultations', value: stats.consultations, icon: Calendar, href: '/client/consultations', accent: 'bg-muted text-foreground' },
    { label: 'Unread messages', value: stats.unreadMessages, icon: MessageSquare, href: '/client/messages', accent: 'bg-muted text-foreground' },
  ]

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-8 pb-8">
        <section className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-8 text-background shadow-lift sm:px-10 sm:py-10">
          <div className="absolute -right-24 -top-28 size-72 rounded-full border border-gold/30" />
          <div className="absolute -bottom-32 right-16 size-64 rounded-full border border-background/10" />
          <div className="relative max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.28em] text-gold">The Revamp studio</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-6xl">Welcome back{firstName ? `, ${firstName}` : ''}.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-background/70">Your projects, orders, consultations, and studio conversations in one considered view.</p>
          </div>
          <Link href="/book-consultation" className="relative mt-7 inline-flex min-h-11 items-center gap-2 rounded bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-obsidian transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-foreground">Book a consultation <ArrowUpRight className="size-4" /></Link>
        </section>

        {loadError && <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><span>{loadError}</span><button type="button" onClick={() => window.location.reload()} className="min-h-11 shrink-0 font-medium underline underline-offset-4">Retry</button></div>}

        <section aria-label="Account overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Link key={card.label} href={card.href} className="group min-w-0">
              <Card className="h-full rounded-xl border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-gold/60 hover:shadow-soft">
                <div className="flex items-start justify-between gap-4"><span className={`flex size-10 items-center justify-center rounded-lg ${card.accent}`}><card.icon className="size-4" /></span><ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div>
                <p className="mt-7 font-serif text-4xl text-foreground">{card.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">{card.label}</p>
              </Card>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-xl border-border/70 bg-card p-5 sm:p-7">
            <div className="flex items-end justify-between gap-4 border-b border-border/70 pb-5"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Your studio work</p><h2 className="mt-2 font-serif text-3xl text-foreground">Recent projects</h2></div><Link href="/client/projects" className="text-xs font-medium uppercase tracking-[0.14em] text-primary hover:underline">View all</Link></div>
            <div className="divide-y divide-border/70">
              {recentProjects.map((project) => <Link key={project.id} href={`/client/projects/${project.slug}`} className="group flex items-center gap-4 py-5"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-primary"><FileText className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate font-serif text-xl text-foreground group-hover:text-primary">{project.title}</span><span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className={`rounded-full px-2 py-1 capitalize ${statusTone[project.status || ''] || 'bg-muted text-muted-foreground'}`}>{displayStatus(project.status)}</span><span>{project.progress ?? 0}% complete</span><span>Updated {formatDate(project.updatedAt)}</span></span></span><ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>)}
              {recentProjects.length === 0 && <div className="py-12 text-center"><FileText className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">No projects have been linked to your account yet.</p><Link href="/book-consultation" className="mt-4 inline-flex min-h-11 items-center rounded border border-border px-4 text-xs uppercase tracking-widest text-foreground hover:border-gold">Start a project</Link></div>}
            </div>
          </Card>

          <Card className="rounded-xl border-border/70 bg-card p-5 sm:p-7">
            <div className="flex items-end justify-between gap-4 border-b border-border/70 pb-5"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Purchase history</p><h2 className="mt-2 font-serif text-3xl text-foreground">Recent orders</h2></div><Link href="/client/orders" className="text-xs font-medium uppercase tracking-[0.14em] text-primary hover:underline">View all</Link></div>
            <div className="divide-y divide-border/70">
              {recentOrders.map((order) => <Link key={order.id} href="/client/orders" className="group flex items-center gap-4 py-5"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold/15 text-primary"><Package className="size-4" /></span><span className="min-w-0 flex-1"><span className="block font-medium text-foreground group-hover:text-primary">{order.orderNumber}</span><span className="mt-1 block text-xs text-muted-foreground">{formatDate(order.createdAt)} · <span className="capitalize">{displayStatus(order.status)}</span></span></span><span className="shrink-0 text-right font-mono text-sm font-medium text-foreground">{formatMoney(order.total, 'UGX')}</span></Link>)}
              {recentOrders.length === 0 && <div className="py-12 text-center"><ShoppingBag className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">No previous orders were found for this account.</p><Link href="/collections" className="mt-4 inline-flex min-h-11 items-center rounded border border-border px-4 text-xs uppercase tracking-widest text-foreground hover:border-gold">Explore the collection</Link></div>}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-xl border-border/70 bg-muted/30 p-5 sm:p-7"><div className="flex items-end justify-between gap-4 border-b border-border/70 pb-5"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Next touchpoint</p><h2 className="mt-2 font-serif text-3xl text-foreground">Consultations</h2></div><Link href="/client/consultations" className="text-xs font-medium uppercase tracking-[0.14em] text-primary hover:underline">Open calendar</Link></div><div className="pt-5">{recentConsultations[0] ? <div className="flex gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background text-primary"><Calendar className="size-4" /></span><div><p className="font-serif text-2xl text-foreground">{recentConsultations[0].title}</p><p className="mt-2 text-sm text-muted-foreground">{recentConsultations[0].preferredDate ? formatDate(recentConsultations[0].preferredDate, true) : 'The studio will confirm your time shortly.'}</p><span className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${statusTone[recentConsultations[0].status || ''] || 'bg-muted text-muted-foreground'}`}>{displayStatus(recentConsultations[0].status)}</span></div></div> : <div className="py-4"><p className="text-sm leading-6 text-muted-foreground">No consultations are scheduled yet. When you are ready, we can help shape the next room.</p><Link href="/book-consultation" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded bg-foreground px-4 text-xs uppercase tracking-widest text-background hover:bg-gold hover:text-obsidian">Book time with the studio <ArrowUpRight className="size-4" /></Link></div>}</div></Card>
          <Card className="rounded-xl border-border/70 bg-foreground p-5 text-background shadow-lift sm:p-7"><div className="flex items-center gap-2 text-gold"><MessageSquare className="size-4" /><span className="text-[10px] uppercase tracking-[0.24em]">Studio conversation</span></div><h2 className="mt-4 max-w-md font-serif text-3xl sm:text-4xl">Need a second opinion on a piece or project?</h2><p className="mt-4 max-w-md text-sm leading-7 text-background/65">Send the studio a note and keep the full conversation, attachments, and updates in one place.</p><Link href="/client/messages" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded bg-gold px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-obsidian hover:bg-background">Open messages <ArrowUpRight className="size-4" /></Link></Card>
        </section>
      </div>
    </PortalLayout>
  )
}
