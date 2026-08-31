'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, FolderOpen } from '@/components/ui/luxury-icons'
import { Badge } from '@/components/ui/badge'
import { resolveProductImageUrls } from '@/lib/utils'

type PublishedProject = {
  id: string
  slug: string
  title: string
  description?: string | null
  longDescription?: string | null
  category?: string | null
  location?: string | null
  year?: string | number | null
  images?: unknown
  gallery?: unknown
  thumbnailImage?: unknown
  ogImage?: unknown
  featured?: boolean | null
  publishStatus?: string | null
  projectKind?: string | null
}

function usableProjects(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((project): project is PublishedProject => {
    if (!project || typeof project !== 'object') return false
    const candidate = project as Record<string, unknown>
    return typeof candidate.id === 'string' && typeof candidate.slug === 'string' && Boolean(candidate.slug.trim()) && typeof candidate.title === 'string' && Boolean(candidate.title.trim())
  }).slice(0, 5)
}

function projectImage(project: PublishedProject) {
  return resolveProductImageUrls(project)[0] || ''
}

export function PortfolioSection() {
  const [projects, setProjects] = useState<PublishedProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 7000)
    fetch('/api/projects?limit=5', { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<{ data?: unknown }> : { data: [] })
      .then((payload) => setProjects(usableProjects(payload.data)))
      .catch(() => setProjects([]))
      .finally(() => {
        window.clearTimeout(timeout)
        setLoading(false)
      })
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  return (
    <section className="section-pad bg-canvas dark:bg-background">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="gold-line" />
            <h2 className="font-serif text-4xl font-light leading-tight text-foreground md:text-5xl lg:text-6xl">Selected Work</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">A current selection from our published portfolio.</p>
          </div>
          <Link href="/portfolio" className="group inline-flex min-h-11 items-center gap-2 font-sans text-xs uppercase tracking-widest text-gold hover-line">View All Projects<ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></Link>
        </div>

        {loading ? (
          <div className="grid gap-px bg-border md:grid-cols-3" aria-busy="true" aria-label="Loading published projects">
            <div className="min-h-[360px] animate-pulse bg-background md:col-span-2" />
            <div className="grid min-h-[360px] gap-px bg-border md:grid-rows-2"><div className="animate-pulse bg-background" /><div className="animate-pulse bg-background" /></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center border border-dashed border-border px-6 text-center"><FolderOpen className="size-8 text-primary" aria-hidden="true" /><p className="mt-4 font-serif text-2xl text-foreground">Our next published projects will appear here.</p><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Explore the portfolio page for the latest work currently available from The Revamp UG.</p><Link href="/portfolio" className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary hover:underline">Open portfolio<ArrowRight className="size-4" aria-hidden="true" /></Link></div>
        ) : (
          <div className="grid gap-px bg-border md:grid-cols-3">
            {projects.map((project, index) => <ProjectCard key={project.id} project={project} className={index === 0 ? 'md:col-span-2 md:min-h-[520px]' : index === 1 || index === 2 ? 'min-h-[250px]' : index === 3 ? 'min-h-[340px]' : 'md:col-span-2 min-h-[340px]'} />)}
          </div>
        )}
      </div>
    </section>
  )
}

function ProjectCard({ project, className = '' }: { project: PublishedProject; className?: string }) {
  const image = projectImage(project)
  const category = project.category?.trim() || 'Portfolio'
  const location = project.location?.trim() || 'Uganda'
  const year = project.year ? String(project.year) : ''

  return (
    <Link href={`/portfolio/${encodeURIComponent(project.slug)}`} className={`group relative block min-h-[300px] overflow-hidden bg-background ${className}`}>
      <div className="absolute inset-0 bg-muted transition-transform duration-700 group-hover:scale-105" style={image ? { backgroundImage: `url('${image.replace(/'/g, '%27')}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} role="img" aria-label={project.title} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-75 transition-opacity duration-500 group-hover:opacity-90" />
      <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-6 transition-transform duration-300 group-hover:translate-y-0">
        <Badge variant="outline" className="mb-3 rounded-none border-white/30 font-sans text-[10px] uppercase tracking-widest text-white/80">{category}</Badge>
        <h3 className="mb-1 font-serif text-xl font-light leading-tight text-white md:text-2xl">{project.title}</h3>
        <div className="mt-2 flex items-center gap-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">{location && <span className="font-sans text-xs text-white/60">{location}</span>}{year && <><span className="h-3 w-px bg-white/25" /><span className="font-sans text-xs text-white/60">{year}</span></>}</div>
      </div>
      <div className="absolute right-5 top-5 flex size-9 items-center justify-center border border-white/20 opacity-0 transition-all duration-300 group-hover:border-gold group-hover:opacity-100"><ArrowRight size={14} className="-rotate-45 text-white group-hover:text-gold" /></div>
    </Link>
  )
}
