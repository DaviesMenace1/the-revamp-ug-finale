'use client'

/* Map tiles are already optimized raster assets from the tile provider. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react'
import { ExternalLink, LocateFixed, MapPin, Minus, Plus, Search } from 'lucide-react'
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

type Coordinates = { latitude: number; longitude: number }
type MapSize = { width: number; height: number }

const TILE_SIZE = 256
const MIN_ZOOM = 3
const MAX_ZOOM = 18
const MAX_LATITUDE = 85.05112878
const DEFAULT_MAP_SIZE = { width: 640, height: 288 }

function coordinates(station: PickupStationMapItem): Coordinates | null {
  const latitude = Number(station.latitude)
  const longitude = Number(station.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if ((latitude === 0 && longitude === 0) || (latitude === 0 && longitude === 32)) return null
  if (latitude < -MAX_LATITUDE || latitude > MAX_LATITUDE || longitude < -180 || longitude > 180) return null
  return { latitude, longitude }
}

function stationQuery(station: PickupStationMapItem) {
  return encodeURIComponent([station.name, station.address, station.city, station.region, station.country].filter(Boolean).join(', '))
}

function averageCenter(stations: PickupStationMapItem[], selected: PickupStationMapItem | null): Coordinates | null {
  const selectedLocation = selected ? coordinates(selected) : null
  if (selectedLocation) return selectedLocation

  const located = stations.map(coordinates).filter((value): value is Coordinates => Boolean(value))
  if (located.length === 0) return null
  return {
    latitude: located.reduce((sum, value) => sum + value.latitude, 0) / located.length,
    longitude: located.reduce((sum, value) => sum + value.longitude, 0) / located.length,
  }
}

function mapZoom(stations: PickupStationMapItem[]) {
  const located = stations.map(coordinates).filter((value): value is Coordinates => Boolean(value))
  if (located.length < 2) return 15
  const latitudeSpan = Math.max(...located.map((value) => value.latitude)) - Math.min(...located.map((value) => value.latitude))
  const longitudeSpan = Math.max(...located.map((value) => value.longitude)) - Math.min(...located.map((value) => value.longitude))
  return Math.max(10, Math.min(15, Math.round(15 - Math.max(latitudeSpan, longitudeSpan) * 2)))
}

function clampLatitude(latitude: number) {
  return Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude))
}

function wrapLongitude(longitude: number) {
  return ((longitude + 180) % 360 + 360) % 360 - 180
}

function worldSize(zoom: number) {
  return TILE_SIZE * 2 ** zoom
}

function longitudeToX(longitude: number, zoom: number) {
  return ((longitude + 180) / 360) * worldSize(zoom)
}

function latitudeToY(latitude: number, zoom: number) {
  const radians = (clampLatitude(latitude) * Math.PI) / 180
  return (0.5 - Math.log((1 + Math.sin(radians)) / (1 - Math.sin(radians))) / (4 * Math.PI)) * worldSize(zoom)
}

function xToLongitude(x: number, zoom: number) {
  return wrapLongitude((x / worldSize(zoom)) * 360 - 180)
}

function yToLatitude(y: number, zoom: number) {
  const normalized = 0.5 - y / worldSize(zoom)
  return clampLatitude((360 / Math.PI) * Math.atan(Math.exp(normalized * 2 * Math.PI)) - 90)
}

function tileUrl(x: number, y: number, zoom: number) {
  const tileCount = 2 ** zoom
  const wrappedX = ((x % tileCount) + tileCount) % tileCount
  if (y < 0 || y >= tileCount) return null
  return `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`
}

function formatFee(fee: PickupStationMapItem['fee']) {
  const value = Number(fee)
  return Number.isFinite(value) && value > 0 ? `UGX ${value.toLocaleString('en-UG')}` : 'Free pickup'
}

export default function PickupStationMap({ stations, selectedId, onSelect, selectable = true }: { stations: PickupStationMapItem[]; selectedId?: string; onSelect?: (station: PickupStationMapItem) => void; selectable?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('')
  const selected = stations.find((station) => station.id === selectedId) || stations[0] || null
  const initialCenter = useMemo(() => averageCenter(stations, selected), [stations, selected])
  const [viewState, setViewState] = useState<{ center: Coordinates; zoom: number } | null>(() => initialCenter ? { center: initialCenter, zoom: mapZoom(stations) } : null)
  const view = viewState || (initialCenter ? { center: initialCenter, zoom: mapZoom(stations) } : null)
  const [mapSize, setMapSize] = useState<MapSize>(DEFAULT_MAP_SIZE)
  const mapRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; x: number; y: number; moved: boolean } | null>(null)

  const visibleStations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return stations
    return stations.filter((station) => [station.name, station.address, station.city, station.region, station.country].filter(Boolean).join(' ').toLowerCase().includes(query))
  }, [searchQuery, stations])

  useEffect(() => {
    const element = mapRef.current
    if (!element) return
    const updateSize = () => setMapSize({ width: element.clientWidth || DEFAULT_MAP_SIZE.width, height: element.clientHeight || DEFAULT_MAP_SIZE.height })
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const mapPoint = view ? { x: longitudeToX(view.center.longitude, view.zoom), y: latitudeToY(view.center.latitude, view.zoom) } : null
  const tileRadius = 2
  const centerTileX = mapPoint ? Math.floor(mapPoint.x / TILE_SIZE) : 0
  const centerTileY = mapPoint ? Math.floor(mapPoint.y / TILE_SIZE) : 0
  const tiles = view && mapPoint ? Array.from({ length: (tileRadius * 2 + 1) ** 2 }, (_, index) => {
    const offsetX = (index % (tileRadius * 2 + 1)) - tileRadius
    const offsetY = Math.floor(index / (tileRadius * 2 + 1)) - tileRadius
    const x = centerTileX + offsetX
    const y = centerTileY + offsetY
    return { x, y, yUrl: tileUrl(x, y, view.zoom) }
  }).filter((tile): tile is { x: number; y: number; yUrl: string } => Boolean(tile.yUrl)) : []

  const moveByPixels = (deltaX: number, deltaY: number) => {
    if (!view || !mapPoint) return
    const nextX = mapPoint.x - deltaX
    const nextY = Math.max(0, Math.min(worldSize(view.zoom), mapPoint.y - deltaY))
    setViewState({ ...view, center: { latitude: yToLatitude(nextY, view.zoom), longitude: xToLongitude(nextX, view.zoom) } })
  }

  const zoomAt = (nextZoom: number) => {
    if (!view || !mapPoint) return
    const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom))
    if (zoom === view.zoom) return
    const ratio = 2 ** (zoom - view.zoom)
    const nextX = mapPoint.x * ratio
    const nextY = mapPoint.y * ratio
    setViewState({ center: { latitude: yToLatitude(nextY, zoom), longitude: xToLongitude(nextX, zoom) }, zoom })
  }

  const resetView = () => {
    if (initialCenter) setViewState({ center: initialCenter, zoom: mapZoom(stations) })
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const deltaX = event.clientX - drag.x
    const deltaY = event.clientY - drag.y
    if (Math.abs(deltaX) + Math.abs(deltaY) > 3) drag.moved = true
    moveByPixels(deltaX, deltaY)
    drag.x = event.clientX
    drag.y = event.clientY
  }

  const finishPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveByPixels(-64, 0) }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveByPixels(64, 0) }
    if (event.key === 'ArrowUp') { event.preventDefault(); moveByPixels(0, -64) }
    if (event.key === 'ArrowDown') { event.preventDefault(); moveByPixels(0, 64) }
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomAt((view?.zoom || MIN_ZOOM) + 1) }
    if (event.key === '-') { event.preventDefault(); zoomAt((view?.zoom || MIN_ZOOM) - 1) }
  }

  const externalMapUrl = selected ? coordinates(selected) ? `https://www.google.com/maps/search/?api=1&query=${coordinates(selected)?.latitude},${coordinates(selected)?.longitude}` : `https://www.google.com/maps/search/?api=1&query=${stationQuery(selected)}` : null

  if (stations.length === 0) return <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No pickup stations are available right now.</div>

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-border bg-muted">
        {view && mapPoint ? <div ref={mapRef} role="application" aria-label="Interactive pickup station map. Drag or use the arrow keys to pan. Use plus and minus to zoom." tabIndex={0} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishPointer} onPointerCancel={finishPointer} onKeyDown={handleKeyDown} className="relative h-72 touch-none select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-80">
          <div className="absolute inset-0 bg-[#e7e3d8]">
            {tiles.map((tile) => <img key={`${tile.x}-${tile.y}-${view.zoom}`} src={tile.yUrl} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute size-64 max-w-none" style={{ left: `calc(50% + ${(tile.x * TILE_SIZE) - mapPoint.x}px)`, top: `calc(50% + ${(tile.y * TILE_SIZE) - mapPoint.y}px)` }} />)}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10" aria-hidden="true" />
          <div className="absolute inset-0">
            {visibleStations.map((station) => {
              const location = coordinates(station)
              if (!location) return null
              const point = { x: longitudeToX(location.longitude, view.zoom), y: latitudeToY(location.latitude, view.zoom) }
              const left = mapSize.width / 2 + point.x - mapPoint.x
              const top = mapSize.height / 2 + point.y - mapPoint.y
              if (left < -48 || top < -64 || left > mapSize.width + 48 || top > mapSize.height + 64) return null
              const active = station.id === selectedId || (!selectedId && station.id === selected?.id)
              return <button key={station.id} type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => selectable && onSelect?.(station)} disabled={!selectable || !onSelect} aria-label={`Select ${station.name}`} aria-pressed={active} className="pointer-events-auto absolute z-10 -translate-x-1/2 -translate-y-full transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-none" style={{ left, top }}><span className={`flex size-11 items-center justify-center rounded-full border-2 border-white shadow-lg ${active ? 'bg-primary text-primary-foreground' : 'bg-card text-primary'}`}><MapPin className="size-5" fill="currentColor" aria-hidden="true" /></span><span className={`mt-1 hidden max-w-40 truncate rounded-full px-2 py-1 text-[10px] font-semibold shadow-md sm:block ${active ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'}`}>{station.name}</span></button>
            })}
          </div>
          <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => zoomAt((view?.zoom || MIN_ZOOM) + 1)} className="flex size-11 items-center justify-center rounded-md border border-border bg-card/95 text-foreground shadow-md hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Zoom in"><Plus className="size-4" aria-hidden="true" /></button>
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => zoomAt((view?.zoom || MIN_ZOOM) - 1)} className="flex size-11 items-center justify-center rounded-md border border-border bg-card/95 text-foreground shadow-md hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Zoom out"><Minus className="size-4" aria-hidden="true" /></button>
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={resetView} className="flex size-11 items-center justify-center rounded-md border border-border bg-card/95 text-foreground shadow-md hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Recenter map"><LocateFixed className="size-4" aria-hidden="true" /></button>
          </div>
          {selectable && onSelect && <div className="pointer-events-none absolute bottom-3 left-3 z-20 max-w-[calc(100%-5rem)] rounded-full bg-card/95 px-3 py-2 text-[11px] font-medium text-foreground shadow-md">Drag to move the map. Tap a pin to select.</div>}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="absolute bottom-1 right-1 z-20 rounded bg-card/80 px-1 text-[9px] text-foreground/80">© OpenStreetMap</a>
        </div> : <div className="flex h-72 items-center justify-center p-4 text-center text-sm text-muted-foreground sm:h-80">Stations without saved coordinates can still be selected from the list and opened in Google Maps by address.</div>}
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
          const content = <><span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${active ? 'border-primary' : 'border-muted-foreground/50'}`}>{active && <span className="size-2.5 rounded-full bg-primary" />}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 text-sm font-medium"><span>{station.name}</span><span className="text-xs text-primary">{formatFee(station.fee)}</span></span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{station.address}, {station.city}{station.region ? `, ${station.region}` : ''}</span>{station.phone && <span className="mt-1 block text-xs text-muted-foreground">{station.phone}</span>}{station.instructions && <span className="mt-2 block text-xs leading-5 text-primary">{station.instructions}</span>}</span></>
          return selectable && onSelect ? <button key={station.id} type="button" onClick={() => onSelect(station)} aria-pressed={active} className={`flex min-h-20 w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/60'}`}>{content}</button> : <div key={station.id} className={`flex items-start gap-3 rounded-lg border p-4 ${active ? 'border-primary bg-primary/10' : 'border-border'}`}><MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />{content}<Button asChild variant="outline" size="sm" className="min-h-10 shrink-0"><a href={stationMapUrl || '#'} target="_blank" rel="noreferrer" aria-disabled={!stationMapUrl}><ExternalLink className="size-3.5" aria-hidden="true" /><span className="sr-only">Open map for {station.name}</span></a></Button></div>
        })}
      </div>
    </div>
  )
}
