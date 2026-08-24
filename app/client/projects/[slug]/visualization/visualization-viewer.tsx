'use client'

import { Suspense, useRef, useState } from 'react'
import Link from 'next/link'
import { Canvas } from '@react-three/fiber'
import { Center, OrbitControls, useGLTF, useProgress } from '@react-three/drei'
import { ArrowLeft, Expand, RotateCcw, Box, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PortalLayout } from '@/components/portals/portal-layout'

const clientNavItems = [
  { label: 'Overview', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Documents', href: '/client/documents' },
  { label: 'Consultations', href: '/client/consultations' },
]

type VisualizationAsset = {
  id: string
  title: string
  description: string | null
  assetType: string
  thumbnailUrl: string | null
  version: number
  approvalStatus: string
  createdAt: string
  viewerUrl: string
}

type Props = {
  project: { id: string; slug: string; title: string }
  assets: VisualizationAsset[]
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} dispose={null} />
}

function LoadingOverlay() {
  const { progress } = useProgress()
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /><p className="mt-3 text-sm text-foreground">Loading visualization {Math.round(progress)}%</p></div>
    </div>
  )
}

export default function VisualizationViewer({ project, assets }: Props) {
  const [selectedId, setSelectedId] = useState(assets[0]?.id ?? '')
  const [resetKey, setResetKey] = useState(0)
  const [error, setError] = useState('')
  const viewerRef = useRef<HTMLDivElement>(null)
  const selected = assets.find((asset) => asset.id === selectedId) ?? assets[0]

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await viewerRef.current?.requestFullscreen()
      else await document.exitFullscreen()
    } catch {
      setError('Fullscreen is not available in this browser.')
    }
  }

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-6">
        <Link href={`/client/projects/${project.slug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to {project.title}</Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="text-xs uppercase tracking-[0.22em] text-primary">Project visualization</p><h1 className="mt-2 break-words font-serif text-3xl font-light sm:text-4xl">{project.title}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Explore the approved GLB/GLTF models shared for this project. Drag to rotate, scroll or pinch to zoom, and right-drag to pan.</p></div><div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" className="rounded-none" onClick={() => setResetKey((key) => key + 1)} disabled={!selected}><RotateCcw className="mr-2 h-4 w-4" />Reset view</Button><Button type="button" variant="outline" className="rounded-none" onClick={toggleFullscreen} disabled={!selected}><Expand className="mr-2 h-4 w-4" />Fullscreen</Button></div></div>

        {error && <div role="alert" className="flex items-center gap-2 rounded border border-rose-300/70 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-400/40 dark:bg-rose-950/40 dark:text-rose-100"><AlertTriangle className="h-4 w-4" />{error}</div>}

        {assets.length === 0 ? (
          <Card className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center"><Box className="h-10 w-10 text-muted-foreground" /><h2 className="mt-4 font-serif text-2xl">No visualization shared yet</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Your project team has not published a GLB or GLTF model for this project.</p></Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div ref={viewerRef} className="relative min-h-[380px] overflow-hidden rounded-lg border border-border/20 bg-[#e8e6df] sm:min-h-[520px]" aria-label={`${selected?.title ?? 'Project'} 3D viewer`}>
              {selected && (
                <Canvas key={`${selected.id}-${resetKey}`} camera={{ position: [4, 3, 5], fov: 42 }} dpr={[1, 1.5]} onCreated={() => setError('')}>
                  <color attach="background" args={['#e8e6df']} />
                  <ambientLight intensity={1.2} />
                  <directionalLight position={[5, 8, 5]} intensity={2} />
                  <Suspense fallback={<LoadingOverlay />}><Center><Model url={selected.viewerUrl} /></Center></Suspense>
                  <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={1.5} maxDistance={20} />
                </Canvas>
              )}
              <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-background/80 px-3 py-2 text-xs text-muted-foreground">{selected?.title}</div>
            </div>
            <Card className="h-fit p-4"><h2 className="font-serif text-xl font-light">Models</h2><p className="mt-1 text-xs text-muted-foreground">Choose a published model</p><div className="mt-4 space-y-2">{assets.map((asset) => <button key={asset.id} type="button" onClick={() => { setSelectedId(asset.id); setError('') }} className={`w-full rounded border p-3 text-left transition-colors ${selected?.id === asset.id ? 'border-primary bg-primary/5' : 'border-border/20 hover:bg-muted/50'}`} aria-pressed={selected?.id === asset.id}><span className="block text-sm font-medium text-foreground">{asset.title}</span><span className="mt-1 block text-xs capitalize text-muted-foreground">{asset.assetType} · v{asset.version} · {asset.approvalStatus.replace('_', ' ')}</span></button>)}</div></Card>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
