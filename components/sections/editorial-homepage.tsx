'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductCard } from '@/components/collections/product-card'

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
  return <p className={`text-[10px] uppercase tracking-[0.28em] ${light ? 'text-white/60' : 'text-foreground/65'}`}>{children}</p>
}

function AnimatedMetric({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || started) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setStarted(true)
      const duration = 1200
      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration)
        setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      observer.disconnect()
    }, { threshold: 0.45 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [started, value])

  return <span ref={ref}>{display.toLocaleString('en-UG')}{suffix}</span>
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
  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = [
    { title: 'Luxury Living Redefined', subtitle: 'Discover architectural excellence', cta: 'Explore Architecture', href: '/services/architecture' },
    { title: 'Interior Design Excellence', subtitle: 'Bespoke solutions for refined spaces', cta: 'View Collections', href: '/collections' },
    { title: 'Global Procurement', subtitle: 'Access premium materials worldwide', cta: 'Start Sourcing', href: '/source-with-revamp' },
  ]
  const slide = slides[currentSlide]

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

  useEffect(() => {
    if (reducedMotion) return
    const interval = window.setInterval(() => setCurrentSlide((previous) => (previous + 1) % slides.length), 6000)
    return () => window.clearInterval(interval)
  }, [reducedMotion, slides.length])

  return (
    <section className="relative h-[100svh] min-h-[640px] bg-background p-0 sm:h-[118svh] sm:min-h-[760px] lg:h-[138svh]" aria-label="The Revamp UG introduction">
      <div className="sticky top-0 h-[100svh] min-h-[640px] overflow-hidden rounded-none border-0 bg-obsidian text-white shadow-2xl sm:h-[118svh] sm:min-h-[760px] lg:h-[138svh]">
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" src={HERO_VIDEO} poster={HERO_POSTER} muted playsInline loop autoPlay preload="metadata" aria-label="Atmospheric architecture footage" />
        <div className="absolute inset-0 bg-black/42" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-black/45" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/25" aria-hidden="true" />

        <div className="absolute inset-x-0 top-0 mx-auto flex max-w-[1440px] items-center justify-between px-5 pt-28 sm:px-8 sm:pt-32 lg:px-12"><p className="text-[9px] uppercase tracking-[0.28em] text-white/65">The Revamp House · Uganda / East Africa</p><p className="hidden text-[9px] uppercase tracking-[0.28em] text-white/55 sm:block">0{currentSlide + 1} / 03</p></div>

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1440px] px-5 pb-9 text-center sm:px-8 sm:pb-14 lg:px-12 lg:pb-16">
          <div className="mx-auto grid max-w-5xl gap-6 text-center lg:gap-8">
            <div className="mx-auto max-w-4xl"><p className="text-[10px] uppercase tracking-[0.26em] text-white/60">{slide.subtitle}</p><h1 key={slide.title} className="mt-4 max-w-4xl animate-in fade-in slide-in-from-bottom-2 hero-heading font-serif text-[clamp(2.7rem,8vw,6.5rem)] font-light leading-[0.88] tracking-[-0.04em]">{slide.title}</h1></div>
            <div className="flex flex-col items-center gap-4 lg:gap-5"><p className="max-w-xs text-sm leading-6 text-white/72 lg:text-right">Bespoke interiors, architecture and objects composed around the way you live.</p><Link href={slide.href} className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-white px-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-black transition-transform hover:-translate-y-0.5 hover:bg-gold-light">{slide.cta}<ArrowRight size={14} aria-hidden="true" /></Link></div>
          </div>
          <div className="mt-9 flex items-center justify-between border-t border-white/20 pt-4"><div className="flex items-center gap-2" aria-label="Hero slides">{slides.map((item, index) => <button key={item.title} type="button" onClick={() => setCurrentSlide(index)} aria-label={`Show slide ${index + 1}`} className={cn('h-1.5 rounded-full transition-all', currentSlide === index ? 'w-12 bg-gold-light' : 'w-6 bg-white/35 hover:bg-white/60')} />)}</div><div className="hidden gap-6 text-[9px] uppercase tracking-[0.2em] text-white/55 sm:flex"><span>03 ways to begin</span><Link href="/book-consultation" className="text-white/80 transition-colors hover:text-gold-light">Book a consultation <ArrowUpRight size={12} className="ml-1 inline" aria-hidden="true" /></Link></div></div>
        </div>

        <div className="absolute right-5 top-[38%] hidden w-48 overflow-hidden rounded-2xl border border-white/20 bg-black/35 p-2 backdrop-blur-md sm:block lg:right-12 lg:top-[43%] lg:w-56"><img src={HERO_POSTER} alt="Revamp interior detail" className="aspect-[4/3] w-full rounded-xl object-cover opacity-85" loading="eager" /><div className="flex items-center justify-between px-1.5 pb-1 pt-2"><span className="text-[9px] uppercase tracking-[0.16em] text-white/65">Interior / Architecture</span><ArrowUpRight size={13} className="text-white/75" aria-hidden="true" /></div></div>
        <div className="absolute bottom-5 left-5 hidden items-center gap-3 text-[9px] uppercase tracking-[0.24em] text-white/55 sm:flex lg:left-12"><span className="h-px w-8 bg-white/45" /> Scroll to enter</div>
      </div>
    </section>
  )
}

function PhilosophySection() {
  return (
    <section className="motion-reveal border-b border-foreground/10 bg-background bg-[url('https://res.cloudinary.com/r8epy5mg/image/upload/v1785487051/IMG_3513_umthlq.jpg')] bg-cover bg-center bg-no-repeat px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
    {/*<section className="motion-reveal border-b border-foreground/10 bg-background px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">*/}
      <div className="mx-auto grid max-w-[1440px] items-start gap-12 lg:grid-cols-[0.55fr_1fr_0.7fr] lg:gap-16">
        <div>
          <Eyebrow>Why Choose The Revamp UG</Eyebrow>
          <p className="mt-6 max-w-[13rem] text-xs leading-6 text-foreground/65">Two decades of excellence in luxury architecture, interiors and considered living.</p>
        </div>
        <div>
          <h2 className="mx-auto max-w-3xl text-center font-serif text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-[0.9] tracking-[-0.03em]">Why Choose<br /><span className="italic text-foreground/60">The Revamp UG</span></h2>
          <div className="mt-10 border-t border-foreground/15 pt-6 sm:mt-14 sm:flex sm:items-end sm:justify-between sm:gap-8">
            <p className="max-w-md text-sm leading-7 text-foreground/70">We deliver complete luxury living solutions, from architectural conception through final installation. Our white-glove service ensures every detail exceeds expectations, every project tells a story, and every client experiences true refinement.</p>
            <TextLink href="/about">Meet the studio</TextLink>
          </div>
          <div className="mt-10 grid max-w-2xl grid-cols-2 gap-4 border-t border-foreground/15 pt-5 sm:grid-cols-5"><div><p className="font-serif text-3xl font-light text-gold sm:text-4xl"><AnimatedMetric value={250} suffix="+" /></p><p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-foreground/60">Projects Completed</p></div><div><p className="font-serif text-3xl font-light text-gold sm:text-4xl"><AnimatedMetric value={5000} suffix="+" /></p><p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-foreground/60">Products Available</p></div><div><p className="font-serif text-3xl font-light text-gold sm:text-4xl"><AnimatedMetric value={500} suffix="+" /></p><p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-foreground/60">Clients Served</p></div><div><p className="font-serif text-3xl font-light text-gold sm:text-4xl"><AnimatedMetric value={8} /></p><p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-foreground/60">Categories</p></div><div><p className="font-serif text-3xl font-light text-gold sm:text-4xl"><AnimatedMetric value={15} suffix="+" /></p><p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-foreground/60">Years Experience</p></div></div>
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
    <section className="bg-canvas dark:bg-background bg-[url('https://res.cloudinary.com/r8epy5mg/image/upload/v1785487027/5a4511ac98f0cf61f1c938504c4cc9_c34kyo.jpg')] bg-cover bg-center bg-no-repeat px-5 py-12 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-5 border-b border-foreground/15 pb-6 text-center md:pb-8">
          <div>
            <Eyebrow>Explore our services</Eyebrow>
            <h1 className="mx-auto mt-4 max-w-4xl font-serif text-[clamp(2.8rem,7vw,6.5rem)] font-light leading-[0.9] tracking-[-0.03em]">Architectural Mastery</h1>
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8 md:items-end">
            <p className="max-w-lg text-sm leading-7 text-foreground/60">From conceptual design to structural excellence, we craft spaces that inspire</p>
            <Link href="/services" className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-background transition-transform hover:-translate-y-0.5 hover:bg-gold hover:text-foreground">Explore more services <ArrowRight size={14} className="ml-2" aria-hidden="true" /></Link>
          </div>
        </div>

        {loading ? (
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5" aria-label="Loading services" aria-busy="true">
            {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className={`animate-pulse bg-foreground/10 ${item % 2 === 0 ? 'mt-7 h-56' : 'h-64'}`} />)}
          </div>
        ) : visible.length ? (
          <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 md:gap-y-12">
            {visible.map((service, index) => (
              <article key={`${service.categorySlug}-${service.serviceSlug}`} className={`group flex h-full flex-col overflow-hidden rounded-xl border border-foreground/15 bg-background shadow-[0_14px_36px_rgba(0,0,0,0.10)] transition-shadow duration-300 hover:shadow-[0_20px_48px_rgba(0,0,0,0.16)] ${index % 2 === 1 ? 'sm:mt-7 md:mt-14' : ''} ${index === 2 ? 'md:-mt-2' : ''}`}>
                <Link href={`/services/${service.categorySlug}/${service.serviceSlug}`} className="block">
                  <div className="relative aspect-[16/7] overflow-hidden bg-canvas-dark sm:aspect-[4/3]">
                    <img src={service.image || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]} alt={service.serviceName} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                                        <ArrowUpRight size={16} className="absolute right-3 top-3 text-white/75" aria-hidden="true" />
                    <div className="absolute inset-x-3 bottom-3"><p className="text-[9px] uppercase tracking-[0.18em] text-white/60">{service.categoryName}</p><h3 className="mt-1 font-serif text-xl font-light leading-none text-white sm:text-2xl">{service.serviceName}</h3></div>
                  </div>
                </Link>
                <div className="flex flex-1 flex-col p-4 sm:p-5"><p className="line-clamp-2 text-[11px] leading-5 text-foreground/65">{service.description || 'A considered service, shaped around the architecture and the life within it.'}</p><Link href={`/custom-services?service=${encodeURIComponent(service.serviceName)}`} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-background transition-colors hover:bg-gold hover:text-foreground">Request this service <ArrowRight size={14} className="ml-2" aria-hidden="true" /></Link></div>
              </article>
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
          <Eyebrow light>Interior design excellence</Eyebrow>
          <h1 className="mt-4 max-w-4xl font-serif text-10xl font-light leading-[0.95] sm:text-14xl">Interior Design Excellence</h1>
          <p className="mt-6 max-w-sm text-sm leading-6 text-white/70">Every detail meticulously crafted to create spaces of unparalleled beauty</p>
          <div className="mt-8"><TextLink href="/portfolio" light>Explore All Services</TextLink></div>
        </div>
      </div>
    </section>
  )
}

function CollectionsPreview({ products }: { products: Product[] }) {
  const categories = [
    ['Living Room', '/collections?category=Living%20Room', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85'],
    ['Dining', '/collections?category=Dining', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85'],
    ['Bedroom', '/collections?category=Bedroom', 'https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1200&q=85'],
    ['Kitchen', '/collections?category=Kitchen', 'https://images.unsplash.com/photo-1556912167-f556f1f39fdf?auto=format&fit=crop&w=1200&q=85'],
    ['Bathroom', '/collections?category=Bathroom', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85'],
    ['Lighting', '/collections?category=Lighting', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85'],
    ['Office', '/collections?category=Office', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85'],
    ['Outdoor', '/collections?category=Outdoor', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85'],
  ]
  return (
    <section className="bg-background bg-[url('')] bg-cover bg-center bg-no-repeat px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
      <div className="mx-auto max-w-[1440px]"><div className="mb-10 text-center sm:mb-14"><h2 className="mx-auto mt-4 font-serif text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-[0.9] tracking-[-0.03em]">Collections</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Explore our curated selection of luxury furnishings and design elements</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">{categories.map(([name, href, curatedImage], index) => { const product = products.length ? products[index % products.length] : null; const image = curatedImage || (product ? productImage(product, index) : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]); return <Link key={name} href={href} className={`group relative aspect-[4/5] overflow-hidden bg-card ${index % 3 === 1 ? 'sm:mt-10' : ''}`}><img src={image} alt={`${name} collection`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" /><div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" /><div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3"><h3 className="font-sans text-sm font-medium text-white sm:text-base">{name}</h3><ArrowUpRight size={15} className="text-white/80" aria-hidden="true" /></div></Link> })}</div></div>
    </section>
  )
}

function ProjectFeature({ projects, loading }: { projects: Project[]; loading: boolean }) {
  const selected = projects.slice(0, 3)
  return (
    <section className="motion-reveal bg-background bg-[url('https://res.cloudinary.com/r8epy5mg/image/upload/v1785487027/57cabc1197ec1150ccadff431238cf_scjtap.jpg')] bg-cover bg-center bg-no-repeat px-5 py-12 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-7 flex flex-col items-center gap-4 border-b border-foreground/15 pb-6 text-center md:mb-10 md:pb-7">
          <div><h1 className="mx-auto mt-4 max-w-4xl font-serif text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-[0.9] tracking-[-0.03em]">Featured Projects</h1></div>
          <Link href="/portfolio" className="inline-flex min-h-11 items-center rounded-full bg-foreground px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-background transition-colors hover:bg-gold hover:text-foreground">View all projects <ArrowRight size={14} className="ml-2" aria-hidden="true" /></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2" aria-busy="true" aria-label="Loading projects">{[1, 2, 3].map((item) => <div key={item} className="aspect-[16/7] animate-pulse rounded-xl bg-canvas-dark" />)}</div>
        ) : selected.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {selected.map((project, index) => <ProjectTile key={project.id} project={project} index={index} />)}
          </div>
        ) : (
          <div className="border border-dashed border-foreground/20 px-6 py-16 text-center"><p className="font-serif text-3xl font-light">The portfolio is being composed.</p><Link href="/portfolio" className="mt-5 inline-flex text-[10px] uppercase tracking-[0.18em] text-foreground/60 underline underline-offset-4">Visit the portfolio</Link></div>
        )}
      </div>
    </section>
  )
}

function ProjectTile({ project, index }: { project: Project; index: number }) {
  return <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-foreground/15 bg-card shadow-[0_14px_36px_rgba(0,0,0,0.10)] transition-shadow duration-300 hover:shadow-[0_20px_48px_rgba(0,0,0,0.16)]">
    <Link href={`/portfolio/${encodeURIComponent(project.slug)}`} className="block">
      <div className="relative aspect-[16/7] overflow-hidden bg-canvas-dark"><img src={projectImage(project, index)} alt={project.title} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" /><ArrowUpRight size={16} className="absolute right-3 top-3 text-white/80" aria-hidden="true" /></div>
    </Link>
    <div className="flex flex-1 flex-col p-4 sm:p-5"><p className="text-[9px] uppercase tracking-[0.18em] text-primary">{project.category || 'Selected work'}{project.location ? ` · ${project.location}` : ''}</p><Link href={`/portfolio/${encodeURIComponent(project.slug)}`}><h3 className="mt-2 font-serif text-2xl font-light leading-none text-foreground transition-colors group-hover:text-primary sm:text-3xl">{project.title}</h3></Link>{project.description && <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-foreground/65">{project.description}</p>}<Link href={`/portfolio/${encodeURIComponent(project.slug)}`} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-background transition-colors hover:bg-gold hover:text-foreground">View project <ArrowRight size={14} className="ml-2" aria-hidden="true" /></Link></div>
  </article>
}

function ProcessSection() {
  const steps = [
    ['Discover', 'Understanding the client, architecture, lifestyle and ambition.'],
    ['Define', 'Developing the concept, palette, materials and direction.'],
    ['Design', 'Architecture, interiors, furniture and detailing.'],
    ['Source', 'Finding and procuring the right pieces globally.'],
    ['Deliver', 'Logistics, installation, styling and final detailing.'],
  ]
  return (
    <section className="border-y border-foreground/10 bg-canvas dark:bg-background bg-[url('https://res.cloudinary.com/r8epy5mg/image/upload/v1785487067/IMG_3903_gyzbre.jpg')] bg-cover bg-center bg-no-repeat px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32">
      <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
        <div><Eyebrow>The Revamp approach</Eyebrow><h1 className="mt-5 max-w-md font-serif text-5xl font-light leading-[0.95] sm:text-7xl">From vision<br /><span className="italic text-foreground/60">to reality.</span></h1><p className="mt-7 max-w-sm text-sm leading-7 text-foreground/60">We are not simply a designer who hands over drawings. We stay with the work until the final detail is in place.</p></div>
        <div className="border-t border-foreground/15">
          {steps.map(([title, description]) => <div key={title} className="grid gap-3 border-b border-foreground/15 py-5 sm:grid-cols-[0.65fr_1fr] sm:gap-6"><h3 className="font-serif text-2xl font-light leading-none sm:text-3xl">{title}</h3><p className="text-xs leading-5 text-foreground/65 sm:text-sm sm:leading-6">{description}</p></div>)}
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
        <div className="mb-10 flex flex-col items-center gap-6 border-b border-foreground/15 pb-7 text-center"><div><h2 className="mx-auto mt-4 max-w-xl font-serif text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-[0.9] tracking-[-0.03em]">New Arrivals</h2><p className="mt-5 max-w-md text-sm leading-6 text-foreground/60">Latest luxury furnishings from our curated collection</p></div><TextLink href="/collections">View Collection</TextLink></div>
        {loading ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5" aria-busy="true" aria-label="Loading collection">{[1, 2, 3, 4].map((item) => <div key={item} className={`animate-pulse bg-canvas-dark ${item % 2 ? 'aspect-[4/5]' : 'mt-8 aspect-[4/5]'}`} />)}</div> : selected.length ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4 md:items-start md:gap-5">{selected.map((product, index) => <div key={product.id} className={index % 2 === 1 ? 'md:mt-12' : ''}><ProductCard product={product} featured={index === 0} /></div>)}</div> : null}
      </div>
    </section>
  )
}

function JournalSection({ articles, loading }: { articles: Article[]; loading: boolean }) {
  const selected = articles.slice(0, 3)
  return (
    <section className="border-t border-foreground/10 bg-canvas dark:bg-background bg-[url('https://res.cloudinary.com/r8epy5mg/image/upload/v1785487078/L3D124S57ENDOVLZRRYUWLZS6LUFX7Y3WLA8_4000x3000_gb14hk.jpg')] bg-cover bg-center bg-no-repeat px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-[1440px]"><div className="mb-10 flex flex-col items-center gap-6 border-b border-foreground/15 pb-7 text-center"><div><h2 className="mx-auto mt-4 font-serif text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-[0.9] tracking-[-0.03em]">From Our Journal</h2><p className="mt-4 max-w-xl text-sm leading-6 text-foreground/60">Insights, trends, and inspiration for refined living</p></div><TextLink href="/journal">Read the Journal</TextLink></div>{loading ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5" aria-busy="true" aria-label="Loading journal">{[1, 2, 3].map((item) => <div key={item} className={`animate-pulse bg-foreground/10 ${item === 1 ? 'col-span-2 aspect-[16/9] md:col-span-1' : 'aspect-[4/5]'}`} />)}</div> : selected.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">{selected.map((article, index) => <Link key={article.id || article.slug} href={`/journal/${encodeURIComponent(article.slug)}`} className={`group ${index === 0 ? 'col-span-2 md:col-span-1' : index === 1 ? 'mt-8 md:mt-14' : ''}`}><div className={`overflow-hidden bg-canvas-dark ${index === 0 ? 'aspect-[16/10]' : 'aspect-[4/5]'}`}><img src={article.image || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]} alt={article.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" /></div><div className="mt-3"><div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] uppercase tracking-[0.18em] text-foreground/60"><span>{article.category || 'Studio notes'}</span>{article.publishedAt && <span>{shortDate(article.publishedAt)}</span>}</div><h3 className="mt-2 font-serif text-2xl font-light leading-[0.95] sm:text-3xl">{article.title}</h3>{article.excerpt && <p className="mt-2 line-clamp-2 text-xs leading-5 text-foreground/65">{article.excerpt}</p>}</div></Link>)}</div> : <div className="border border-dashed border-foreground/20 px-6 py-12 text-center"><p className="font-serif text-3xl font-light">Notes from the studio, soon.</p><Link href="/journal" className="mt-4 inline-flex text-[10px] uppercase tracking-[0.18em] text-foreground/60 underline underline-offset-4">Visit the journal</Link></div>}</div>
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
      <ServiceWorld services={services} loading={loading} />
      <ProjectFeature projects={projects} loading={loading} />
      <ImageStory image={storyImage} />
      <CollectionsPreview products={products} />
      <PhilosophySection />
      <GallerySection products={products} loading={loading} />
      <JournalSection articles={articles} loading={loading} />
      <section className="bg-obsidian px-5 py-20 text-center text-white sm:px-8 sm:py-28 lg:px-12 lg:py-36"><div className="mx-auto grid max-w-[1440px] justify-items-center gap-10"><div><Eyebrow light>A final thought</Eyebrow><blockquote className="mt-5 max-w-4xl font-serif text-4xl font-light leading-[0.95] sm:text-6xl lg:text-7xl">“The space should feel as though it could only ever have existed this way.”</blockquote></div><div className="md:pb-2"><p className="max-w-sm text-sm leading-7 text-white/60">Our white-glove service ensures every detail exceeds expectations, every project tells a story, and every client experiences true refinement.</p></div></div></section>
      <section className="bg-primary px-5 py-20 text-center text-primary-foreground sm:px-8 sm:py-24 lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-col items-center gap-8"><div><h2 className="mx-auto mt-4 max-w-3xl font-serif text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-[0.9] tracking-[-0.03em]">Request Our Catalog</h2><p className="mt-5 max-w-xl text-sm leading-7 text-primary-foreground/75">Access our comprehensive collection of luxury furnishings and design materials. Receive a beautifully curated PDF catalog delivered to your inbox.</p><p className="mt-3 text-xs text-primary-foreground/65">Earn 500 loyalty points when you request a catalog</p></div><Link href="/contact" className="inline-flex min-h-12 shrink-0 items-center gap-3 self-start rounded-full bg-accent px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-foreground transition-transform hover:-translate-y-0.5 hover:bg-accent/85 md:self-end">Request Catalog Now <ArrowRight size={14} aria-hidden="true" /></Link></div></section>
      <section className="relative overflow-hidden bg-foreground px-5 py-24 text-center text-background sm:px-8 sm:py-32 lg:px-12 lg:py-40"><div className="mx-auto max-w-[1440px]"><Eyebrow light>Begin a project</Eyebrow><div className="mt-6 flex flex-col items-center gap-10"><h2 className="mx-auto max-w-5xl font-serif text-[clamp(3rem,7vw,7.5rem)] font-light leading-[0.83] tracking-[-0.035em]">Your space deserves<br /><span className="italic text-gold-light">a point of view.</span></h2><div className="flex shrink-0 flex-col items-center gap-3 md:pb-2"><TextLink href="/book-consultation" light>Book a consultation</TextLink><TextLink href="/contact" light>Get in touch</TextLink></div></div></div></section>
    </>
  )
}
