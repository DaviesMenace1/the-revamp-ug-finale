'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { useMemo, useState } from 'react'
import { resolveProductImageUrls } from '@/lib/utils'

type Project = {
  id: string
  title: string
  slug: string
  shortDescription: string | null
  description: string | null
  category: string | null
  location: string | null
  year: string | null
  images: unknown
  gallery: unknown
  thumbnailImage: string | null
  ogImage: string | null
  featured: boolean | null
  status: string | null
  progress: number | null
}

function phaseLabel(status: string | null, progress: number | null) {
  const labels: Record<string, string> = {
    consultation_scheduled: 'Briefing & scope',
    design_phase: 'Design development',
    procurement_phase: 'Procurement',
    installation_phase: 'Installation',
    completed: 'Completed',
    on_hold: 'On hold',
  }
  return labels[status || ''] || (progress && progress > 0 ? 'In progress' : 'Studio project')
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const image = resolveProductImageUrls(project)[0]
  const featured = index === 0 || Boolean(project.featured)
  const phase = phaseLabel(project.status, project.progress)

  return (
    <Link href={`/portfolio/${project.slug}`} className={`group block motion-reveal ${featured ? 'lg:col-span-7 lg:row-span-2' : index % 4 === 0 ? 'lg:col-span-5' : 'lg:col-span-4'}`} style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
      <article className="h-full">
        <div className={`relative overflow-hidden bg-muted ${featured ? 'aspect-[5/4] lg:aspect-[5/6]' : index % 4 === 0 ? 'aspect-[4/5]' : 'aspect-[4/3]'}`}>
          <Image src={image} alt={project.title} fill sizes={featured ? '(max-width: 1023px) 100vw, 58vw' : '(max-width: 1023px) 50vw, 33vw'} className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]" />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian/75 via-obsidian/0 to-transparent opacity-75 transition-opacity duration-500 group-hover:opacity-95" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-ivory sm:p-7">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-gold">{project.category || phase}</p>
              <h2 className={`${featured ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-3xl'} mt-2 font-serif font-light leading-none`}>{project.title}</h2>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ivory/70"><MapPin className="size-3.5" />{project.location || 'Uganda'}{project.year ? ` · ${project.year}` : ''}</p>
            </div>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ivory/45 bg-obsidian/20 transition duration-300 group-hover:-translate-y-1 group-hover:border-gold group-hover:text-gold"><ArrowUpRight className="size-5" /></span>
          </div>
        </div>
        <div className="flex items-start justify-between gap-4 border-b border-border/70 py-4">
          <p className="line-clamp-2 max-w-xl text-sm leading-6 text-muted-foreground">{project.shortDescription || project.description || 'A considered interior by The Revamp studio.'}</p>
          <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-primary">View case study</span>
        </div>
      </article>
    </Link>
  )
}

export default function PortfolioGrid({ projects }: { projects: Project[] }) {
  const categories = useMemo(() => ['All', ...Array.from(new Set(projects.map((project) => project.category).filter((category): category is string => Boolean(category))))], [projects])
  const [category, setCategory] = useState('All')
  const filteredProjects = category === 'All' ? projects : projects.filter((project) => project.category === category)

  return (
    <section className="px-5 py-12 sm:px-8 md:py-20 lg:px-16" aria-label="Published projects">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-5 border-b border-border/70 pb-6 md:flex-row md:items-end md:justify-between">
          <div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Selected work</p><p className="mt-2 text-sm text-muted-foreground">{filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} in the current edit</p></div>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter projects by category">
            {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`min-h-11 shrink-0 border px-4 text-[10px] uppercase tracking-[0.16em] transition-colors ${category === item ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'}`}>{item}</button>)}
          </div>
        </div>
        {filteredProjects.length ? <div className="mt-10 grid auto-rows-fr gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-12">{filteredProjects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} />)}</div> : <div className="border-y border-dashed border-border py-16 text-center"><p className="font-serif text-3xl text-foreground">No projects in this edit yet.</p><p className="mt-3 text-sm text-muted-foreground">Choose another category or return to the full studio archive.</p></div>}
      </div>
    </section>
  )
}
