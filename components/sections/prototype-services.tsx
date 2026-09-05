import Image from 'next/image'
import Link from 'next/link'

type LiveService = {
  id: string
  name: string
  slug: string
  description?: string | null
  longDescription?: string | null
  image?: string | null
  ogImage?: string | null
  gallery?: unknown
  category?: { name?: string | null; slug?: string | null } | null
  deliverables?: string[] | null
}

const fallbackServices = [
  ['Global Sourcing', 'Direct relationships with European maisons grant our clients access to limited editions, archival re-issues and bespoke commissions.', ['Maison-direct negotiation', 'Archival & limited-edition access', 'Bespoke commissioning']],
  ['Import & Logistics', 'Customs documentation, freight insurance, climate-controlled crating and last-mile handling - all managed under one roof.', ['Customs & duties handling', 'Insured air & sea freight', 'Bonded warehousing in Kampala']],
  ['White-Glove Installation', 'Our trained installation team positions, levels and assembles every piece on-site, treating fragile finishes with the reverence they deserve.', ['On-site assembly', 'Mounting & rigging', 'Protective transit & placement']],
  ['Interior Styling', 'Beyond the object: art direction across lighting, textiles and accessories to ensure each acquisition resonates with the architecture.', ['Room composition', 'Lighting & textile direction', 'Final styling photography']],
  ['Project Management', 'For full residences and developments, we coordinate timelines and on-site contractors so the interior arrives in step with the build.', ['Procurement scheduling', 'Contractor coordination', 'Installation planning']],
  ['Architecture & Spatial Design', 'From concept sketches to construction documentation, our architectural practice shapes spaces that honour both context and ambition.', ['Residential concept design', 'Interior architecture', 'Planning & permitting support']],
] as const

function serviceImage(service: LiveService, index: number) {
  if (service.image) return service.image
  if (service.ogImage) return service.ogImage
  if (Array.isArray(service.gallery) && typeof service.gallery[0] === 'string') return service.gallery[0]
  return `/prototype/${index % 2 ? 'process-2.jpg' : 'process-1.jpg'}`
}

function ServiceArticle({ service, index }: { service: LiveService; index: number }) {
  const categorySlug = service.category?.slug || 'services'
  const href = `/services/${categorySlug}/${service.slug}`
  const bullets = service.deliverables?.slice(0, 3) || ['Studio consultation', service.category?.name || 'Tailored sourcing', 'Project guidance']
  return (
    <article className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
      <div className={`lg:col-span-5 ${index % 2 ? 'lg:order-2' : ''}`}>
        <Link href={href} className="group block">
          <Image src={serviceImage(service, index)} alt={service.name} width={900} height={1125} className="aspect-[4/5] w-full rounded-md object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
        </Link>
      </div>
      <div className={`lg:col-span-7 ${index % 2 ? 'lg:order-1' : ''}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gilded">{String(index + 1).padStart(2, '0')} · {service.category?.name || 'Studio service'}</p>
        <Link href={href}><h2 className="mt-4 font-serif text-4xl font-medium leading-tight hover:text-gilded md:text-5xl">{service.name}</h2></Link>
        <p className="mt-6 max-w-[50ch] text-lg leading-relaxed text-muted-foreground">{service.longDescription || service.description || 'A considered service shaped around your space, timeline, and point of view.'}</p>
        <ul className="mt-8 space-y-3 border-t border-border pt-6">{bullets.map((bullet) => <li key={bullet} className="flex gap-3 text-sm"><span className="text-gilded">-</span>{bullet}</li>)}</ul>
        <div className="mt-8 flex flex-wrap gap-5 text-[10px] font-semibold uppercase tracking-[0.2em]"><Link href={href} className="text-gilded hover:text-obsidian">Explore this service →</Link><Link href={`/contact?interest=service_inquiry&service=${encodeURIComponent(service.name)}&serviceId=${encodeURIComponent(service.id)}`} className="text-obsidian/65 hover:text-gilded">Make an inquiry →</Link></div>
      </div>
    </article>
  )
}

function FallbackArticle({ item, index }: { item: (typeof fallbackServices)[number]; index: number }) {
  const [title, body, bullets] = item
  return <article className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16"><div className={`lg:col-span-5 ${index % 2 ? 'lg:order-2' : ''}`}><Image src={`/prototype/${index % 2 ? 'process-2.jpg' : 'process-1.jpg'}`} alt={title} width={900} height={1125} className="aspect-[4/5] w-full rounded-md object-cover" /></div><div className={`lg:col-span-7 ${index % 2 ? 'lg:order-1' : ''}`}><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gilded">{String(index + 1).padStart(2, '0')}</p><h2 className="mt-4 font-serif text-4xl font-medium leading-tight md:text-5xl">{title}</h2><p className="mt-6 max-w-[50ch] text-lg leading-relaxed text-muted-foreground">{body}</p><ul className="mt-8 space-y-3 border-t border-border pt-6">{bullets.map((bullet) => <li key={bullet} className="flex gap-3 text-sm"><span className="text-gilded">-</span>{bullet}</li>)}</ul></div></article>
}

export function PrototypeServices({ liveServices = [] }: { liveServices?: LiveService[] }) {
  const hasLiveServices = liveServices.length > 0
  return <>
    <section className="px-6 pb-20 pt-16 lg:px-12"><div className="mx-auto max-w-7xl"><div className="inline-flex items-center gap-3"><span className="h-px w-8 bg-gilded" /><span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gilded">An End-to-End Concierge</span></div><h1 className="mt-6 max-w-4xl font-serif text-5xl font-medium leading-[1.05] md:text-7xl">From the atelier floor <span className="italic">to your foyer.</span></h1><p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">We handle every stage of the journey - so that owning extraordinary furniture in Uganda feels as simple as choosing it.</p></div></section>
    <section className="px-6 pb-24 lg:px-12"><div className="mx-auto max-w-7xl space-y-24">{hasLiveServices ? liveServices.slice(0, 12).map((service, index) => <ServiceArticle key={service.id} service={service} index={index} />) : fallbackServices.map((item, index) => <FallbackArticle key={item[0]} item={item} index={index} />)}</div></section>
    <section className="px-6 pb-32 lg:px-12"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-md bg-obsidian p-12 text-canvas md:flex-row md:items-end md:p-16"><div><h3 className="font-serif text-4xl md:text-5xl">Begin a project with us.</h3><p className="mt-4 max-w-md text-canvas/60">Share your vision; we will return with sourcing options within seven days.</p></div><Link href="/book-consultation" className="rounded-full bg-canvas px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-obsidian hover:bg-gilded">Book a Consultation</Link></div></section>
  </>
}
