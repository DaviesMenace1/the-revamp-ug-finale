'use client'

import { Component, Suspense, useEffect, useRef, useState, type ComponentRef, type ErrorInfo, type ReactNode } from 'react'
import Link from 'next/link'
import { Canvas, useThree } from '@react-three/fiber'
import { Center, OrbitControls, useGLTF, useProgress } from '@react-three/drei'
import { MathUtils, Vector3 } from 'three'
import { ArrowLeft, Box, Expand, Info, Loader2, Minus, Pause, Play, Plus, RotateCcw, AlertTriangle } from '@/components/ui/luxury-icons'
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

type ViewerErrorBoundaryProps = {
  children: ReactNode
  onRetry: () => void
  onError: () => void
  sourceUrl: string
}

type ViewerErrorBoundaryState = {
  hasError: boolean
}

class ViewerErrorBoundary extends Component<ViewerErrorBoundaryProps, ViewerErrorBoundaryState> {
  state: ViewerErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ViewerErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[visualization] 3D viewer failed:', error, info.componentStack)
    this.props.onError()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[420px] flex-col items-center justify-center bg-background px-6 py-12 text-center sm:min-h-[600px]">
          <AlertTriangle className="h-10 w-10 text-amber-600" />
          <h2 className="mt-4 font-serif text-2xl font-light text-foreground">This model needs another try.</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">The shared 3D file could not be rendered in this browser. Your project data is safe; retry the viewer, download the source file, or choose another shared model.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2"><Button type="button" onClick={this.props.onRetry} className="min-h-11 rounded-none">Retry this model</Button><a href={this.props.sourceUrl} download className="inline-flex min-h-11 items-center justify-center rounded-none border border-border px-4 text-sm font-medium text-foreground hover:bg-muted">Download model</a></div>
        </div>
      )
    }
    return this.props.children
  }
}

type SceneAction = {
  type: 'reset' | 'zoomIn' | 'zoomOut'
  nonce: number
}

function SceneController({ action, autoRotate }: { action: SceneAction; autoRotate: boolean }) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { camera } = useThree()

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    if (action.type === 'reset') {
      camera.position.set(4, 3, 5)
      controls.target.set(0, 0, 0)
    } else {
      const direction = new Vector3().subVectors(camera.position, controls.target).normalize()
      const currentDistance = camera.position.distanceTo(controls.target)
      const multiplier = action.type === 'zoomIn' ? 0.75 : 1.25
      const nextDistance = MathUtils.clamp(currentDistance * multiplier, 1.5, 20)
      camera.position.copy(controls.target).add(direction.multiplyScalar(nextDistance))
    }

    controls.update()
  }, [action, camera])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      rotateSpeed={0.8}
      panSpeed={0.8}
      zoomSpeed={0.9}
      minDistance={1.5}
      maxDistance={20}
      autoRotate={autoRotate}
      autoRotateSpeed={0.7}
    />
  )
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} dispose={null} />
}

function LoadingOverlay() {
  const { progress } = useProgress()
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#10100f]/90 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="text-center text-white"><Loader2 className="mx-auto h-7 w-7 animate-spin text-amber-300" /><p className="mt-3 text-sm">Loading model {Math.round(progress)}%</p><p className="mt-1 text-xs text-white/60">Preparing the interactive workspace</p></div>
    </div>
  )
}

export default function VisualizationViewer({ project, assets }: Props) {
  const [selectedId, setSelectedId] = useState(assets[0]?.id ?? '')
  const [resetKey, setResetKey] = useState(0)
  const [error, setError] = useState('')
  const [viewerFailed, setViewerFailed] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [showControlsHelp, setShowControlsHelp] = useState(true)
  const [sceneAction, setSceneAction] = useState<SceneAction>({ type: 'reset', nonce: 0 })
  const viewerRef = useRef<HTMLDivElement>(null)
  const selected = assets.find((asset) => asset.id === selectedId) ?? assets[0]

  function triggerSceneAction(type: SceneAction['type']) {
    setSceneAction((previous) => ({ type, nonce: previous.nonce + 1 }))
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await viewerRef.current?.requestFullscreen()
      else await document.exitFullscreen()
    } catch {
      setError('Fullscreen is not available in this browser.')
    }
  }

  function selectAsset(asset: VisualizationAsset) {
    setSelectedId(asset.id)
    setError('')
    setViewerFailed(false)
    setAutoRotate(false)
    triggerSceneAction('reset')
  }

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-6">
        <Link href={`/client/projects/${project.slug}`} className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to {project.title}</Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-primary">Project visualization</p>
            <h1 className="mt-2 break-words font-serif text-3xl font-light sm:text-4xl">{project.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Explore approved 3D models in a focused workspace. Orbit, zoom, and pan around the design, then switch between the models shared with you.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="min-h-11 rounded-none" onClick={() => setShowControlsHelp((visible) => !visible)} aria-pressed={showControlsHelp}><Info className="mr-2 h-4 w-4" />Controls</Button>
            <Button type="button" variant="outline" className="min-h-11 rounded-none" onClick={toggleFullscreen} disabled={!selected}><Expand className="mr-2 h-4 w-4" />Fullscreen</Button>
          </div>
        </div>

        {error && <div role="alert" className="flex items-center gap-2 rounded border border-rose-300/70 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-400/40 dark:bg-rose-950/40 dark:text-rose-100"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}

        {assets.length === 0 ? (
          <Card className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center"><Box className="h-10 w-10 text-muted-foreground" /><h2 className="mt-4 font-serif text-2xl">No visualization shared yet</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Your project team has not published a GLB or GLTF model for this project.</p></Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div ref={viewerRef} className="relative min-h-[420px] overflow-hidden rounded-xl border border-border/30 bg-[#10100f] shadow-2xl sm:min-h-[600px]" aria-label={`${selected?.title ?? 'Project'} 3D viewer`}>
              {selected && (
                <ViewerErrorBoundary key={`${selected.id}-${resetKey}`} sourceUrl={selected.viewerUrl} onError={() => setViewerFailed(true)} onRetry={() => { setError(''); setViewerFailed(false); setResetKey((key) => key + 1); triggerSceneAction('reset') }}>
                  <Canvas camera={{ position: [4, 3, 5], fov: 42 }} dpr={[1, 1.5]} onCreated={() => setError('')}>
                    <color attach="background" args={['#10100f']} />
                    <ambientLight intensity={1.15} />
                    <directionalLight position={[5, 8, 5]} intensity={2.2} />
                    <directionalLight position={[-4, 3, -4]} intensity={0.7} color="#b48b5d" />
                    <Suspense fallback={<LoadingOverlay />}><Center><Model url={selected.viewerUrl} /></Center></Suspense>
                    <SceneController action={sceneAction} autoRotate={autoRotate} />
                  </Canvas>
                </ViewerErrorBoundary>
              )}

              {!viewerFailed && <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-3">
                <div className="max-w-[75%] rounded-full border border-white/15 bg-black/45 px-3 py-2 text-xs text-white/80 backdrop-blur-md">{selected?.title} · v{selected?.version}</div>
                {showControlsHelp && <div className="hidden rounded-lg border border-white/10 bg-black/45 px-3 py-2 text-right text-[11px] leading-5 text-white/70 backdrop-blur-md sm:block">Drag to orbit<br />Scroll or pinch to zoom<br />Right-drag to pan</div>}
              </div>}

              {!viewerFailed && <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                <div className="flex items-center overflow-hidden rounded-lg border border-white/15 bg-black/55 p-1 shadow-lg backdrop-blur-md" role="toolbar" aria-label="3D model controls">
                  <button type="button" onClick={() => triggerSceneAction('zoomOut')} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300" aria-label="Zoom out"><Minus className="h-4 w-4" /></button>
                  <button type="button" onClick={() => triggerSceneAction('reset')} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300" aria-label="Reset view"><RotateCcw className="h-4 w-4" /></button>
                  <button type="button" onClick={() => triggerSceneAction('zoomIn')} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300" aria-label="Zoom in"><Plus className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setAutoRotate((rotating) => !rotating)} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${autoRotate ? 'bg-amber-300 text-black' : 'text-white/80 hover:bg-white/10 hover:text-white'}`} aria-label={autoRotate ? 'Pause automatic rotation' : 'Play automatic rotation'} aria-pressed={autoRotate}>{autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
                </div>
                <div className="rounded-full border border-white/15 bg-black/55 px-3 py-2 text-[11px] text-white/70 backdrop-blur-md"><span className="hidden sm:inline">Interactive model</span><span className="sm:hidden">3D</span></div>
              </div>}
            </div>

            <Card className="h-fit overflow-hidden p-0">
              <div className="border-b border-border/20 p-5"><h2 className="font-serif text-xl font-light">Shared models</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Choose a published model to explore.</p></div>
              <div className="flex gap-3 overflow-x-auto p-4 lg:block lg:space-y-2 lg:overflow-visible">{assets.map((asset) => <button key={asset.id} type="button" onClick={() => selectAsset(asset)} className={`min-w-[220px] rounded-lg border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:min-w-0 ${selected?.id === asset.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/20 hover:border-primary/50 hover:bg-muted/50'}`} aria-pressed={selected?.id === asset.id}><span className="block truncate text-sm font-medium text-foreground">{asset.title}</span><span className="mt-1 block text-xs capitalize text-muted-foreground">{asset.assetType} · v{asset.version}</span>{asset.description && <span className="mt-2 line-clamp-2 block text-xs leading-5 text-muted-foreground">{asset.description}</span>}<span className="mt-2 block text-[11px] uppercase tracking-[0.12em] text-primary">{asset.approvalStatus.replace('_', ' ')}</span></button>)}</div>
            </Card>
          </div>
        )}

        {selected && <p className="text-xs leading-5 text-muted-foreground" aria-live="polite">Now viewing <span className="font-medium text-foreground">{selected.title}</span>. Use the on-screen controls or standard mouse/touch gestures to inspect the model.</p>}
      </div>
    </PortalLayout>
  )
}
