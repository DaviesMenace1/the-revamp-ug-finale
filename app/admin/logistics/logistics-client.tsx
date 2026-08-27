'use client'

import { useMemo, useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle2, Clock3, MapPin, PackageCheck, Search, Truck, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateShipmentStatus, assignShipment } from '@/lib/actions/logistics'
import { SHIPMENT_STATUS_DESCRIPTIONS, SHIPMENT_STATUS_LABELS, SHIPMENT_STATUSES, type ShipmentStatus } from '@/lib/logistics/status'

interface LogisticsRow {
  shipment: {
    id: string
    orderId: string
    trackingCode: string
    status: ShipmentStatus
    assignedTo: string | null
    assignedAt: Date | string | null
    estimatedDeliveryAt: Date | string | null
    lastNote: string | null
    updatedAt: Date | string
  }
  order: {
    id: string
    orderNumber: string
    userId: string
    total: string | number
    paymentStatus: string | null
    paymentMode: string
    deliveryAddress: unknown
    createdAt: Date | string
  }
  assignee: { id: string; firstName: string | null; lastName: string | null; email: string; role: string | null } | null
}

interface StaffMember {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  role: string | null
}

function addressSummary(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Delivery details unavailable'
  const address = value as Record<string, unknown>
  if (address.deliveryMethod === 'pickup_station' && address.pickupStation && typeof address.pickupStation === 'object') {
    const station = address.pickupStation as Record<string, unknown>
    return `Pickup: ${String(station.name || 'Selected station')}`
  }
  return `Door delivery: ${String(address.city || address.address || 'Saved address')}`
}

function mapUrl(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const address = value as Record<string, unknown>
  const station = address.pickupStation && typeof address.pickupStation === 'object' ? address.pickupStation as Record<string, unknown> : null
  const latitude = Number(station?.latitude)
  const longitude = Number(station?.longitude)
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` : null
}

function money(value: string | number) {
  return `UGX ${Number(value || 0).toLocaleString('en-UG')}`
}

function staffName(staff: StaffMember) {
  return [staff.firstName, staff.lastName].filter(Boolean).join(' ') || staff.email
}

function iconForStatus(status: ShipmentStatus) {
  if (status === 'exception') return AlertTriangle
  if (status === 'out_for_delivery') return Truck
  if (status === 'delivered' || status === 'collected') return CheckCircle2
  if (status === 'packed' || status === 'ready_for_pickup') return PackageCheck
  return Clock3
}

export default function LogisticsClient({ initialRows, staff }: { initialRows: LogisticsRow[]; staff: StaffMember[] }) {
  const [rows, setRows] = useState(initialRows)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ShipmentStatus>('all')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.shipment.status === statusFilter
      const matchesTerm = !term || [row.order.orderNumber, row.shipment.trackingCode, row.assignee?.email, addressSummary(row.order.deliveryAddress)].filter(Boolean).some((value) => String(value).toLowerCase().includes(term))
      return matchesStatus && matchesTerm
    })
  }, [query, rows, statusFilter])

  const updateRow = (shipmentId: string, patch: Partial<LogisticsRow['shipment']>) => setRows((current) => current.map((row) => row.shipment.id === shipmentId ? { ...row, shipment: { ...row.shipment, ...patch } } : row))

  const changeStatus = (row: LogisticsRow, status: ShipmentStatus) => {
    setError(null)
    setPendingId(row.shipment.id)
    startTransition(async () => {
      const result = await updateShipmentStatus({ shipmentId: row.shipment.id, status, note: row.shipment.lastNote || undefined })
      if (result.success) updateRow(row.shipment.id, { status, updatedAt: new Date() })
      else setError(result.error || 'The shipment status could not be updated.')
      setPendingId(null)
    })
  }

  const changeAssignee = (row: LogisticsRow, assignedTo: string) => {
    setError(null)
    setPendingId(row.shipment.id)
    startTransition(async () => {
      const result = await assignShipment(row.shipment.id, assignedTo || null)
      if (result.success) {
        const assignee = staff.find((member) => member.id === assignedTo) || null
        updateRow(row.shipment.id, { assignedTo: assignedTo || null, assignedAt: assignedTo ? new Date() : null, lastNote: assignedTo && assignee ? `Assigned to ${staffName(assignee)}.` : 'Shipment assignment cleared.' })
      } else setError(result.error || 'The shipment assignment could not be updated.')
      setPendingId(null)
    })
  }

  const counts = useMemo(() => SHIPMENT_STATUSES.reduce<Record<string, number>>((result, status) => { result[status] = rows.filter((row) => row.shipment.status === status).length; return result }, {}), [rows])

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] uppercase tracking-[0.28em] text-primary">Fulfilment control</p><h1 className="mt-2 font-serif text-4xl font-light text-foreground sm:text-5xl">Logistics</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Follow every order from preparation to delivery or pickup, with a visible history for the customer.</p></div><div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4"><div className="rounded-lg border border-border bg-card px-3 py-2"><p className="text-xl font-semibold tabular-nums">{rows.length}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Shipments</p></div><div className="rounded-lg border border-border bg-card px-3 py-2"><p className="text-xl font-semibold tabular-nums">{counts.exception || 0}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Exceptions</p></div><div className="rounded-lg border border-border bg-card px-3 py-2"><p className="text-xl font-semibold tabular-nums">{counts.out_for_delivery || 0}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">On route</p></div><div className="rounded-lg border border-border bg-card px-3 py-2"><p className="text-xl font-semibold tabular-nums">{(counts.delivered || 0) + (counts.collected || 0)}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed</p></div></div></div>
      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
      <div className="grid gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_220px]"><label className="relative block"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order or tracking code" aria-label="Search logistics" className="min-h-11 pl-9" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ShipmentStatus)} aria-label="Filter shipments by status" className="min-h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground"><option value="all">All statuses</option>{SHIPMENT_STATUSES.map((status) => <option key={status} value={status}>{SHIPMENT_STATUS_LABELS[status]}</option>)}</select></div>
      <div className="grid gap-4 xl:grid-cols-2">{filteredRows.map((row) => { const Icon = iconForStatus(row.shipment.status); const map = mapUrl(row.order.deliveryAddress); const busy = isPending && pendingId === row.shipment.id; return <article key={row.shipment.id} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:p-5"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></span><div className="min-w-0"><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{row.order.orderNumber}</p><p className="mt-1 truncate font-mono text-xs text-primary">{row.shipment.trackingCode}</p><p className="mt-2 text-sm font-medium text-foreground">{addressSummary(row.order.deliveryAddress)}</p></div></div><p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{money(row.order.total)}</p></div><p className="mt-4 text-xs leading-5 text-muted-foreground">{SHIPMENT_STATUS_DESCRIPTIONS[row.shipment.status]}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs font-medium text-muted-foreground">Status<select value={row.shipment.status} disabled={busy} onChange={(event) => changeStatus(row, event.target.value as ShipmentStatus)} className="mt-1 min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"><option value={row.shipment.status}>{SHIPMENT_STATUS_LABELS[row.shipment.status]}</option>{SHIPMENT_STATUSES.filter((status) => status !== row.shipment.status).map((status) => <option key={status} value={status}>{SHIPMENT_STATUS_LABELS[status]}</option>)}</select></label><label className="space-y-1 text-xs font-medium text-muted-foreground">Assigned team member<select value={row.shipment.assignedTo || ''} disabled={busy} onChange={(event) => changeAssignee(row, event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"><option value="">Unassigned</option>{staff.map((member) => <option key={member.id} value={member.id}>{staffName(member)}</option>)}</select></label></div><div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><UserRound className="size-3.5" aria-hidden="true" />{row.assignee ? [row.assignee.firstName, row.assignee.lastName].filter(Boolean).join(' ') || row.assignee.email : 'Unassigned'}</span><span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden="true" />{addressSummary(row.order.deliveryAddress)}</span>{map && <Button asChild variant="outline" size="sm" className="ml-auto min-h-10"><a href={map} target="_blank" rel="noreferrer">Open pickup map</a></Button>}</div>{row.shipment.lastNote && <div className="mt-4 rounded-md bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">{row.shipment.lastNote}</div>}</article>})}</div>
      {filteredRows.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No shipments match the current filter.</div>}
    </div>
  )
}
