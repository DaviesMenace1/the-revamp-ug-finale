import type { Metadata } from 'next'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { getPublishedProjects } from '@/lib/db/queries'
import PortfolioGrid from './portfolio-grid'
import { SchemaScript } from '@/components/seo/schema-script'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Interior Design and Architecture Portfolio | The Revamp UG',
  description: 'View selected residential, hospitality, and commercial interior design and architecture projects by The Revamp UG in Uganda.',
  keywords: ['interior design portfolio Uganda', 'architecture portfolio Kampala', 'hospitality design Uganda', 'commercial interiors Uganda', 'The Revamp UG projects'],
  alternates: { canonical: `${SITE_URL}/portfolio` },
  openGraph: { type: 'website', url: `${SITE_URL}/portfolio`, title: 'Interior Design and Architecture Portfolio | The Revamp UG', description: 'Selected spaces and case studies from The Revamp UG.' },
  twitter: { card: 'summary_large_image', title: 'Interior Design and Architecture Portfolio | The Revamp UG', description: 'Selected spaces and case studies from The Revamp UG.' },
}

export default async function PortfolioPage() {
  const projects = await getPublishedProjects(100, 0)
  const projectItems = projects.map((project, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: project.title,
    url: `${SITE_URL}/portfolio/${encodeURIComponent(project.slug)}`,
  }))

  return (
    <>
      <SchemaScript schema={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'The Revamp UG Portfolio', url: `${SITE_URL}/portfolio`, mainEntity: { '@type': 'ItemList', itemListElement: projectItems } }} />
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden bg-obsidian px-5 pb-16 pt-36 text-ivory sm:px-8 md:pb-24 md:pt-48 lg:px-16">
          <div className="absolute right-[-10%] top-[-25%] size-[42rem] rounded-full border border-gold/20" aria-hidden="true" />
          <div className="absolute bottom-[-70%] left-[38%] size-[38rem] rounded-full border border-ivory/10" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-5xl motion-reveal">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">The Revamp studio / selected work</p>
              <h1 className="mt-5 max-w-4xl font-serif text-6xl font-light leading-[0.9] tracking-tight sm:text-8xl lg:text-[9rem]">Spaces with a point of view.</h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-ivory/65 sm:text-lg">A living archive of residential, hospitality, and commercial interiors shaped around how people actually live, gather, and move.</p>
            </div>
            <div className="flex items-end gap-5 border-l border-gold/45 pl-5 text-sm text-ivory/60 lg:mb-2 lg:flex-col lg:items-start lg:gap-1">
              <span className="font-serif text-5xl text-ivory">{projects.length.toString().padStart(2, '0')}</span>
              <span className="max-w-[12rem] leading-6">Published case studies<br />from the Revamp studio</span>
            </div>
          </div>
        </section>
        <PortfolioGrid projects={projects} />
      </main>
      <SiteFooter />
    </>
  )
}
