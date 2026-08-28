import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, MapPin, Ruler, Sparkles } from 'lucide-react'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateBreadcrumbSchema, generateProjectSchema } from '@/lib/seo/schema-generator'
import LikeButton from '@/components/like-button'
import { getProjectBySlug, getPublishedProjects } from '@/lib/db/queries'
import { resolveProductImageUrls } from '@/lib/utils'

interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

function valueOrFallback(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) return { title: 'Project Not Found', description: 'This project could not be found' }

  const heroImage = resolveProductImageUrls(project)[0]
  const canonical = `${SITE_URL}/portfolio/${encodeURIComponent(slug)}`
  return {
    title: `${project.title} | The Revamp UG`,
    alternates: { canonical },
    description: project.shortDescription || project.description || 'A project by The Revamp UG.',
    openGraph: {
      title: project.title,
      description: project.shortDescription || project.description || undefined,
      type: 'website',
      url: canonical,
      images: heroImage ? [{ url: heroImage, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.shortDescription || project.description || undefined,
      images: heroImage ? [heroImage] : [],
    },
  }
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  const allProjects = await getPublishedProjects(100, 0)
  const relatedProjects = allProjects.filter((item) => item.slug !== slug && item.category === project.category).slice(0, 3)
  const heroImage = resolveProductImageUrls(project)[0]
  const galleryImages = resolveProductImageUrls(project).slice(1)
  const description = project.shortDescription || project.description || 'A considered interior by The Revamp studio.'
  const storyParagraphs = (project.longDescription || '').split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
  const storySections = Array.isArray(project.storySections) ? project.storySections as Array<{ eyebrow?: string; title: string; body: string; image?: string }> : []
  const projectUrl = `${SITE_URL}/portfolio/${encodeURIComponent(slug)}`
  const projectSchema = generateProjectSchema({
    name: project.title,
    description,
    image: heroImage,
    location: project.location,
    startDate: project.createdAt ? new Date(project.createdAt).toISOString() : new Date().toISOString(),
    url: projectUrl,
  })

  return (
    <>
      <SchemaScript schema={projectSchema} />
      <SchemaScript schema={generateBreadcrumbSchema([
        { name: 'Home', url: `${SITE_URL}/` },
        { name: 'Portfolio', url: `${SITE_URL}/portfolio` },
        { name: project.title, url: projectUrl },
      ])} />
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden bg-obsidian text-ivory">
          <div className="relative aspect-[4/5] min-h-[32rem] w-full sm:aspect-[16/10] lg:aspect-[16/9]">
            <Image src={heroImage} alt={project.title} fill priority className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-5 pb-10 sm:px-8 sm:pb-14 lg:px-16 lg:pb-20">
              <div className="mx-auto max-w-[1440px] motion-reveal">
                <Link href="/portfolio" className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.18em] text-ivory/70 transition-colors hover:text-gold"><ArrowLeft className="size-4" />Back to selected work</Link>
                <p className="mt-8 text-[10px] uppercase tracking-[0.3em] text-gold">{project.category || 'Studio project'}</p>
                <h1 className="mt-4 max-w-5xl font-serif text-5xl font-light leading-[0.9] sm:text-7xl lg:text-[8.5rem]">{project.title}</h1>
                <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ivory/65"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{valueOrFallback(project.location, 'Uganda')}</span>{project.year && <span>{project.year}</span>}{project.client && <span>For {project.client}</span>}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/70 px-5 py-14 sm:px-8 md:py-20 lg:px-16">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="max-w-3xl motion-reveal"><p className="text-[10px] uppercase tracking-[0.25em] text-primary">The brief</p><h2 className="mt-4 font-serif text-4xl font-light leading-tight sm:text-5xl">A space shaped around its people.</h2><p className="mt-6 text-base leading-8 text-muted-foreground sm:text-lg">{description}</p></div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-8 border-l border-border/70 pl-6 sm:pl-10">
              <div><dt className="text-[10px] uppercase tracking-[0.2em] text-primary">Location</dt><dd className="mt-2 text-sm text-foreground">{valueOrFallback(project.location, 'Uganda')}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-[0.2em] text-primary">Year</dt><dd className="mt-2 text-sm text-foreground">{valueOrFallback(project.year, 'Studio archive')}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-[0.2em] text-primary">Category</dt><dd className="mt-2 text-sm text-foreground">{valueOrFallback(project.category, 'Interior design')}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-[0.2em] text-primary">Approach</dt><dd className="mt-2 text-sm text-foreground">Bespoke studio work</dd></div>
            </dl>
          </div>
        </section>

        {(storySections.length > 0 || storyParagraphs.length > 0) && <section className="border-b border-border/70 px-5 py-14 sm:px-8 md:py-20 lg:px-16"><div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[0.65fr_1.35fr]"><div><p className="text-[10px] uppercase tracking-[0.25em] text-primary">The story</p><h2 className="mt-4 font-serif text-4xl font-light leading-tight sm:text-5xl">The thinking behind the room.</h2></div><div className="space-y-10 text-base leading-8 text-muted-foreground sm:text-lg">{storySections.length > 0 ? storySections.map((section, index) => <article key={`${project.id}-story-${index}`} className="grid gap-6 md:grid-cols-2 md:items-center"><div><p className="text-[10px] uppercase tracking-[0.25em] text-primary">{section.eyebrow || "Project note"}</p><h3 className="mt-2 font-serif text-3xl font-light text-foreground">{section.title}</h3><p className="mt-4 whitespace-pre-line">{section.body}</p></div>{section.image && <Image src={section.image} alt={section.title} width={1200} height={900} className="aspect-[4/3] w-full object-cover" />}</article>) : storyParagraphs.map((paragraph, index) => <p key={`${project.id}-story-${index}`}>{paragraph}</p>)}</div></div></section>}

        {galleryImages.length > 0 && <section className="px-5 py-14 sm:px-8 md:py-20 lg:px-16"><div className="mx-auto max-w-[1440px]"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.25em] text-primary">Inside the project</p><h2 className="mt-3 font-serif text-4xl font-light sm:text-5xl">Material, light, proportion.</h2></div><span className="hidden text-xs uppercase tracking-[0.15em] text-muted-foreground sm:block">{galleryImages.length} views</span></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-12">{galleryImages.map((image, index) => <div key={`${image}-${index}`} className={`motion-reveal relative overflow-hidden bg-muted ${index % 5 === 0 ? 'sm:col-span-2 lg:col-span-7 lg:row-span-2 aspect-[5/4]' : index % 3 === 0 ? 'lg:col-span-5 aspect-[4/5]' : 'lg:col-span-4 aspect-[4/3]'}`} style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}><Image src={image} alt={`${project.title}, view ${index + 1}`} fill className="object-cover transition duration-700 hover:scale-[1.025]" sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 40vw" /></div>)}</div></div></section>}

        <section className="border-y border-border/70 bg-muted/25 px-5 py-12 sm:px-8 lg:px-16"><div className="mx-auto grid max-w-[1440px] gap-6 sm:grid-cols-3"><div className="flex gap-4"><Sparkles className="mt-1 size-5 text-gold" /><div><p className="text-sm font-medium">Considered sourcing</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Materials, objects, and finishes selected with intention.</p></div></div><div className="flex gap-4"><Ruler className="mt-1 size-5 text-gold" /><div><p className="text-sm font-medium">Made for the room</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Every decision responds to proportion, light, and daily life.</p></div></div><div className="flex gap-4"><ArrowUpRight className="mt-1 size-5 text-gold" /><div><p className="text-sm font-medium">Begin your own brief</p><Link href="/book-consultation" className="mt-1 inline-flex text-sm text-primary underline underline-offset-4">Work with the studio</Link></div></div></div></section>

        {relatedProjects.length > 0 && <section className="px-5 py-14 sm:px-8 md:py-20 lg:px-16"><div className="mx-auto max-w-[1440px]"><p className="text-[10px] uppercase tracking-[0.25em] text-primary">Continue exploring</p><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{relatedProjects.map((related) => <Link key={related.id} href={`/portfolio/${related.slug}`} className="group"><div className="relative aspect-[4/3] overflow-hidden bg-muted"><Image src={resolveProductImageUrls(related)[0]} alt={related.title} fill className="object-cover transition duration-700 group-hover:scale-[1.04]" sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" /></div><div className="flex items-center justify-between border-b border-border/70 py-4"><div><p className="text-[10px] uppercase tracking-[0.18em] text-primary">{related.category || 'Project'}</p><h3 className="mt-2 font-serif text-2xl font-light">{related.title}</h3></div><ArrowUpRight className="size-5 text-muted-foreground transition-colors group-hover:text-gold" /></div></Link>)}</div></div></section>}

        <section className="border-t border-border/70 px-5 py-12 sm:px-8 lg:px-16"><div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4"><p className="text-sm text-muted-foreground">Did this project spark an idea?</p><LikeButton initial={project.likes ?? 0} /></div></section>
      </main>
      <SiteFooter />
    </>
  )
}
