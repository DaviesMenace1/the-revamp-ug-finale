'use client'

import { useMemo, useState } from 'react'
import { ExternalLink, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type PickupStationMapItem = {
  id: string
  name: string
  address: string
  city: string
  country?: string | null
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
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if ((latitude === 0 && longitude === 0) || (latitude === 0 && longitude === 32)) return null
  return { latitude, longitude }
}

function stationQuery(station: PickupStationMapItem) {
  return encodeURIComponent([station.name, station.address, station.city, station.region, station.country].filter(Boolean).join(', '))
}

export default function PickupStationMap({ stations, selectedId, onSelect, selectable = true }: { stations: PickupStationMapItem[]; selectedId?: string; onSelect?: (station: PickupStationMapItem) => void; selectable?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('')
  const selected = stations.find((station) => station.id === selectedId) || stations[0] || null
  const visibleStations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return stations
    return stations.filter((station) => [station.name, station.address, station.city, station.region, station.country].filter(Boolean).join(' ').toLowerCase().includes(query))
  }, [searchQuery, stations])
  const selectedCoordinates = selected ? coordinates(selected) : null
  const embedUrl = selected ? selectedCoordinates ? `https://www.google.com/maps?q=${selectedCoordinates.latitude},${selectedCoordinates.longitude}&z=16&output=embed` : `https://www.google.com/maps?q=${stationQuery(selected)}&z=16&output=embed` : null
  const externalMapUrl = selected ? selectedCoordinates ? `https://www.google.com/maps/search/?api=1&query=${selectedCoordinates.latitude},${selectedCoordinates.longitude}` : `https://www.google.com/maps/search/?api=1&query=${stationQuery(selected)}` : null

  if (stations.length === 0) return <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No pickup stations are available right now.</div>

  return (
    <div className="space-y-4">
      {embedUrl ? (
        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          <iframe title={`Map showing ${selected?.name || 'pickup station'}`} src={embedUrl} className="h-56 w-full border-0 sm:h-64" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          {externalMapUrl && <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-3 py-2"><p className="text-xs text-muted-foreground">{selected?.name}</p><a href={externalMapUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1 text-xs font-medium text-primary hover:underline"><ExternalLink className="size-3.5" aria-hidden="true" /> Open map</a></div>}
        </div>
      ) : (
        <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">This station will open in Google Maps using its saved address.</div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="pickup-station-search" className="sr-only">Search pickup stations</label>
        <input id="pickup-station-search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by station, area, or city" className="min-h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {visibleStations.length === 0 ? <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground sm:col-span-2">No pickup stations match that search.</p> : visibleStations.map((station) => {
          const active = station.id === selectedId || (!selectedId && station.id === selected?.id)
          const stationCoordinates = coordinates(station)
          const stationMapUrl = stationCoordinates ? `https://www.google.com/maps/search/?api=1&query=${stationCoordinates.latitude},${stationCoordinates.longitude}` : `https://www.google.com/maps/search/?api=1&query=${stationQuery(station)}`
          const content = <><span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${active ? 'border-primary' : 'border-muted-foreground/50'}`}>{active && <span className="size-2.5 rounded-full bg-primary" />}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 text-sm font-medium"><span>{station.name}</span>{Number(station.fee) > 0 && <span className="text-xs text-primary">UGX {Number(station.fee).toLocaleString('en-UG')}</span>}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{station.address}, {station.city}{station.region ? `, ${station.region}` : ''}</span>{station.phone && <span className="mt-1 block text-xs text-muted-foreground">{station.phone}</span>}{station.instructions && <span className="mt-2 block text-xs leading-5 text-primary">{station.instructions}</span>}</span></>
          return selectable && onSelect ? <button key={station.id} type="button" onClick={() => onSelect(station)} aria-pressed={active} className={`flex min-h-20 w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/60'}`}>{content}</button> : <div key={station.id} className={`flex items-start gap-3 rounded-lg border p-4 ${active ? 'border-primary bg-primary/10' : 'border-border'}`}><MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />{content}<Button asChild variant="outline" size="sm" className="min-h-10 shrink-0"><a href={stationMapUrl || '#'} target="_blank" rel="noreferrer" aria-disabled={!stationMapUrl}><ExternalLink className="size-3.5" aria-hidden="true" /><span className="sr-only">Open map for {station.name}</span></a></Button></div>
        })}
      </div>
    </div>
  )
}
