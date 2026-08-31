import type { Metadata } from 'next'
import { db } from '@/lib/db/client'
import { serviceCategories, services } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from '@/components/ui/luxury-icons'
import { notFound } from 'next/navigation'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateBreadcrumbSchema } from '@/lib/seo/schema-generator'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ category: string }>
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug } = await params
  const category = await db.query.serviceCategories.findFirst({
    where: eq(serviceCategories.slug, categorySlug),
  })
  if (!category || category.status !== 'published') return {}
  const description = category.description || `${category.name} services from The Revamp UG, a Uganda-based interior design and architecture studio.`
  const canonical = `${SITE_URL}/services/${encodeURIComponent(category.slug)}`
  return {
    title: `${category.name} Services in Uganda`,
    description,
    keywords: [category.name, `${category.name} Uganda`, 'The Revamp UG', 'Kampala'],
    alternates: { canonical },
    openGraph: { type: 'website', url: canonical, title: `${category.name} Services | The Revamp UG`, description },
    twitter: { card: 'summary_large_image', title: `${category.name} Services | The Revamp UG`, description },
  }
}

export default async function ServiceCategoryPage({ params }: PageProps) {
  const { category: categorySlug } = await params

  const allCategories = await db
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.status, 'published'))
    .orderBy(asc(serviceCategories.order))

  const categoryIndex = allCategories.findIndex((c) => c.slug === categorySlug)
  const category = allCategories[categoryIndex]

  if (!category) {
    notFound()
  }

  const categoryServices = await db
    .select()
    .from(services)
    .where(eq(services.categoryId, category.id))
    .orderBy(asc(services.order))

  const publishedServices = categoryServices.filter((s) => s.status === 'published')

  const prevCategory = categoryIndex > 0 ? allCategories[categoryIndex - 1] : null
  const nextCategory = categoryIndex < allCategories.length - 1 ? allCategories[categoryIndex + 1] : null
  const categoryUrl = `${SITE_URL}/services/${encodeURIComponent(category.slug)}`

  return (
    <>
      <SchemaScript schema={generateBreadcrumbSchema([
        { name: 'Home', url: `${SITE_URL}/` },
        { name: 'Services', url: `${SITE_URL}/services` },
        { name: category.name, url: categoryUrl },
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
              <span className="text-foreground">{category.name}</span>
            </div>
          </div>
        </section>

        <section className="border-b border-border/20 py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="space-y-6">
              <h1 className="font-serif text-5xl md:text-6xl font-light text-foreground leading-tight">
                {category.name}
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground font-light">
                {category.description}
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="space-y-6">
              {publishedServices.map((service, idx) => (
                <Link
                  key={service.slug}
                  href={`/services/${category.slug}/${service.slug}`}
                  className="group block"
                >
                  <div className="p-8 border border-border/30 rounded-lg hover:border-gold/50 hover:bg-gold/5 transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-3xl font-light text-muted-foreground group-hover:text-gold transition-colors">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <h3 className="font-serif text-2xl font-light text-foreground group-hover:text-gold transition-colors">
                            {service.name}
                          </h3>
                        </div>
                        <p className="text-foreground/70 max-w-2xl">
                          {service.description}
                        </p>
                      </div>
                      <ArrowRight
                        size={20}
                        className="text-muted-foreground group-hover:text-gold transition-all duration-300 ml-6 flex-shrink-0 group-hover:translate-x-1 mt-1"
                      />
                    </div>
                  </div>
                </Link>
              ))}

              {publishedServices.length === 0 && (
                <p className="text-center text-muted-foreground py-10">
                  No services in this category yet.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-border/20 py-16">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {prevCategory ? (
                <Link
                  href={`/services/${prevCategory.slug}`}
                  className="group p-6 border border-border/30 rounded-lg hover:border-gold/50 hover:bg-gold/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors mb-2">
                    <ArrowLeft size={16} />
                    Previous Category
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-gold transition-colors">
                    {prevCategory.name}
                  </h3>
                </Link>
              ) : (
                <div />
              )}

              {nextCategory ? (
                <Link
                  href={`/services/${nextCategory.slug}`}
                  className="group p-6 border border-border/30 rounded-lg hover:border-gold/50 hover:bg-gold/5 transition-all duration-300 text-right md:text-left"
                >
                  <div className="flex items-center justify-end md:justify-start gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors mb-2">
                    Next Category
                    <ArrowRight size={16} />
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-gold transition-colors">
                    {nextCategory.name}
                  </h3>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-border/20 bg-foreground text-background py-16">
          <div className="mx-auto max-w-3xl px-6 md:px-8 text-center space-y-6">
            <h2 className="font-serif text-3xl md:text-4xl font-light">
              Interested in {category.name}?
            </h2>
            <p className="opacity-90">
              Schedule a consultation with our experts to discuss your specific needs.
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
