'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, ArrowRight } from 'lucide-react'

const FALLBACK_IMAGE = 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487082/L3D124S57ENDOVMIRRIUWLZS6LUFX73OHPI8_4000x3000_tk64wj.jpg'

type HomepageService = {
  categorySlug: string
  categoryName: string
  serviceSlug: string
  serviceName: string
  description: string | null
  image: string | null
}

export function ServicesSection() {
  const [services, setServices] = useState<HomepageService[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const loadServices = async () => {
      try {
        const response = await fetch('/api/services', { signal: controller.signal })
        const payload = await response.json().catch(() => null) as { data?: unknown } | null
        if (!response.ok || !payload || !Array.isArray(payload.data)) return

        const normalized = payload.data.flatMap((value) => {
          if (!value || typeof value !== 'object') return []
          const record = value as Record<string, unknown>
          const categorySlug = typeof record.categorySlug === 'string' ? record.categorySlug : ''
          const categoryName = typeof record.categoryName === 'string' ? record.categoryName : ''
          const serviceSlug = typeof record.serviceSlug === 'string' ? record.serviceSlug : ''
          const serviceName = typeof record.serviceName === 'string' ? record.serviceName : ''
          if (!categorySlug || !categoryName || !serviceSlug || !serviceName) return []
          return [{
            categorySlug,
            categoryName,
            serviceSlug,
            serviceName,
            description: typeof record.description === 'string' ? record.description : null,
            image: typeof record.image === 'string' ? record.image : null,
          }]
        })
        setServices(normalized.slice(0, 4))
      } catch {
        if (!controller.signal.aborted) setServices([])
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadServices()
    return () => controller.abort()
  }, [])

  return (
    <section className="section-pad bg-background" aria-busy={isLoading}>
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div><div className="gold-line" /><h2 className="font-serif text-4xl font-light leading-tight text-foreground md:text-5xl lg:text-6xl">What We Do</h2></div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">A connected practice across interiors, architecture, sourcing, custom work, and the details that help a project move forward.</p>
          <Link href="/services" className="group inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-widest text-gold hover-line">Explore Services <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></Link>
        </div>

        {isLoading ? <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2" aria-label="Loading services">{[1, 2, 3, 4].map((item) => <div key={item} className="h-[26rem] animate-pulse bg-muted/40" />)}</div> : services.length > 0 ? <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2">{services.map((service, index) => { const image = service.image || FALLBACK_IMAGE; return <Link key={`${service.categorySlug}-${service.serviceSlug}`} href={`/services/${service.categorySlug}/${service.serviceSlug}`} className="group block overflow-hidden bg-background"><div className="relative h-64 overflow-hidden"><div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${image}')` }} role="img" aria-label={service.serviceName} /><div className="absolute inset-0 bg-foreground/40 transition-colors duration-500 group-hover:bg-foreground/20" /><div className="absolute left-6 top-4 font-serif text-5xl font-light leading-none text-white/20">{String(index + 1).padStart(2, '0')}</div><div className="absolute right-6 top-4 flex size-8 items-center justify-center rounded-full border border-white/30 opacity-0 transition-all duration-300 group-hover:border-gold group-hover:opacity-100"><ArrowUpRight size={14} className="text-white group-hover:text-gold" /></div></div><div className="border-t border-border p-6"><p className="text-[10px] uppercase tracking-widest text-primary">{service.categoryName}</p><h3 className="mb-2 mt-2 font-serif text-2xl font-light text-foreground transition-colors group-hover:text-gold">{service.serviceName}</h3><p className="text-sm leading-relaxed text-muted-foreground">{service.description || 'Explore the service details and request a conversation around your brief.'}</p></div></Link> })}</div> : <div className="border border-dashed border-border p-8 text-center"><p className="font-serif text-2xl text-foreground">Explore the studio’s services.</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Browse the service directory or send a brief when you are not sure which path fits.</p><Link href="/services" className="mt-5 inline-flex min-h-11 items-center gap-2 border border-border px-4 text-xs uppercase tracking-widest text-foreground hover:border-gold hover:text-gold">Open services <ArrowRight size={14} /></Link></div>}
      </div>
    </section>
  )
}
