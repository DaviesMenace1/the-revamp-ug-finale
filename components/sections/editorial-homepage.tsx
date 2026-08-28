'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

type Service = {
  categorySlug: string
  categoryName: string
  serviceSlug: string
  serviceName: string
  description: string | null
  image: string | null
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

type Product = {
  id: string
  slug: string
  name: string
  description?: string | null
  images?: unknown
  thumbnailImage?: unknown
  image?: unknown
  price?: string | number | null
}

type Article = {
  id?: string
  slug: string
  title: string
  excerpt?: string | null
  category?: string | null
  image?: string | null
  publishedAt?: string | null
}

const HERO_VIDEO = 'https://res.cloudinary.com/r8epy5mg/video/upload/v1785487037/85_ytqesd.mp4'
const HERO_POSTER = 'https://res.cloudinary.com/r8epy5mg/image/upload/L3D733S57ENDOVMJQ5QUWIF6ILUFX73BZXQ8_cpiqvz.jpg'
const FALLBACK_IMAGES = [
  'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487082/L3D124S57ENDOVMIRRIUWLZS6LUFX73OHPI8_4000x3000_tk64wj.jpg',
  HERO_POSTER,
]

function asImage(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string')
    return typeof first === 'string' ? first : ''
  }
  return ''
}

function projectImage(project: Project, index = 0) {
  return asImage(project.thumbnailImage) || asImage(project.images) || asImage(project.gallery) || asImage(project.ogImage) || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
}

function productImage(product: Product, index = 0) {
  return asImage(product.thumbnailImage) || asImage(product.images) || asImage(product.image) || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
}

function shortDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-UG', { month: 'short', year: 'numeric' }).format(date)
}

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-[10px] uppercase tracking-[0.28em] ${light ? 'text-white/60' : 'text-foreground/55'}`}>
      {children}
    </p>
  )
}

function TextLink({ href, children, light = false }: { href: string; children: React.ReactNode; light?: boolean }) {
  return (
    <Link
      href={href}
      className={`group inline-flex min-h-11 items-center gap-2 border-b pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors ${light ? 'border-white/35 text-white hover:border-gold hover:text-gold' : 'border-foreground/35 text-foreground hover:border-gold hover:text-gold'}`}
    >
      {children}
      <ArrowUpRight size={14} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}

function EditorialHero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (reducedMotion) {
      videoRef.current?.pause()
      return
    }
    void videoRef.current?.play().catch(() => undefined)
  }, [reducedMotion])

  return (
    <section className="relative h-[138svh] min-h-[720px] bg-obsidian text-white" aria-label="The Revamp UG introduction">
      <div className="sticky top-0 h-[100svh] min-h-[640px] overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO}
          poster={HERO_POSTER}
          muted
          playsInline
          loop
          autoPlay
          preload="metadata"
          aria-label="Atmospheric architecture footage"
        />
        <div className="absolute inset-0 bg-black/42" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-black/45" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-transparent to-black/25" aria-hidden="true" />

        <div className="absolute inset-x-0 top-0 mx-auto flex max-w-[1440px] items-center justify-between px-5 pt-28 sm:px-8 sm:pt-32 lg:px-12">
          <p className="text-[9px] uppercase tracking-[0.28em] text-white/65">The Revamp House · Uganda / East Africa</p>
          <p className="hidden text-[9px] uppercase tracking-[0.28em] text-white/55 sm:block">01 / 01</p>
        </div>

        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[1440px] flex-col gap-8 px-5 pb-9 sm:px-8 sm:pb-14 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:pb-16">
          <div className="max-w-4xl">
            <p className="text-[10px] uppercase tracking-[0.26em] text-white/60">Spaces that feel like you.</p>
            <h1 className="mt-4 max-w-4xl font-serif text-[clamp(3.3rem,11vw,8.5rem)] font-light leading-[0.82] tracking-[-0.04em]">
              The architecture
              <span className="block italic text-gold-light">of refined living.</span>
            </h1>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-5 lg:items-end lg:pb-1">
            <p className="max-w-xs text-sm leading-6 text-white/72 lg:text-right">Interiors, architecture and objects composed around the way you live.</p>
            <div className="flex items-center gap-3">
              <Link href="/book-consultation" className="inline-flex min-h-12 items-center gap-3 rounded-full bg-white px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-black transition-transform hover:-translate-y-0.5 hover:bg-gold-light">
                Begin a project
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link href="/portfolio" aria-label="View our work" className="flex size-12 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:border-gold hover:text-gold">
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-5 left-5 hidden items-center gap-3 text-[9px] uppercase tracking-[0.24em] text-white/55 sm:flex lg:left-12">
          <span className="h-px w-8 bg-white/45" /> Scroll to enter
        </div>

        <div className="absolute right-5 top-[48%] hidden w-48 overflow-hidden rounded-2xl border border-white/20 bg-black/35 p-2 backdrop-blur-md sm:block lg:right-12 lg:top-[50%] lg:w-56">
          <img src={HERO_POSTER} alt="Revamp interior detail" className="aspect-[4/3] w-full rounded-xl object-cover opacity-85" loading="eager" />
          <div className="flex items-center justify-between px-1.5 pb-1 pt-2"><span className="text-[9px] uppercase tracking-[0.16em] text-white/65">Interior / Architecture</span><ArrowUpRight size={13} className="text-white/75" aria-hidden="true" /></div>
        </div>
      </div>
    </section>
  )
}

function PhilosophySection() {
  return (
    <section className="border-b border-foreground/10 bg-background px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
      <div className="mx-auto grid max-w-[1440px] items-start gap-12 lg:grid-cols-[0.55fr_1fr_0.7fr] lg:gap-16">
        <div>
          <Eyebrow>The Revamp House</Eyebrow>
          <p className="mt-6 max-w-[13rem] text-xs leading-6 text-foreground/55">A complete design house for spaces with presence, depth and a point of view.</p>
        </div>
        <div>
          <h2 className="max-w-3xl font-serif text-[clamp(3rem,8vw,7rem)] font-light leading-[0.9] tracking-[-0.03em]">Spatial authority.<br /><span className="italic text-foreground/45">Narrative depth.</span></h2>
          <div className="mt-10 border-t border-foreground/15 pt-6 sm:mt-14 sm:flex sm:items-end sm:justify-between sm:gap-8">
            <p className="max-w-md text-sm leading-7 text-foreground/65">We bring architecture, interiors, objects, materials and craftsmanship into one clear point of view — from first sketch to final detail.</p>
            <TextLink href="/about">Meet the studio</TextLink>
          </div>
        </div>
        <div className="relative mt-2 aspect-[4/5] overflow-hidden bg-canvas-dark sm:mt-8 lg:mt-0">
          <img src={HERO_POSTER} alt="Material and architectural detail in a Revamp interior" className="h-full w-full object-cover grayscale-[0.15] transition-transform duration-700 hover:scale-105" loading="lazy" />
          <span className="absolute bottom-3 left-3 bg-background/85 px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-foreground/65">A considered approach</span>
        </div>
      </div>
    </section>
  )
}

function ServiceWorld({ services, loading }: { services: Service[]; loading: boolean }) {
  const visible = services.slice(0, 6)
  return (
    <section className="bg-canvas dark:bg-background px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-8 border-b border-foreground/15 pb-8 md:grid-cols-[0.7fr_1.3fr] md:items-end">
          <div>
            <Eyebrow>01 — The world of Revamp</Eyebrow>
            <h2 className="mt-4 max-w-md font-serif text-5xl font-light leading-[0.92] sm:text-7xl">The practice.</h2>
          </div>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <p className="max-w-lg text-sm leading-7 text-foreground/60">Architecture and interiors, connected by a considered approach to how a space should look, feel and live.</p>
            <TextLink href="/services">Explore all services</TextLink>
          </div>
        </div>

        {loading ? (
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5" aria-label="Loading services" aria-busy="true">
            {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className={`animate-pulse bg-foreground/10 ${item % 2 === 0 ? 'mt-7 h-56' : 'h-64'}`} />)}
          </div>
        ) : visible.length ? (
          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 md:grid-cols-3 md:gap-y-12">
            {visible.map((service, index) => (
              <Link
                key={`${service.categorySlug}-${service.serviceSlug}`}
                href={`/services/${service.categorySlug}/${service.serviceSlug}`}
                className={`group block ${index % 2 === 1 ? 'mt-7 md:mt-14' : ''} ${index === 2 ? 'md:-mt-2' : ''}`}
              >
                <div className={`relative overflow-hidden bg-canvas-dark ${index % 3 === 1 ? 'aspect-[4/5]' : 'aspect-[5/6]'}`}>
                  <img src={service.image || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]} alt={service.serviceName} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-70" />
                  <span className="absolute left-3 top-3 text-[9px] uppercase tracking-[0.2em] text-white/70">{String(index + 1).padStart(2, '0')}</span>
                  <ArrowUpRight size={16} className="absolute right-3 top-3 text-white/75 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true" />
                  <div className="absolute inset-x-3 bottom-3">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/60">{service.categoryName}</p>
                    <h3 className="mt-1 font-serif text-xl font-light leading-none text-white sm:text-2xl">{service.serviceName}</h3>
                  </div>
                </div>
                <p className="mt-3 max-w-[15rem] text-[11px] leading-5 text-foreground/55">{service.description || 'A considered service, shaped around the architecture and the life within it.'}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-10 border border-dashed border-foreground/20 px-6 py-12 text-center"><p className="font-serif text-3xl font-light">The studio is ready to begin.</p><Link href="/services" className="mt-5 inline-flex text-[10px] uppercase tracking-[0.18em] text-foreground/60 underline underline-offset-4">View services</Link></div>
        )}
      </div>
    </section>
  )
}

function ImageStory({ image }: { image: string }) {
  return (
    <section className="relative min-h-[31rem] overflow-hidden bg-obsidian text-white sm:min-h-[38rem]">
      <img src={image} alt="Atmospheric Revamp project detail" className="absolute inset-0 h-full w-full object-cover opacity-65" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-black/10" />
      <div className="relative mx-auto flex min-h-[31rem] max-w-[1440px] items-end px-5 py-12 sm:min-h-[38rem] sm:px-8 sm:py-16 lg:px-12">
        <div className="max-w-xl">
          <Eyebrow light>02 — A point of view</Eyebrow>
          <h2 className="mt-5 max-w-xl font-serif text-5xl font-light leading-[0.9] sm:text-7xl">The art of living.</h2>
          <p className="mt-6 max-w-sm text-sm leading-6 text-white/70">Rooms are not finished by decoration alone. They gather meaning through proportion, material, light and the objects that stay.</p>
          <div className="mt-8"><TextLink href="/portfolio" light>See selected work</TextLink></div>
        </div>
      </div>
    </section>
  )
}

function ProjectFeature({ projects, loading }: { projects: Project[]; loading: boolean }) {
  const selected = projects.slice(0, 3)
  return (
    <section className="bg-background px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-10 flex flex-col gap-6 border-b border-foreground/15 pb-7 md:flex-row md:items-end md:justify-between">
          <div><Eyebrow>03 — Selected work</Eyebrow><h2 className="mt-4 font-serif text-5xl font-light leading-none sm:text-7xl">The proof.</h2></div>
          <TextLink href="/portfolio">View all projects</TextLink>
        </div>
        {loading ? (
          <div className="grid gap-3 md:grid-cols-[1.25fr_0.75fr]" aria-busy="true" aria-label="Loading projects"><div className="h-[26rem] animate-pulse bg-canvas-dark md:h-[38rem]" /><div className="grid gap-3 md:grid-rows-2"><div className="h-64 animate-pulse bg-canvas-dark md:h-auto" /><div className="h-64 animate-pulse bg-canvas-dark md:h-auto" /></div></div>
        ) : selected.length ? (
          <div className="grid gap-3 md:grid-cols-[1.25fr_0.75fr]">
            <ProjectTile project={selected[0]} index={0} feature />
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 md:grid-rows-2">
              {selected.slice(1).map((project, index) => <ProjectTile key={project.id} project={project} index={index + 1} />)}
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-foreground/20 px-6 py-16 text-center"><p className="font-serif text-3xl font-light">The portfolio is being composed.</p><Link href="/portfolio" className="mt-5 inline-flex text-[10px] uppercase tracking-[0.18em] text-foreground/60 underline underline-offset-4">Visit the portfolio</Link></div>
        )}
      </div>
    </section>
  )
}

function ProjectTile({ project, index, feature = false }: { project: Project; index: number; feature?: boolean }) {
  return (
    <Link href={`/portfolio/${encodeURIComponent(project.slug)}`} className={`group relative block overflow-hidden bg-canvas-dark ${feature ? 'min-h-[26rem] md:min-h-[38rem]' : 'min-h-[18rem] md:min-h-0'}`}>
      <img src={projectImage(project, index)} alt={project.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
      <div className="absolute inset-x-5 bottom-5 sm:inset-x-7 sm:bottom-7">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-[9px] uppercase tracking-[0.22em] text-white/60">{project.category || 'Private residence'}{project.location ? ` · ${project.location}` : ''}</p><h3 className={`mt-2 font-serif font-light leading-none text-white ${feature ? 'text-4xl sm:text-6xl' : 'text-2xl sm:text-3xl'}`}>{project.title}</h3></div>
          <ArrowUpRight size={18} className="mb-1 shrink-0 text-white/80 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true" />
        </div>
      </div>
    </Link>
  )
}

function ProcessSection() {
  const steps = [
    ['01', 'Discover', 'Understanding the client, architecture, lifestyle and ambition.'],
    ['02', 'Define', 'Developing the concept, palette, materials and direction.'],
    ['03', 'Design', 'Architecture, interiors, furniture and detailing.'],
    ['04', 'Source', 'Finding and procuring the right pieces globally.'],
    ['05', 'Deliver', 'Logistics, installation, styling and final detailing.'],
  ]
  return (
    <section className="border-y border-foreground/10 bg-canvas dark:bg-background px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32">
      <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
        <div><Eyebrow>04 — The Revamp approach</Eyebrow><h2 className="mt-5 max-w-md font-serif text-5xl font-light leading-[0.9] sm:text-7xl">From vision<br /><span className="italic text-foreground/60">to reality.</span></h2><p className="mt-7 max-w-sm text-sm leading-7 text-foreground/60">We are not simply a designer who hands over drawings. We stay with the work until the final detail is in place.</p></div>
        <div className="border-t border-foreground/15">
          {steps.map(([number, title, description]) => <div key={number} className="grid grid-cols-[2.5rem_0.75fr_1fr] gap-3 border-b border-foreground/15 py-5 sm:grid-cols-[3rem_0.65fr_1fr] sm:gap-6"><span className="text-[10px] tracking-[0.18em] text-foreground/60">{number}</span><h3 className="font-serif text-2xl font-light leading-none sm:text-3xl">{title}</h3><p className="text-xs leading-5 text-foreground/65 sm:text-sm sm:leading-6">{description}</p></div>)}
        </div>
      </div>
    </section>
  )
}

function GallerySection({ products, loading }: { products: Product[]; loading: boolean }) {
  const selected = products.slice(0, 4)
  return (
    <section className="bg-background px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-10 flex flex-col gap-6 border-b border-foreground/15 pb-7 md:flex-row md:items-end md:justify-between"><div><Eyebrow>05 — The gallery</Eyebrow><h2 className="mt-4 max-w-xl font-serif text-5xl font-light leading-[0.9] sm:text-7xl">Objects with presence.</h2><p className="mt-5 max-w-md text-sm leading-6 text-foreground/60">A considered selection of furniture, lighting and accents for rooms meant to be lived in.</p></div><TextLink href="/collections">View collection</TextLink></div>
        {loading ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5" aria-busy="true" aria-label="Loading collection">{[1, 2, 3, 4].map((item) => <div key={item} className={`animate-pulse bg-canvas-dark ${item % 2 ? 'aspect-[4/5]' : 'mt-8 aspect-[4/5]'}`} />)}</div> : selected.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-4 md:gap-y-0 md:items-start md:gap-5">{selected.map((product, index) => <Link key={product.id} href={`/collections/${encodeURIComponent(product.slug)}`} className={`group block ${index % 2 === 1 ? 'md:mt-12' : ''}`}><div className={`overflow-hidden bg-canvas-dark ${index % 2 === 0 ? 'aspect-[4/5]' : 'aspect-[4/5]'}`}><img src={productImage(product, index)} alt={product.name} className="h-full w-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105" loading="lazy" /></div><div className="mt-3 flex items-start justify-between gap-3"><div><h3 className="font-serif text-xl font-light leading-none">{product.name}</h3><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-foreground/50">{product.description || 'A selected object from The Revamp gallery.'}</p></div><ArrowUpRight size={14} className="mt-1 shrink-0 text-foreground/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /></div></Link>)}</div> : null}
      </div>
    </section>
  )
}

function JournalSection({ articles, loading }: { articles: Article[]; loading: boolean }) {
  const selected = articles.slice(0, 3)
  return (
    <section className="border-t border-foreground/10 bg-canvas dark:bg-background px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-[1440px]"><div className="mb-10 flex flex-col gap-6 border-b border-foreground/15 pb-7 md:flex-row md:items-end md:justify-between"><div><Eyebrow>06 — Journal</Eyebrow><h2 className="mt-4 font-serif text-5xl font-light leading-none sm:text-7xl">Editorial perspectives.</h2></div><TextLink href="/journal">Read the journal</TextLink></div>{loading ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5" aria-busy="true" aria-label="Loading journal">{[1, 2, 3].map((item) => <div key={item} className={`animate-pulse bg-foreground/10 ${item === 1 ? 'col-span-2 aspect-[16/9] md:col-span-1' : 'aspect-[4/5]'}`} />)}</div> : selected.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">{selected.map((article, index) => <Link key={article.id || article.slug} href={`/journal/${encodeURIComponent(article.slug)}`} className={`group ${index === 0 ? 'col-span-2 md:col-span-1' : index === 1 ? 'mt-8 md:mt-14' : ''}`}><div className={`overflow-hidden bg-canvas-dark ${index === 0 ? 'aspect-[16/10]' : 'aspect-[4/5]'}`}><img src={article.image || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]} alt={article.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" /></div><div className="mt-3"><div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] uppercase tracking-[0.18em] text-foreground/45"><span>{article.category || 'Studio notes'}</span>{article.publishedAt && <span>{shortDate(article.publishedAt)}</span>}</div><h3 className="mt-2 font-serif text-2xl font-light leading-[0.95] sm:text-3xl">{article.title}</h3>{article.excerpt && <p className="mt-2 line-clamp-2 text-xs leading-5 text-foreground/55">{article.excerpt}</p>}</div></Link>)}</div> : <div className="border border-dashed border-foreground/20 px-6 py-12 text-center"><p className="font-serif text-3xl font-light">Notes from the studio, soon.</p><Link href="/journal" className="mt-4 inline-flex text-[10px] uppercase tracking-[0.18em] text-foreground/60 underline underline-offset-4">Visit the journal</Link></div>}</div>
    </section>
  )
}

export function EditorialHomepage() {
  const [services, setServices] = useState<Service[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const get = async <T,>(url: string): Promise<T | null> => {
      try {
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) return null
        return await response.json() as T
      } catch {
        return null
      }
    }

    const load = async () => {
      const [servicePayload, projectPayload, productPayload, articlePayload] = await Promise.all([
        get<{ data?: Service[] }>('/api/services'),
        get<{ data?: Project[] }>('/api/projects?limit=5'),
        get<{ data?: Product[] }>('/api/products'),
        get<{ data?: Article[] }>('/api/articles?limit=4'),
      ])
      if (!controller.signal.aborted) {
        setServices(Array.isArray(servicePayload?.data) ? servicePayload.data : [])
        setProjects(Array.isArray(projectPayload?.data) ? projectPayload.data : [])
        setProducts(Array.isArray(productPayload?.data) ? productPayload.data : [])
        setArticles(Array.isArray(articlePayload?.data) ? articlePayload.data : [])
        setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  const storyImage = useMemo(() => projects.length ? projectImage(projects[0]) : HERO_POSTER, [projects])

  return (
    <>
      <EditorialHero />
      <PhilosophySection />
      <ServiceWorld services={services} loading={loading} />
      <ImageStory image={storyImage} />
      <ProjectFeature projects={projects} loading={loading} />
      <ProcessSection />
      <GallerySection products={products} loading={loading} />
      <JournalSection articles={articles} loading={loading} />
      <section className="bg-obsidian px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-12 lg:py-36"><div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-[1fr_0.7fr] md:items-end"><div><Eyebrow light>A final thought</Eyebrow><blockquote className="mt-5 max-w-4xl font-serif text-4xl font-light leading-[0.95] sm:text-6xl lg:text-7xl">“The space should feel as though it could only ever have existed this way.”</blockquote></div><div className="md:pb-2"><p className="max-w-sm text-sm leading-7 text-white/60">A quiet, considered point of view — carried from architecture to the final object.</p></div></div></section>
      <section className="relative overflow-hidden bg-foreground px-5 py-24 text-background sm:px-8 sm:py-32 lg:px-12 lg:py-40"><div className="mx-auto max-w-[1440px]"><Eyebrow light>07 — Begin a project</Eyebrow><div className="mt-6 flex flex-col gap-10 md:flex-row md:items-end md:justify-between"><h2 className="max-w-5xl font-serif text-[clamp(3.5rem,9vw,9rem)] font-light leading-[0.83] tracking-[-0.035em]">Your space deserves<br /><span className="italic text-gold-light">a point of view.</span></h2><div className="flex shrink-0 flex-col items-start gap-3 md:pb-2"><TextLink href="/book-consultation" light>Book a consultation</TextLink><TextLink href="/contact" light>Get in touch</TextLink></div></div></div></section>
    </>
  )
}
