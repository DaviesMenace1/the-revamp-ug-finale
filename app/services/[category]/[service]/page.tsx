import { db } from '@/lib/db/client'
import { serviceCategories, services } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ category: string; service: string }>
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

  return (
    <>
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
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="md:col-span-2 space-y-8">
                <div>
                  <h2 className="font-serif text-3xl font-light text-foreground mb-4">
                    Overview
                  </h2>
                  <p className="text-foreground/70 leading-relaxed">
                    {service.longDescription || service.description}
                  </p>
                </div>

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

                <div>
                  <h2 className="font-serif text-3xl font-light text-foreground mb-4">
                    What We Offer
                  </h2>
                  <ul className="space-y-3">
                    {[
                      'Expert consultation and assessment',
                      'Customized solutions tailored to your needs',
                      'Professional execution and management',
                      'Post-delivery support and follow-up',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-foreground/70">
                        <span className="text-gold mt-1">→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="font-serif text-3xl font-light text-foreground mb-4">
                    Our Process
                  </h2>
                  <div className="space-y-4">
                    {[
                      { step: '01', title: 'Consultation', desc: 'We meet to understand your vision, requirements, and budget.' },
                      { step: '02', title: 'Design', desc: 'Our team creates comprehensive designs and proposals.' },
                      { step: '03', title: 'Implementation', desc: 'Meticulous execution with attention to every detail.' },
                      { step: '04', title: 'Completion', desc: 'Final delivery and handover with ongoing support.' },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-4 pb-4 border-b border-border/20 last:border-0">
                        <div className="text-2xl font-light text-muted-foreground">{item.step}</div>
                        <div>
                          <h3 className="font-medium text-foreground">{item.title}</h3>
                          <p className="text-sm text-foreground/60 mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-1">
                <div className="sticky top-24 space-y-6">
                  <div className="p-6 bg-gold/5 border border-gold/20 rounded-lg">
                    <h3 className="font-serif text-xl font-light text-foreground mb-2">
                      {service.name}
                    </h3>
                    <p className="text-sm text-foreground/70">
                      Part of our {category.name} services
                    </p>
                  </div>

                  <Link
                    href="/book-consultation"
                    className="block w-full text-center px-6 py-3 bg-gold text-foreground rounded font-medium hover:bg-gold/90 transition-colors"
                  >
                    Request Service
                  </Link>

                  <div className="p-6 border border-border/30 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-foreground">Have questions?</p>
                    <p className="text-sm text-foreground/70">
                      Contact our team to discuss how this service can transform your project.
                    </p>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-1 text-sm text-gold hover:text-gold/80 transition-colors"
                    >
                      Get in Touch
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
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
