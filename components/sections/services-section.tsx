'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

type HomepageService = {
  categorySlug: string
  categoryName: string
  serviceSlug: string
  serviceName: string
  description: string | null
  image: string | null
}

const FALLBACK_IMAGE = 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487082/L3D124S57ENDOVMIRRIUWLZS6LUFX73OHPI8_4000x3000_tk64wj.jpg'

function isCategory(service: HomepageService, terms: string[]) {
  const value = `${service.categorySlug} ${service.categoryName}`.toLowerCase()
  return terms.some((term) => value.includes(term))
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
        setServices(normalized)
      } catch {
        if (!controller.signal.aborted) setServices([])
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadServices()
    return () => controller.abort()
  }, [])

  const groups = useMemo(() => {
    const architecture = services.filter((service) => isCategory(service, ['architecture']))
    const interiors = services.filter((service) => isCategory(service, ['interior', 'interiors']))
    const chosen = [
      architecture.length ? { key: 'architecture', title: architecture[0].categoryName, services: architecture } : null,
      interiors.length ? { key: 'interior', title: interiors[0].categoryName, services: interiors } : null,
    ].filter(Boolean) as { key: string; title: string; services: HomepageService[] }[]

    if (chosen.length === 2) return chosen

    const categoryMap = new Map<string, HomepageService[]>()
    for (const service of services) {
      const key = service.categorySlug
      const current = categoryMap.get(key) || []
      current.push(service)
      categoryMap.set(key, current)
    }
    for (const [key, categoryServices] of categoryMap) {
      if (chosen.some((group) => group.key === key)) continue
      chosen.push({ key, title: categoryServices[0].categoryName, services: categoryServices })
      if (chosen.length === 2) break
    }
    return chosen
  }, [services])

  return (
    <section className="section-pad bg-background" aria-busy={isLoading}>
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="gold-line" />
            <h2 className="font-serif text-4xl font-light leading-tight text-foreground md:text-5xl lg:text-6xl">The practice</h2>
          </div>
          <div className="max-w-md">
            <p className="text-sm leading-6 text-muted-foreground">Architecture and interiors, connected by one considered approach to how a space should look, feel and live.</p>
            <Link href="/services" className="group mt-5 inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.16em] text-primary">Explore all services <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-px bg-border md:grid-cols-2" aria-label="Loading services">{[1, 2].map((item) => <div key={item} className="h-[28rem] animate-pulse bg-muted/40" />)}</div>
        ) : groups.length > 0 ? (
          <div className="grid gap-px bg-border md:grid-cols-2">
            {groups.map((group, groupIndex) => (
              <div key={group.key} className={`group relative overflow-hidden p-7 sm:p-10 ${groupIndex === 0 ? 'bg-foreground text-background' : 'bg-card text-foreground'}`}>
                <div className="absolute inset-0 opacity-20 transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `linear-gradient(to top, currentColor 0%, transparent 65%), url('${group.services[0].image || FALLBACK_IMAGE}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} aria-hidden="true" />
                <div className="relative flex min-h-[28rem] flex-col justify-end">
                  <p className={`text-[10px] uppercase tracking-[0.28em] ${groupIndex === 0 ? 'text-primary' : 'text-primary'}`}>{String(groupIndex + 1).padStart(2, '0')}  -  The practice</p>
                  <h3 className="mt-3 max-w-lg font-serif text-4xl font-light sm:text-5xl">{group.title}</h3>
                  <div className="mt-7 grid gap-2 sm:grid-cols-2">
                    {group.services.slice(0, 4).map((service) => (
                      <Link key={`${service.categorySlug}-${service.serviceSlug}`} href={`/services/${service.categorySlug}/${service.serviceSlug}`} className={`flex items-center justify-between border-t py-3 text-xs uppercase tracking-[0.12em] transition-colors ${groupIndex === 0 ? 'border-background/20 text-background/70 hover:text-primary' : 'border-border text-muted-foreground hover:text-primary'}`}>
                        <span>{service.serviceName}</span><ArrowUpRight size={13} />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border p-8 text-center"><p className="font-serif text-2xl text-foreground">Explore the studio’s services.</p><Link href="/services" className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-widest text-primary">Open services <ArrowRight size={14} /></Link></div>
        )}
      </div>
    </section>
  )
}
