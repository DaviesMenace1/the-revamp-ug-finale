import type { Metadata } from 'next'
import { db } from '@/lib/db/client'
import { serviceCategories, services } from '@/lib/db/schema'
import { and, asc, eq } from 'drizzle-orm'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { notFound } from 'next/navigation'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateBreadcrumbSchema, generateServiceSchema } from '@/lib/seo/schema-generator'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ category: string; service: string }>
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug, service: serviceSlug } = await params
  const category = await db.query.serviceCategories.findFirst({ where: eq(serviceCategories.slug, categorySlug) })
  if (!category) return {}
  const service = await db.query.services.findFirst({
    where: and(eq(services.categoryId, category.id), eq(services.slug, serviceSlug), eq(services.status, 'published')),
  })
  if (!service) return {}
  const description = service.description || `${service.name} from The Revamp UG, a Uganda-based interior design and architecture studio.`
  const canonical = `${SITE_URL}/services/${encodeURIComponent(category.slug)}/${encodeURIComponent(service.slug)}`
  const image = service.ogImage || service.image || undefined
  return {
    title: `${service.name} | ${category.name}`,
    description,
    keywords: [service.name, category.name, 'The Revamp UG', 'Uganda', 'Kampala'],
    alternates: { canonical },
    openGraph: { type: 'article', url: canonical, title: `${service.name} | The Revamp UG`, description, images: image ? [{ url: image, alt: service.name }] : undefined },
    twitter: { card: 'summary_large_image', title: `${service.name} | The Revamp UG`, description, images: image ? [image] : undefined },
  }
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { category: categorySlug, service: serviceSlug } = await params

  const category = await db.query.serviceCategories.findFirst({
    where: eq(serviceCategories.slug, categorySlug),
  })

  if (!category) {
    notFound()
  }

  const categoryServices = await db
    .select()
    .from(services)
    .where(eq(services.categoryId, category.id))
    .orderBy(asc(services.order))

  const publishedServices = categoryServices.filter((s) => s.status === 'published')

  const serviceIndex = publishedServices.findIndex((s) => s.slug === serviceSlug)
  const service = publishedServices[serviceIndex]

  if (!service) {
    notFound()
  }

  const prevService = serviceIndex > 0 ? publishedServices[serviceIndex - 1] : null
  const nextService = serviceIndex < publishedServices.length - 1 ? publishedServices[serviceIndex + 1] : null
  const serviceUrl = `${SITE_URL}/services/${encodeURIComponent(category.slug)}/${encodeURIComponent(service.slug)}`
  const serviceImage = service.ogImage || service.image || undefined
  const storySections = Array.isArray(service.storySections) ? service.storySections as Array<{ eyebrow?: string; title: string; body: string; image?: string; imagePosition?: 'left' | 'right' }> : []
  const processSteps = Array.isArray(service.processSteps) ? service.processSteps as Array<{ title: string; description: string }> : []
  const faqs = Array.isArray(service.faqs) ? service.faqs as Array<{ question: string; answer: string }> : []
  const galleryImages = Array.isArray(service.gallery) ? service.gallery.filter((url): url is string => typeof url === 'string' && url.trim().length > 0) : []
  const inquiryHref = `/custom-services?service=${encodeURIComponent(service.name)}`

  return (
    <>
      <SchemaScript schema={generateServiceSchema({ name: service.name, description: service.longDescription || service.description || '', options: { url: serviceUrl, image: serviceImage } })} />
      <SchemaScript schema={generateBreadcrumbSchema([
        { name: 'Home', url: `${SITE_URL}/` },
        { name: 'Services', url: `${SITE_URL}/services` },
        { name: category.name, url: `${SITE_URL}/services/${encodeURIComponent(category.slug)}` },
        { name: service.name, url: serviceUrl },
      ])} />
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="border-b border-border/20 py-6">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/services" className="hover:text-foreground transition-colors">
                Services
              </Link>
              <span>/</span>
              <Link
                href={`/services/${category.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {category.name}
              </Link>
              <span>/</span>
              <span className="text-foreground">{service.name}</span>
            </div>
          </div>
        </section>

        <section className="border-b border-border/20 py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="space-y-6">
              <div className="inline-block">
                <Link
                  href={`/services/${category.slug}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <ArrowLeft size={14} />
                  Back to {category.name}
                </Link>
              </div>
              <h1 className="font-serif text-5xl md:text-6xl font-light text-foreground leading-tight">
                {service.name}
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground font-light">
                {service.description}
              </p>
              {service.image && <img src={service.image} alt={service.name} className="mt-8 aspect-[16/8] w-full object-cover" />}
              {galleryImages.length > 0 && <div className="mt-4 grid grid-cols-3 gap-3">{galleryImages.slice(0, 3).map((url, index) => <img key={`${url}-${index}`} src={url} alt={`${service.name} preview ${index + 1}`} className="aspect-[4/3] w-full object-cover" />)}</div>}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="md:col-span-2 space-y-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-primary">The brief</p>
                  <h2 className="mt-3 font-serif text-4xl font-light leading-tight text-foreground">{service.name}, considered from the inside out.</h2>
                  <p className="mt-5 text-foreground/70 leading-8">{service.longDescription || service.description}</p>
                </div>
                {storySections.map((section, index) => (
                  <article key={`${section.title}-${index}`} className={`grid gap-8 items-center ${section.image ? 'md:grid-cols-2' : ''}`}>
                    <div className={section.imagePosition === 'right' ? 'md:order-first' : ''}><p className="text-[10px] uppercase tracking-[0.25em] text-primary">{section.eyebrow || 'Studio perspective'}</p><h2 className="mt-3 font-serif text-3xl font-light">{section.title}</h2><p className="mt-4 whitespace-pre-line leading-8 text-muted-foreground">{section.body}</p></div>
                    {section.image && <img src={section.image} alt={section.title} className="aspect-[4/3] w-full object-cover" />}
                  </article>
                ))}

                {Array.isArray(service.highlights) && service.highlights.length > 0 && <div><h2 className="font-serif text-3xl font-light text-foreground mb-4">Highlights</h2><div className="grid gap-4 sm:grid-cols-2">{(service.highlights as Array<{ label?: string; value?: string }>).map((highlight, index) => <div key={`${highlight.label}-${index}`} className="border-l-2 border-gold/50 pl-4"><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{highlight.label || `Detail ${index + 1}`}</p><p className="mt-1 text-foreground/80">{highlight.value}</p></div>)}</div></div>}

                {Array.isArray(service.gallery) && service.gallery.length > 0 && (
                  <div>
                    <h2 className="font-serif text-3xl font-light text-foreground mb-4">
                      Gallery
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {(service.gallery as string[]).map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`${service.name} ${idx + 1}`}
                          className="aspect-[4/3] w-full rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {processSteps.length > 0 && <div>
                  <h2 className="font-serif text-3xl font-light text-foreground mb-4">Our process</h2>
                  <div className="space-y-4">
                    {processSteps.map((item, index) => <div key={`${item.title}-${index}`} className="flex gap-4 pb-4 border-b border-border/20 last:border-0"><div className="text-2xl font-light text-muted-foreground">{String(index + 1).padStart(2, '0')}</div><div><h3 className="font-medium text-foreground">{item.title}</h3><p className="text-sm text-foreground/60 mt-1">{item.description}</p></div></div>)}
                  </div>
                </div>}
              </div>

              <div className="md:col-span-1">
                <div className="sticky top-24 space-y-6">
                  <div className="rounded-lg border border-gold/20 bg-gold/5 p-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-primary">Ready when you are</p>
                    <h3 className="mt-3 font-serif text-2xl font-light text-foreground">Start with {service.name}.</h3>
                    <p className="mt-3 text-sm leading-6 text-foreground/70">Share a few details about your space and the studio will take it from there.</p>
                  </div>
                  <Link href={inquiryHref} className="flex min-h-13 w-full items-center justify-center rounded bg-gold px-6 text-center font-medium text-foreground transition-colors hover:bg-gold/90">Request this service</Link>
                                </div>

                {faqs.length > 0 && <div>
                  <h2 className="font-serif text-3xl font-light text-foreground mb-4">Frequently asked</h2>
                  <div className="divide-y divide-border border-y border-border/60">
                    {faqs.map((faq) => (
                      <details key={faq.question} className="group py-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground">
                          {faq.question}
                          <span className="text-gold transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                        </summary>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{faq.answer}</p>
                      </details>
                    ))}
                  </div>
                </div>}
              </div>
            </div>
          </div>
        </section>
        {(prevService || nextService) && (
          <section className="border-t border-border/20 py-16">
            <div className="mx-auto max-w-7xl px-6 md:px-8">
              <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-6">
                More Services in {category.name}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {prevService ? (
                  <Link
                    href={`/services/${category.slug}/${prevService.slug}`}
                    className="group p-6 border border-border/30 rounded-lg hover:border-gold/50 hover:bg-gold/5 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors mb-2">
                      <ArrowLeft size={16} />
                      Previous
                    </div>
                    <h3 className="font-medium text-foreground group-hover:text-gold transition-colors">
                      {prevService.name}
                    </h3>
                  </Link>
                ) : (
                  <div />
                )}

                {nextService ? (
                  <Link
                    href={`/services/${category.slug}/${nextService.slug}`}
                    className="group p-6 border border-border/30 rounded-lg hover:border-gold/50 hover:bg-gold/5 transition-all duration-300 text-right md:text-left"
                  >
                    <div className="flex items-center justify-end md:justify-start gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors mb-2">
                      Next
                      <ArrowRight size={16} />
                    </div>
                    <h3 className="font-medium text-foreground group-hover:text-gold transition-colors">
                      {nextService.name}
                    </h3>
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </section>
        )}

        <section className="border-t border-border/20 bg-foreground text-background py-16">
          <div className="mx-auto max-w-3xl px-6 md:px-8 text-center space-y-6">
            <h2 className="font-serif text-3xl md:text-4xl font-light">
              Ready to get started?
            </h2>
            <p className="opacity-90">
              Schedule a consultation with our experts today to discuss your project.
            </p>
            <Link
              href="/book-consultation"
              className="inline-flex items-center gap-2 bg-gold text-foreground px-8 py-3 rounded font-medium hover:bg-gold/90 transition-colors"
            >
              Book Consultation
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
                       }
