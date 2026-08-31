'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, ChevronDown, Search, X } from '@/components/ui/luxury-icons'
import { cn } from '@/lib/utils'

const DEFAULT_FALLBACK_IMAGE = 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487078/L3D124S57ENDOVLZRRYUWLZS6LUFX7Y3WLA8_4000x3000_gb14hk.jpg'

type ServiceItem = {
  slug: string
  name: string
  description: string | null
  image: string | null
}

type ServiceCategory = {
  id: string
  slug: string
  name: string
  description: string | null
  services: ServiceItem[]
}

type Project = {
  id: string
  slug: string
  title: string
  description?: string | null
  category?: string | null
  location?: string | null
  year?: string | number | null
  images?: unknown
  gallery?: unknown
  thumbnailImage?: unknown
  ogImage?: unknown
}

function asImage(value: unknown) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string')
    return typeof first === 'string' ? first : ''
  }
  return ''
}

function projectImage(project: Project) {
  return asImage(project.thumbnailImage) || asImage(project.images) || asImage(project.gallery) || asImage(project.ogImage) || DEFAULT_FALLBACK_IMAGE
}

function EditorialLink({ href, children, light = false }: { href: string; children: React.ReactNode; light?: boolean }) {
  return (
    <Link href={href} className={`group inline-flex min-h-11 items-center gap-2 border-b pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors ${light ? 'border-white/35 text-white hover:border-gold hover:text-gold' : 'border-foreground/35 text-foreground hover:border-gold hover:text-gold'}`}>
      {children}
      <ArrowUpRight size={14} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}

function ServiceChapter({ service, category, index }: { service: ServiceItem; category: ServiceCategory; index: number }) {
  const image = service.image || DEFAULT_FALLBACK_IMAGE
  const detailHref = `/services/${category.slug}/${service.slug}`
  const variant = index % 4

  if (variant === 1) {
    return (
      <article className="grid gap-7 border-t border-foreground/15 py-10 md:grid-cols-[0.7fr_1fr] md:items-center md:gap-16 md:py-16">
        <div className="order-2 md:order-1 md:pl-[12%]"><h3 className="mt-5 max-w-md font-serif text-4xl font-light leading-[0.9] sm:text-6xl">{service.name}</h3><p className="mt-5 max-w-sm text-sm leading-7 text-foreground/60">{service.description || `A considered ${service.name.toLowerCase()} service shaped around the architecture and the life within it.`}</p><div className="mt-7"><EditorialLink href={detailHref}>Explore {service.name}</EditorialLink></div></div>
        <Link href={detailHref} className="group order-1 block md:order-2"><div className="relative ml-auto aspect-[4/5] max-w-xl overflow-hidden bg-canvas-dark md:w-[82%]"><img src={image} alt={service.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" /><span className="absolute bottom-4 left-4 bg-background/85 px-3 py-2 text-[9px] uppercase tracking-[0.18em] text-foreground/65">{category.name}</span></div></Link>
      </article>
    )
  }

  if (variant === 2) {
    return (
      <article className="border-t border-foreground/15 py-10 md:py-16"><div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr] sm:items-end"><Link href={detailHref} className="group block"><div className="relative aspect-[5/4] overflow-hidden bg-canvas-dark"><img src={image} alt={service.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" /></div></Link><div className="px-1 pb-1 sm:pl-8"><p className="text-[10px] uppercase tracking-[0.2em] text-foreground/60">{category.name}</p><h3 className="mt-3 font-serif text-4xl font-light leading-[0.9] sm:text-5xl">{service.name}</h3><p className="mt-4 max-w-sm text-sm leading-6 text-foreground/60">{service.description || 'Material, proportion and atmosphere held in balance.'}</p><div className="mt-6"><EditorialLink href={detailHref}>Explore service</EditorialLink></div></div></div></article>
    )
  }

  return (
    <article className={cn('group border-t border-foreground/15 py-10 md:py-16', variant === 3 && 'md:pr-[12%]')}>
      <Link href={detailHref} className="grid gap-6 md:grid-cols-[0.72fr_1.28fr] md:items-center md:gap-16"><div className="order-2 md:order-1"><h3 className="mt-4 font-serif text-4xl font-light leading-[0.9] sm:text-6xl">{service.name}</h3><p className="mt-5 max-w-sm text-sm leading-7 text-foreground/60">{service.description || 'Spaces shaped by proportion, material and atmosphere.'}</p><span className="mt-7 inline-flex min-h-11 items-center gap-2 border-b border-foreground/35 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors group-hover:border-gold group-hover:text-gold">Explore service <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></div><div className="order-1 aspect-[5/4] overflow-hidden bg-canvas-dark md:order-2"><img src={image} alt={service.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" /></div></Link>
    </article>
  )
}

function ApproachSection() {
  const steps = [
    ['Discover', 'Understanding the client, architecture, lifestyle and ambition.'],
    ['Define', 'Developing the concept, palette, materials and direction.'],
    ['Design', 'Architecture, interiors, furniture and detailing.'],
    ['Source', 'Finding and procuring the right pieces globally.'],
    ['Deliver', 'Logistics, installation, styling and final detailing.'],
  ]
  return (
    <section className="border-y border-foreground/10 bg-canvas px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32"><div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20"><div><p className="text-[10px] uppercase tracking-[0.28em] text-foreground/65">The Revamp approach</p><h2 className="mt-5 max-w-md font-serif text-5xl font-light leading-[0.9] sm:text-7xl">From vision<br /><span className="italic text-foreground/60">to reality.</span></h2><p className="mt-7 max-w-sm text-sm leading-7 text-foreground/60">We are not simply a designer who hands over drawings. We stay with the work until the final detail is in place.</p></div><div className="border-t border-foreground/15">{steps.map(([title, description]) => <div key={title} className="grid gap-3 border-b border-foreground/15 py-5 sm:grid-cols-[0.65fr_1fr] sm:gap-6"><h3 className="font-serif text-2xl font-light leading-none sm:text-3xl">{title}</h3><p className="text-xs leading-5 text-foreground/65 sm:text-sm sm:leading-6">{description}</p></div>)}</div></div></section>
  )
}

function MaterialSection() {
  const materials = [
    ['Travertine', 'Warm mineral surfaces, quietly monumental.'],
    ['Walnut', 'A deeper grain for rooms with memory.'],
    ['Brass', 'A measured glint where light finds detail.'],
    ['Stone', 'Tactile, grounded, made to endure.'],
  ]
  return (
    <section className="bg-background px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36"><div className="mx-auto max-w-[1440px]"><div className="mb-10 max-w-3xl"><p className="text-[10px] uppercase tracking-[0.28em] text-foreground/65">Material dialogue</p><h2 className="mt-4 font-serif text-5xl font-light leading-[0.9] sm:text-7xl">Material is architecture.</h2></div><div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4 md:items-start">{materials.map(([name, description], index) => <div key={name} className={cn('relative min-h-48 overflow-hidden border border-foreground/15 bg-canvas dark:bg-background px-4 py-5 sm:min-h-64 sm:px-6 sm:py-7', index % 2 === 1 && 'mt-8 md:mt-12')}><div className="absolute inset-0 bg-gradient-to-br from-canvas-dark via-background to-canvas opacity-90" /><div className="relative flex h-full min-h-40 flex-col justify-between sm:min-h-56"><div className="flex items-start justify-between"><span className="size-2 rounded-full bg-gold/70" /></div><div><h3 className="font-serif text-3xl font-light leading-none sm:text-4xl">{name}</h3><p className="mt-3 max-w-[11rem] text-[10px] leading-4 text-foreground/65">{description}</p></div></div></div>)}</div></div></section>
  )
}

function ProjectProof({ project }: { project: Project | null }) {
  if (!project) return null
  return (
    <section className="bg-obsidian px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-12 lg:py-36"><div className="mx-auto max-w-[1440px]"><div className="mb-10 flex flex-col gap-6 border-b border-white/20 pb-7 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Featured project</p><h2 className="mt-4 font-serif text-5xl font-light leading-[0.9] sm:text-7xl">The proof.</h2></div><Link href="/portfolio" className="group inline-flex min-h-11 items-center gap-2 border-b border-white/30 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:border-gold hover:text-gold">View all projects <ArrowUpRight size={14} aria-hidden="true" /></Link></div><div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end"><Link href={`/portfolio/${encodeURIComponent(project.slug)}`} className="group block"><div className="aspect-[5/4] overflow-hidden bg-charcoal sm:aspect-[16/10]"><img src={projectImage(project)} alt={project.title} className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" loading="lazy" /></div></Link><div className="md:pb-2"><p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{project.category || 'Selected work'}{project.location ? ` · ${project.location}` : ''}</p><h3 className="mt-4 font-serif text-4xl font-light leading-[0.9] sm:text-6xl">{project.title}</h3><p className="mt-5 max-w-sm text-sm leading-7 text-white/65">{project.description || 'A considered composition of architecture, interiors and detail.'}</p><div className="mt-7"><Link href={`/portfolio/${encodeURIComponent(project.slug)}`} className="group inline-flex min-h-11 items-center gap-2 border-b border-white/30 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:border-gold hover:text-gold">View project <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link></div></div></div></div></section>
  )
}

function FAQSection() {
  const questions = [
    ['What does an interior design project include?', 'We shape the full journey, from concept and spatial planning through specification, sourcing, installation and final styling.'],
    ['Do you work outside Kampala?', 'Yes. We work across Uganda, East Africa and with international clients where the brief calls for it.'],
    ['Can Revamp source furniture internationally?', 'Our global sourcing service connects the brief to considered furniture, lighting, materials and objects from trusted makers and suppliers.'],
    ['Do you handle installation?', 'Project management, logistics, installation and final detailing can all be included in the scope of work.'],
    ['Can I engage Revamp for only sourcing?', 'Yes. We can work with an existing design direction or help build a focused sourcing brief.'],
    ['Do you work with developers and hospitality projects?', 'We work with private clients, developers, hospitality teams and commercial partners on projects with a clear point of view.'],
  ]
  return <section className="bg-background px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32"><div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20"><div><p className="text-[10px] uppercase tracking-[0.28em] text-foreground/65">Practical information</p><h2 className="mt-5 max-w-md font-serif text-5xl font-light leading-[0.9] sm:text-7xl">Questions,<br /><span className="italic text-foreground/60">answered.</span></h2></div><div className="divide-y divide-foreground/15 border-y border-foreground/15">{questions.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-serif text-2xl font-light leading-none sm:text-3xl">{question}<span className="shrink-0 font-sans text-2xl text-gold transition-transform duration-200 group-open:rotate-45">+</span></summary><p className="max-w-2xl pt-4 text-sm leading-7 text-foreground/60">{answer}</p></details>)}</div></div></section>
}

export default function ServicesListingClient({ categories }: { categories: ServiceCategory[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [featuredProject, setFeaturedProject] = useState<Project | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/projects?limit=1', { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<{ data?: Project[] }> : { data: [] })
      .then((payload) => setFeaturedProject(Array.isArray(payload.data) ? payload.data[0] || null : null))
      .catch(() => setFeaturedProject(null))
    return () => controller.abort()
  }, [])

  const filteredCategories = useMemo(() => categories.map((category) => {
    if (selectedCategory !== 'all' && category.id !== selectedCategory) return null
    const query = searchQuery.toLowerCase().trim()
    const matchingServices = category.services.filter((service) => !query || service.name.toLowerCase().includes(query) || (service.description || '').toLowerCase().includes(query) || category.name.toLowerCase().includes(query))
    return matchingServices.length ? { ...category, services: matchingServices } : null
  }).filter(Boolean) as ServiceCategory[], [categories, searchQuery, selectedCategory])

  const services = filteredCategories.flatMap((category) => category.services.map((service) => ({ service, category })))
  const totalResults = services.length

  return (
    <>
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden bg-canvas dark:bg-background px-5 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-36 lg:px-12 lg:pb-32"><div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1fr_0.62fr] lg:items-end"><div><p className="text-[10px] uppercase tracking-[0.28em] text-foreground/65">The Revamp House</p><h1 className="mt-5 max-w-5xl font-serif text-[clamp(3.8rem,9vw,8rem)] font-light leading-[0.82] tracking-[-0.04em]">Luxury living<br /><span className="italic text-foreground/60">redefined.</span></h1></div><div className="max-w-sm border-t border-foreground/20 pt-6 lg:mb-1"><p className="text-sm leading-7 text-foreground/75 sm:text-base">Bespoke solutions for refined spaces.</p><div className="mt-7"><EditorialLink href="/book-consultation">Begin a conversation</EditorialLink></div></div></div></section>

        <section className="border-y border-foreground/10 bg-background px-5 py-16 sm:px-8 sm:py-24 lg:px-12"><div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-[0.5fr_1fr] md:items-start"><div><p className="text-[10px] uppercase tracking-[0.28em] text-foreground/65">A complete design house</p></div><div><h2 className="max-w-4xl font-serif text-4xl font-light leading-[0.94] sm:text-6xl">We approach every project as a complete composition  -  architecture, interiors, objects, materials and craftsmanship considered together.</h2><p className="mt-6 max-w-xl text-sm leading-7 text-foreground/60">The result is not a collection of services, but a point of view carried consistently from vision to reality.</p></div></div></section>

        <section className="bg-background px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36"><div className="mx-auto max-w-[1440px]"><div className="mb-10 grid gap-8 border-b border-foreground/15 pb-8 md:grid-cols-[0.65fr_1.35fr] md:items-end"><div><p className="text-[10px] uppercase tracking-[0.28em] text-foreground/65">The services</p><h2 className="mt-4 max-w-lg font-serif text-5xl font-light leading-[0.9] sm:text-7xl">Capabilities<br /><span className="italic text-foreground/60">with depth.</span></h2></div><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8"><p className="max-w-lg text-sm leading-7 text-foreground/60">Explore the disciplines that turn a vision into a finished space.</p><div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-foreground/50"><span>{totalResults}</span> {totalResults === 1 ? 'service' : 'services'}</div></div></div>

          <div className="sticky top-16 z-20 -mx-5 mb-12 border-y border-foreground/15 bg-background/92 px-5 py-4 backdrop-blur-md sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="relative max-w-md flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60" aria-hidden="true" /><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Find a capability" className="h-10 w-full border-b border-foreground/25 bg-transparent pl-9 pr-9 text-xs uppercase tracking-[0.12em] text-foreground placeholder:text-foreground/40 focus:border-gold focus:outline-none" aria-label="Search services" />{searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-gold" aria-label="Clear service search"><X size={15} /></button>}</div><div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"><button type="button" onClick={() => setSelectedCategory('all')} className={cn('whitespace-nowrap border-b pb-1 text-[10px] uppercase tracking-[0.16em] transition-colors', selectedCategory === 'all' ? 'border-gold text-foreground' : 'border-transparent text-foreground/60 hover:text-foreground')}>All work</button>{categories.map((category) => <button type="button" key={category.id} onClick={() => setSelectedCategory(category.id)} className={cn('whitespace-nowrap border-b pb-1 text-[10px] uppercase tracking-[0.16em] transition-colors', selectedCategory === category.id ? 'border-gold text-foreground' : 'border-transparent text-foreground/60 hover:text-foreground')}>{category.name}</button>)}</div></div></div>

          {services.length ? <div>{services.map(({ service, category }, index) => <ServiceChapter key={`${category.slug}-${service.slug}`} service={service} category={category} index={index} />)}</div> : <div className="border border-dashed border-foreground/20 px-6 py-16 text-center"><p className="font-serif text-3xl font-light">No matching services found.</p><p className="mt-3 text-sm text-foreground/65">Try a different search or return to the complete practice.</p><button type="button" onClick={() => { setSearchQuery(''); setSelectedCategory('all') }} className="mt-6 border-b border-foreground/35 pb-2 text-[10px] uppercase tracking-[0.18em] hover:border-gold hover:text-gold">Clear filters</button></div>}
        </div></section>

        <ApproachSection />
        <MaterialSection />
        <ProjectProof project={featuredProject} />
        <FAQSection />

        <section className="bg-foreground px-5 py-24 text-background sm:px-8 sm:py-32 lg:px-12 lg:py-40"><div className="mx-auto max-w-[1440px]"><p className="text-[10px] uppercase tracking-[0.28em] text-white/55">The next step</p><div className="mt-6 flex flex-col gap-10 md:flex-row md:items-end md:justify-between"><h2 className="max-w-5xl font-serif text-[clamp(3.5rem,9vw,9rem)] font-light leading-[0.83] tracking-[-0.035em]">Your space deserves<br /><span className="italic text-gold-light">a point of view.</span></h2><div className="flex shrink-0 flex-col items-start gap-3 md:pb-2"><EditorialLink href="/book-consultation" light>Book a consultation</EditorialLink><EditorialLink href="/contact" light>Get in touch</EditorialLink></div></div></div></section>
      </main>
    </>
  )
}
