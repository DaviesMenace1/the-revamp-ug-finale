'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

export default function PickupStationsClient({ initialStations }: { initialStations: PickupStationRecord[] }) {
  const router = useRouter()
  const [stations, setStations] = useState(initialStations)
  const [form, setForm] = useState<StationForm>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const updateForm = (key: keyof StationForm, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError(null)
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
      setMessage(editingId ? 'Pickup station updated.' : 'Pickup station added.')
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
      setMessage('Pickup station removed.')
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Pickup stations</CardTitle>
            <CardDescription>Add and manage the places customers can collect their orders.</CardDescription>
          </div>
          <MapPin className="size-5 text-primary" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {(message || error) && <p role={error ? 'alert' : 'status'} className={`rounded-md border px-3 py-2 text-sm ${error ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'}`}>{error || message}</p>}

        <div className="rounded-lg border border-border/70 bg-muted/20 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-medium">{editingId ? 'Edit pickup station' : 'Add pickup station'}</h3>
              <p className="mt-1 text-xs text-muted-foreground">The first station is seeded at UN Mall in Kyanja. Add more whenever you are ready.</p>
            </div>
            {editingId && <Button type="button" variant="ghost" size="sm" onClick={resetForm}><X className="mr-2 size-4" aria-hidden="true" /> Cancel</Button>}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {([
              ['name', 'Station name', 'UN Mall, Kyanja'],
              ['address', 'Full address', 'UN Mall, Kyanja, Kampala, Uganda'],
              ['city', 'City', 'Kampala'],
              ['region', 'Area / region', 'Kyanja'],
              ['country', 'Country', 'Uganda'],
              ['phone', 'Station phone', '+256 700 000000'],
              ['fee', 'Pickup fee (UGX)', '0'],
              ['displayOrder', 'Display order', '0'],
              ['latitude', 'Latitude (optional)', '0.0000000'],
              ['longitude', 'Longitude (optional)', '32.0000000'],
            ] as const).map(([key, label, placeholder]) => (
              <div key={key}>
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor={`pickup-${key}`}>{label}</label>
                <Input id={`pickup-${key}`} value={form[key]} onChange={(event) => updateForm(key, event.target.value)} placeholder={placeholder} inputMode={key === 'fee' || key === 'displayOrder' || key === 'latitude' || key === 'longitude' ? 'decimal' : undefined} className="min-h-11 border-muted" />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="pickup-instructions">Collection instructions</label>
              <Textarea id="pickup-instructions" value={form.instructions} onChange={(event) => updateForm('instructions', event.target.value)} placeholder="Bring your order confirmation and a valid ID." rows={3} className="resize-none border-muted" />
            </div>
          </div>
          <Button type="button" disabled={isPending} onClick={save} className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90">
            {editingId ? <Save className="mr-2 size-4" aria-hidden="true" /> : <Plus className="mr-2 size-4" aria-hidden="true" />}
            {isPending ? 'Saving…' : editingId ? 'Save station' : 'Add station'}
          </Button>
        </div>

        <div className="space-y-3">
          {stations.length === 0 ? <p className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">No pickup stations have been configured.</p> : stations.map((station) => (
            <div key={station.id} className="flex flex-col gap-4 rounded-lg border border-border/70 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{station.name}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${station.active ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{station.active ? 'Active' : 'Hidden'}</span></div>
                  <p className="mt-1 text-sm text-muted-foreground">{station.address}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{station.city}{station.region ? ` · ${station.region}` : ''}{station.phone ? ` · ${station.phone}` : ''}</p>
                  <p className="mt-2 text-xs font-medium text-primary">{Number(station.fee) > 0 ? `Pickup fee: UGX ${Number(station.fee).toLocaleString('en-UG')}` : 'Free pickup'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => toggle(station)}>{station.active ? 'Hide' : 'Activate'}</Button>
                <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => { setEditingId(station.id); setForm(formFromStation(station)); setError(null); setMessage(null) }}><Pencil className="mr-2 size-3.5" aria-hidden="true" /> Edit</Button>
                <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => remove(station)} className="text-destructive hover:text-destructive"><Trash2 className="mr-2 size-3.5" aria-hidden="true" /> Remove</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
