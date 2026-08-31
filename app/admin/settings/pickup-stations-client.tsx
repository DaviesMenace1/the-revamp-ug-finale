'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ExternalLink, Pencil, Plus, Search, Save, Trash2, X } from '@/components/ui/luxury-icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import PickupStationMap from '@/components/delivery/pickup-station-map'
import {
  createPickupStation,
  deletePickupStation,
  type PickupStationRecord,
  updatePickupStation,
} from '@/lib/actions/pickup-stations'

type StationForm = {
  name: string
  address: string
  city: string
  region: string
  country: string
  phone: string
  instructions: string
  fee: string
  latitude: string
  longitude: string
  displayOrder: string
}

const EMPTY_FORM: StationForm = {
  name: '',
  address: '',
  city: 'Kampala',
  region: '',
  country: 'Uganda',
  phone: '',
  instructions: '',
  fee: '0',
  latitude: '',
  longitude: '',
  displayOrder: '0',
}

function formFromStation(station: PickupStationRecord): StationForm {
  return {
    name: station.name,
    address: station.address,
    city: station.city,
    region: station.region || '',
    country: station.country,
    phone: station.phone || '',
    instructions: station.instructions || '',
    fee: station.fee,
    latitude: station.latitude || '',
    longitude: station.longitude || '',
    displayOrder: String(station.displayOrder),
  }
}

function stationSearchText(station: PickupStationRecord) {
  return [station.name, station.address, station.city, station.region, station.country].filter(Boolean).join(' ').toLowerCase()
}

function stationMapUrl(station: PickupStationRecord) {
  const latitude = Number(station.latitude)
  const longitude = Number(station.longitude)
  if (Number.isFinite(latitude) && Number.isFinite(longitude) && !((latitude === 0 && longitude === 0) || (latitude === 0 && longitude === 32))) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${station.name}, ${station.address}, ${station.city}, ${station.country}`)}`
}

export default function PickupStationsClient({ initialStations }: { initialStations: PickupStationRecord[] }) {
  const router = useRouter()
  const [stations, setStations] = useState(initialStations)
  const [form, setForm] = useState<StationForm>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState(initialStations.find((station) => station.active)?.id || initialStations[0]?.id || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()


  const activeStations = useMemo(() => stations.filter((station) => station.active), [stations])
  const filteredStations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return query ? stations.filter((station) => stationSearchText(station).includes(query)) : stations
  }, [searchQuery, stations])
  const previewStations = activeStations.length > 0 ? activeStations : stations
  const previewStation = previewStations.find((station) => station.id === previewId) || previewStations[0] || null

  const updateForm = (key: keyof StationForm, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError(null)
  }

  const beginAdd = () => {
    resetForm()
    document.getElementById('pickup-station-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const save = () => {
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = editingId
        ? await updatePickupStation({ id: editingId, ...form })
        : await createPickupStation(form)
      if (!result.success) {
        setError(result.error || 'Could not save that pickup station.')
        return
      }
      const savedStation = result.station
      if (savedStation) {
        setStations((current) => editingId ? current.map((station) => station.id === savedStation.id ? savedStation : station) : [savedStation, ...current])
        setPreviewId(savedStation.id)
      }
      setMessage(editingId ? 'Pickup station updated.' : 'Pickup station added and made available after refresh.')
      resetForm()
      router.refresh()
    })
  }

  const toggle = (station: PickupStationRecord) => {
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await updatePickupStation({ id: station.id, ...formFromStation(station), active: !station.active })
      if (!result.success) {
        setError(result.error || 'Could not update that pickup station.')
        return
      }
      setStations((current) => current.map((item) => item.id === station.id ? { ...item, active: !station.active } : item))
      setMessage(`${station.name} is now ${station.active ? 'hidden from' : 'available in'} checkout.`)
      router.refresh()
    })
  }

  const remove = (station: PickupStationRecord) => {
    if (!window.confirm(`Remove ${station.name} from pickup options?`)) return
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await deletePickupStation(station.id)
      if (!result.success) {
        setError(result.error || 'Could not remove that pickup station.')
        return
      }
      setStations((current) => current.filter((item) => item.id !== station.id))
      if (editingId === station.id) resetForm()
      setPreviewId((current) => current === station.id ? activeStations.find((item) => item.id !== station.id)?.id || '' : current)
      setMessage('Pickup station removed.')
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Pickup stations</CardTitle>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">{activeStations.length} active</span>
            </div>
            <CardDescription className="mt-2 max-w-2xl">Choose the places customers can collect orders. Active stations appear in checkout and order tracking.</CardDescription>
          </div>
          <Button type="button" onClick={beginAdd} className="min-h-11 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-2 size-4" aria-hidden="true" /> Add station</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-7">
        {(message || error) && <p role={error ? 'alert' : 'status'} className={`rounded-md border px-3 py-2 text-sm ${error ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'}`}>{error || message}</p>}

        {previewStations.length > 0 && <section className="rounded-xl border border-border/70 bg-muted/10 p-4 sm:p-5" aria-labelledby="pickup-station-preview-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Customer preview</p>
              <h3 id="pickup-station-preview-heading" className="mt-1 font-serif text-2xl">Select a station to preview</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Tap a station card to see its map and the exact details customers will receive.</p>
            </div>
            {previewStation && <a href={stationMapUrl(previewStation)} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 text-xs font-medium text-primary hover:underline"><ExternalLink className="size-3.5" aria-hidden="true" /> Open selected map</a>}
          </div>
          <div className="mt-5">
            <PickupStationMap stations={previewStations} selectedId={previewStation?.id} onSelect={(station) => setPreviewId(station.id)} />
          </div>
        </section>}

        <section id="pickup-station-form" className="scroll-mt-24 rounded-xl border border-border/70 bg-muted/20 p-4 sm:p-5" aria-labelledby="pickup-station-form-heading">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{editingId ? 'Edit station' : 'Add station'}</p>
              <h3 id="pickup-station-form-heading" className="mt-1 font-serif text-2xl">{editingId ? 'Update pickup details' : 'Create a pickup station'}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Name, address, and city are required. If coordinates are left blank, customers can still open the saved address in Google Maps.</p>
            </div>
            {editingId && <Button type="button" variant="ghost" size="sm" onClick={resetForm}><X className="mr-2 size-4" aria-hidden="true" /> Cancel</Button>}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="mb-2 block text-sm font-medium text-foreground" htmlFor="pickup-name">Station name</label><Input id="pickup-name" value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="UN Mall, Kyanja" className="min-h-11 border-muted" /></div>
            <div className="sm:col-span-2"><label className="mb-2 block text-sm font-medium text-foreground" htmlFor="pickup-address">Full address</label><Input id="pickup-address" value={form.address} onChange={(event) => updateForm('address', event.target.value)} placeholder="UN Mall, Kyanja, Kampala, Uganda" className="min-h-11 border-muted" /></div>
            <div><label className="mb-2 block text-sm font-medium text-foreground" htmlFor="pickup-city">City</label><Input id="pickup-city" value={form.city} onChange={(event) => updateForm('city', event.target.value)} placeholder="Kampala" className="min-h-11 border-muted" /></div>
            <div><label className="mb-2 block text-sm font-medium text-foreground" htmlFor="pickup-region">Area / region</label><Input id="pickup-region" value={form.region} onChange={(event) => updateForm('region', event.target.value)} placeholder="Kyanja" className="min-h-11 border-muted" /></div>
          </div>
          <details className="mt-5 rounded-lg border border-border/70 bg-background/60 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground">More station details</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {([
                ['country', 'Country', 'Uganda'],
                ['phone', 'Station phone', '+256 700 000000'],
                ['fee', 'Pickup fee (UGX)', '0'],
                ['displayOrder', 'Display order', '0'],
                ['latitude', 'Latitude (optional)', '0.3476'],
                ['longitude', 'Longitude (optional)', '32.5825'],
              ] as const).map(([key, label, placeholder]) => (
                <div key={key}><label className="mb-2 block text-sm font-medium text-foreground" htmlFor={`pickup-${key}`}>{label}</label><Input id={`pickup-${key}`} value={form[key]} onChange={(event) => updateForm(key, event.target.value)} placeholder={placeholder} inputMode={key === 'fee' || key === 'displayOrder' || key === 'latitude' || key === 'longitude' ? 'decimal' : undefined} className="min-h-11 border-muted" /></div>
              ))}
              <div className="sm:col-span-2"><label className="mb-2 block text-sm font-medium text-foreground" htmlFor="pickup-instructions">Collection instructions</label><Textarea id="pickup-instructions" value={form.instructions} onChange={(event) => updateForm('instructions', event.target.value)} placeholder="Bring your order confirmation and a valid ID." rows={3} className="resize-none border-muted" /></div>
            </div>
          </details>
          <Button type="button" disabled={isPending} onClick={save} className="mt-5 min-h-11 bg-primary text-primary-foreground hover:bg-primary/90">
            {editingId ? <Save className="mr-2 size-4" aria-hidden="true" /> : <Plus className="mr-2 size-4" aria-hidden="true" />}
            {isPending ? 'Saving…' : editingId ? 'Save station' : 'Add station'}
          </Button>
        </section>

        <section aria-labelledby="pickup-station-list-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h3 id="pickup-station-list-heading" className="font-serif text-2xl">All stations</h3><p className="mt-1 text-xs text-muted-foreground">Search, edit, hide, or remove pickup locations.</p></div>
            <div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search stations" aria-label="Search pickup stations" className="min-h-11 pl-9" /></div>
          </div>
          <div className="mt-4 space-y-3">
            {filteredStations.length === 0 ? <p className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">No pickup stations match this search.</p> : filteredStations.map((station) => (
              <div key={station.id} className={`rounded-xl border p-4 transition-colors ${previewId === station.id ? 'border-primary/60 bg-primary/5' : 'border-border/70'}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <button type="button" onClick={() => setPreviewId(station.id)} className="flex min-w-0 items-start gap-3 text-left" aria-pressed={previewId === station.id}>
                    <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${previewId === station.id ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/50 text-transparent'}`}><Check className="size-3.5" aria-hidden="true" /></span>
                    <span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><span className="font-medium text-foreground">{station.name}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${station.active ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{station.active ? 'Active' : 'Hidden'}</span></span><span className="mt-1 block text-sm text-muted-foreground">{station.address}</span><span className="mt-1 block text-xs text-muted-foreground">{station.city}{station.region ? ` · ${station.region}` : ''}{station.phone ? ` · ${station.phone}` : ''}</span><span className="mt-2 block text-xs font-medium text-primary">{Number(station.fee) > 0 ? `Pickup fee: UGX ${Number(station.fee).toLocaleString('en-UG')}` : 'Free pickup'}</span></span>
                  </button>
                  <div className="flex flex-wrap gap-2 lg:justify-end"><Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => toggle(station)}>{station.active ? 'Hide' : 'Activate'}</Button><Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => { setEditingId(station.id); setForm(formFromStation(station)); setError(null); setMessage(null); document.getElementById('pickup-station-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}><Pencil className="mr-2 size-3.5" aria-hidden="true" /> Edit</Button><Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => remove(station)} className="text-destructive hover:text-destructive"><Trash2 className="mr-2 size-3.5" aria-hidden="true" /> Remove</Button></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
