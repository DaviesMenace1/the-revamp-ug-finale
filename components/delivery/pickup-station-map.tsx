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

function mapCenter(stations: PickupStationMapItem[], selected: PickupStationMapItem | null) {
  const located = stations.map(coordinates).filter((value): value is { latitude: number; longitude: number } => Boolean(value))
  if (selected) {
    const selectedLocation = coordinates(selected)
    if (selectedLocation) return selectedLocation
  }
  if (located.length === 0) return null
  return {
    latitude: located.reduce((sum, value) => sum + value.latitude, 0) / located.length,
    longitude: located.reduce((sum, value) => sum + value.longitude, 0) / located.length,
  }
}

function mapZoom(stations: PickupStationMapItem[]) {
  const located = stations.map(coordinates).filter((value): value is { latitude: number; longitude: number } => Boolean(value))
  if (located.length < 2) return 16
  const latitudeSpan = Math.max(...located.map((value) => value.latitude)) - Math.min(...located.map((value) => value.latitude))
  const longitudeSpan = Math.max(...located.map((value) => value.longitude)) - Math.min(...located.map((value) => value.longitude))
  return Math.max(11, Math.min(15, Math.round(15 - Math.max(latitudeSpan, longitudeSpan) * 2)))
}

export default function PickupStationMap({ stations, selectedId, onSelect, selectable = true }: { stations: PickupStationMapItem[]; selectedId?: string; onSelect?: (station: PickupStationMapItem) => void; selectable?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('')
  const selected = stations.find((station) => station.id === selectedId) || stations[0] || null
  const visibleStations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return stations
    return stations.filter((station) => [station.name, station.address, station.city, station.region, station.country].filter(Boolean).join(' ').toLowerCase().includes(query))
  }, [searchQuery, stations])
  const center = mapCenter(stations, selected)
  const coordinateBounds = useMemo(() => {
    const located = stations.map(coordinates).filter((value): value is { latitude: number; longitude: number } => Boolean(value))
    if (located.length === 0) return null
    return {
      latitudeSpan: Math.max(0.02, Math.max(...located.map((value) => value.latitude)) - Math.min(...located.map((value) => value.latitude))),
      longitudeSpan: Math.max(0.02, Math.max(...located.map((value) => value.longitude)) - Math.min(...located.map((value) => value.longitude))),
    }
  }, [stations])
  const selectedCoordinates = selected ? coordinates(selected) : null
  const mapQuery = center ? `${center.latitude},${center.longitude}` : selected ? stationQuery(selected) : ''
  const embedUrl = mapQuery ? `https://www.google.com/maps?q=${mapQuery}&z=${mapZoom(stations)}&output=embed` : null
  const externalMapUrl = selected ? selectedCoordinates ? `https://www.google.com/maps/search/?api=1&query=${selectedCoordinates.latitude},${selectedCoordinates.longitude}` : `https://www.google.com/maps/search/?api=1&query=${stationQuery(selected)}` : null

  if (stations.length === 0) return <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No pickup stations are available right now.</div>

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-border bg-muted">
        <div className="relative h-64 sm:h-72">
          {embedUrl ? <iframe title="Pickup station map" src={embedUrl} className="pointer-events-none absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">Stations without saved coordinates can still be selected from the list and opened in Google Maps by address.</div>}
          {center && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/5" aria-hidden="true" />}
          {center && <div className="absolute inset-0">
            {visibleStations.map((station) => {
              const location = coordinates(station)
              if (!location) return null
              if (!coordinateBounds) return null
              const left = 50 + ((location.longitude - center.longitude) / coordinateBounds.longitudeSpan) * 42
              const top = 50 - ((location.latitude - center.latitude) / coordinateBounds.latitudeSpan) * 42
              const active = station.id === selectedId || (!selectedId && station.id === selected?.id)
              return <button key={station.id} type="button" onClick={() => selectable && onSelect?.(station)} disabled={!selectable || !onSelect} aria-label={`Select ${station.name}`} aria-pressed={active} className={`pointer-events-auto absolute z-10 -translate-x-1/2 -translate-y-full transition-transform ${active ? 'scale-110' : 'hover:scale-110'}`} style={{ left: `${Math.max(7, Math.min(93, left))}%`, top: `${Math.max(12, Math.min(88, top))}%` }}><span className={`flex size-11 items-center justify-center rounded-full border-2 border-white shadow-lg ${active ? 'bg-primary text-primary-foreground' : 'bg-card text-primary'}`}><MapPin className="size-5" fill="currentColor" aria-hidden="true" /></span><span className={`mt-1 hidden max-w-40 truncate rounded-full px-2 py-1 text-[10px] font-semibold shadow-md sm:block ${active ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'}`}>{station.name}</span></button>
            })}
          </div>}
          {selectable && onSelect && <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-card/95 px-3 py-2 text-[11px] font-medium text-foreground shadow-md">Tap a pin to select a station</div>}
        </div>
        {externalMapUrl && <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-3 py-2"><p className="min-w-0 truncate text-xs text-muted-foreground">Selected: {selected?.name}</p><a href={externalMapUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"><ExternalLink className="size-3.5" aria-hidden="true" /> Open map</a></div>}
      </div>

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
