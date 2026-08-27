'use client'

import { ExternalLink, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type PickupStationMapItem = {
  id: string
  name: string
  address: string
  city: string
  region?: string | null
  phone?: string | null
  instructions?: string | null
  fee?: string | number | null
  latitude?: string | number | null
  longitude?: string | number | null
}

function coordinates(station: PickupStationMapItem) {
  const latitude = Number(station.latitude)
  const longitude = Number(station.longitude)
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null
}

export default function PickupStationMap({ stations, selectedId, onSelect, selectable = true }: { stations: PickupStationMapItem[]; selectedId?: string; onSelect?: (station: PickupStationMapItem) => void; selectable?: boolean }) {
  const selected = stations.find((station) => station.id === selectedId) || stations[0] || null
  const selectedCoordinates = selected ? coordinates(selected) : null
  const embedUrl = selectedCoordinates ? `https://www.google.com/maps?q=${selectedCoordinates.latitude},${selectedCoordinates.longitude}&z=16&output=embed` : null
  const externalMapUrl = selectedCoordinates ? `https://www.google.com/maps/search/?api=1&query=${selectedCoordinates.latitude},${selectedCoordinates.longitude}` : null

  if (stations.length === 0) return <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No pickup stations are available right now.</div>

  return (
    <div className="space-y-4">
      {embedUrl ? (
        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          <iframe title={`Map showing ${selected?.name || 'pickup station'}`} src={embedUrl} className="h-56 w-full border-0 sm:h-64" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          {externalMapUrl && <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-3 py-2"><p className="text-xs text-muted-foreground">{selected?.name}</p><a href={externalMapUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1 text-xs font-medium text-primary hover:underline"><ExternalLink className="size-3.5" aria-hidden="true" /> Open map</a></div>}
        </div>
      ) : (
        <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">Map coordinates are not available for the selected station yet.</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {stations.map((station) => {
          const active = station.id === selectedId || (!selectedId && station.id === selected?.id)
          const stationCoordinates = coordinates(station)
          const stationMapUrl = stationCoordinates ? `https://www.google.com/maps/search/?api=1&query=${stationCoordinates.latitude},${stationCoordinates.longitude}` : null
          const content = <><span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${active ? 'border-primary' : 'border-muted-foreground/50'}`}>{active && <span className="size-2.5 rounded-full bg-primary" />}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 text-sm font-medium"><span>{station.name}</span>{Number(station.fee) > 0 && <span className="text-xs text-primary">UGX {Number(station.fee).toLocaleString('en-UG')}</span>}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{station.address}, {station.city}{station.region ? `, ${station.region}` : ''}</span>{station.phone && <span className="mt-1 block text-xs text-muted-foreground">{station.phone}</span>}{station.instructions && <span className="mt-2 block text-xs leading-5 text-primary">{station.instructions}</span>}</span></>
          return selectable && onSelect ? <button key={station.id} type="button" onClick={() => onSelect(station)} aria-pressed={active} className={`flex min-h-20 w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/60'}`}>{content}</button> : <div key={station.id} className={`flex items-start gap-3 rounded-lg border p-4 ${active ? 'border-primary bg-primary/10' : 'border-border'}`}><MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />{content}<Button asChild variant="outline" size="sm" className="min-h-10 shrink-0"><a href={stationMapUrl || '#'} target="_blank" rel="noreferrer" aria-disabled={!stationMapUrl}><ExternalLink className="size-3.5" aria-hidden="true" /><span className="sr-only">Open map for {station.name}</span></a></Button></div>
        })}
      </div>
    </div>
  )
}
