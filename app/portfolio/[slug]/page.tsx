'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useState } from 'react'
import type { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateProjectSchema } from '@/lib/seo/schema-generator'

interface ProjectPageProps {
  params: { slug: string }
}

const projectDetails: Record<string, any> = {
  'nakasero-residence': {
    title: 'The Nakasero Residence',
    category: 'Residential Interior',
    location: 'Kampala, Uganda',
    year: '2024',
    description:
      'A full interior design of a hillside family residence in Nakasero, balancing warm materiality with contemporary restraint and framing panoramic city views.',
    challenge: 'Unifying a large multi-level home into one calm, cohesive design language.',
    solution:
      'We developed a layered neutral palette, custom joinery, and curated lighting that flows seamlessly across every level of the home.',
    highlights: [
      'Bespoke joinery throughout',
      'Curated statement lighting',
      'Warm, tactile material palette',
      'View-framing living spaces',
    ],
    timeline: [
      { phase: 'Consultation & Concept', duration: '3 weeks' },
      { phase: 'Design Development', duration: '8 weeks' },
      { phase: 'Sourcing & Procurement', duration: '10 weeks' },
      { phase: 'Installation & Styling', duration: '3 weeks' },
    ],
    services: ['Interior Design', 'Furniture Sourcing', 'Installation'],
  },
  'kololo-villa-renovation': {
    title: 'Kololo Villa Renovation',
    category: 'Architecture',
    location: 'Kololo, Uganda',
    year: '2024',
    description:
      'An architectural renovation of a classic Kololo villa, reworking the plan for modern living while preserving the home\u2019s original character.',
    challenge: 'Opening up a compartmentalized plan without losing the villa\u2019s heritage charm.',
    solution:
      'We reconfigured the ground floor around a central courtyard, introduced large glazed openings, and restored key period details.',
    highlights: [
      'Reworked open-plan ground floor',
      'Central courtyard connection',
      'Restored heritage detailing',
      'Expansive glazed openings',
    ],
    timeline: [
      { phase: 'Survey & Planning', duration: '3 weeks' },
      { phase: 'Design Development', duration: '8 weeks' },
      { phase: 'Construction', duration: '16 weeks' },
      { phase: 'Final Installations', duration: '3 weeks' },
    ],
    services: ['Architecture', 'Interior Design', 'Project Management'],
  },
  'serena-penthouse-suite': {
    title: 'Serena Penthouse Suite',
    category: 'Hospitality',
    location: 'Kampala, Uganda',
    year: '2023',
    description:
      'A signature penthouse suite for a leading hospitality group, designed as a refined, residential-feeling retreat above the city.',
    challenge: 'Delivering a luxury hospitality standard that still feels personal and warm.',
    solution:
      'We layered soft textures, bespoke furniture, and dimmable ambient lighting to create an intimate yet elevated guest experience.',
    highlights: [
      'Residential-style suite layout',
      'Bespoke furniture pieces',
      'Layered ambient lighting',
      'Premium textile palette',
    ],
    timeline: [
      { phase: 'Brand & Concept', duration: '3 weeks' },
      { phase: 'Design Development', duration: '6 weeks' },
      { phase: 'Sourcing & Procurement', duration: '8 weeks' },
      { phase: 'Installation & Launch', duration: '2 weeks' },
    ],
    services: ['Interior Design', 'Sourcing', 'Installation'],
  },
  'muyenga-heritage-home': {
    title: 'Muyenga Heritage Home',
    category: 'Residential Interior',
    location: 'Muyenga, Uganda',
    year: '2023',
    description:
      'A sensitive interior refresh of a beloved family home in Muyenga, honoring its history while introducing contemporary comfort.',
    challenge: 'Modernizing the interiors without erasing decades of family character.',
    solution:
      'We preserved key heirloom pieces, reupholstered and restored where possible, and wove them into a refreshed contemporary scheme.',
    highlights: [
      'Restored heirloom furniture',
      'Contemporary comfort upgrades',
      'Enhanced natural light',
      'Cohesive refreshed palette',
    ],
    timeline: [
      { phase: 'Consultation & Concept', duration: '2 weeks' },
      { phase: 'Design Development', duration: '6 weeks' },
      { phase: 'Sourcing & Procurement', duration: '6 weeks' },
      { phase: 'Installation & Styling', duration: '2 weeks' },
    ],
    services: ['Interior Design', 'Restoration', 'Installation'],
  },
  'pearl-marina-corporate-hq': {
    title: 'Pearl Marina Corporate HQ',
    category: 'Commercial Design',
    location: 'Entebbe, Uganda',
    year: '2023',
    description:
      'A full commercial fit-out for a corporate headquarters at Pearl Marina, designed to promote collaboration and reflect the brand.',
    challenge: 'Creating an engaging, brand-aligned workplace across a large open floorplate.',
    solution:
      'We zoned the floor into collaborative and focus areas, introduced natural materials, and integrated brand accents throughout.',
    highlights: [
      'Collaborative open workspace',
      'Dedicated focus zones',
      'Brand-integrated design',
      'Natural material palette',
    ],
    timeline: [
      { phase: 'Strategic Planning', duration: '3 weeks' },
      { phase: 'Design & Approvals', duration: '6 weeks' },
      { phase: 'Construction & Installation', duration: '12 weeks' },
      { phase: 'Final Styling', duration: '2 weeks' },
    ],
    services: ['Architecture', 'Interior Design', 'Project Management'],
  },
  'skyline-apartment': {
    title: 'Skyline Apartment',
    category: 'Residential',
    location: 'Kampala, Uganda',
    year: '2023',
    description: 'A contemporary urban apartment designed for a young executive. The project emphasized maximizing limited space with multifunctional furniture and strategic color blocking.',
    challenge: 'The 800 sq ft apartment needed to serve as both living and working space without feeling cramped or cluttered.',
    solution: 'We created distinct zones using furniture arrangement and subtle color transitions, incorporated custom storage solutions, and selected pieces that served multiple purposes.',
    highlights: [
      'Open-concept living area with integrated workspace',
      'Custom built-in storage throughout',
      'Statement lighting as functional art',
      'Luxury finishes on a urban budget',
    ],
    timeline: [
      { phase: 'Consultation & Concept', duration: '2 weeks' },
      { phase: 'Design Development', duration: '4 weeks' },
      { phase: 'Sourcing & Procurement', duration: '6 weeks' },
      { phase: 'Installation & Styling', duration: '2 weeks' },
    ],
    services: ['Interior Design', 'Furniture Sourcing', 'Installation'],
  },
  'corporate-office': {
    title: 'Corporate Office Refurbishment',
    category: 'Commercial',
    location: 'Nairobi, Kenya',
    year: '2023',
    description: 'Complete refurbishment of a corporate headquarters for a major tech company. The design balances modern efficiency with welcoming warmth across 15,000 sq ft.',
    challenge: 'Transforming a sterile corporate space into an engaging environment that promotes collaboration and reflects company values.',
    solution: 'We implemented open floor plans with collaborative zones, introduced natural materials and warm colors, and created dedicated spaces for different work styles.',
    highlights: [
      'Collaborative open workspace',
      'Private focus areas for deep work',
      'Casual meeting zones',
      'High-quality finishes throughout',
    ],
    timeline: [
      { phase: 'Strategic Planning', duration: '3 weeks' },
      { phase: 'Design & Approvals', duration: '6 weeks' },
      { phase: 'Construction & Installation', duration: '12 weeks' },
      { phase: 'Final Styling', duration: '2 weeks' },
    ],
    services: ['Architecture', 'Interior Design', 'Project Management'],
  },
  'villa-renovation': {
    title: 'Lakeside Villa Renovation',
    category: 'Residential',
    location: 'Entebbe, Uganda',
    year: '2022',
    description: 'Complete renovation of a 1970s villa with modern updates while preserving its architectural character and lake views.',
    challenge: 'Honoring the property\'s heritage while introducing contemporary comfort and efficiency.',
    solution: 'We carefully restored original features, added modern systems, and created flexible living spaces that celebrate the lake views.',
    highlights: [
      'Restored original hardwood floors',
      'Modern kitchen with period-appropriate design',
      'Expanded living areas',
      'Seamless indoor-outdoor flow',
    ],
    timeline: [
      { phase: 'Survey & Planning', duration: '2 weeks' },
      { phase: 'Design Development', duration: '8 weeks' },
      { phase: 'Construction', duration: '16 weeks' },
      { phase: 'Final Installations', duration: '3 weeks' },
    ],
    services: ['Architecture', 'Interior Design', 'Installation'],
  },
  'retail-showroom': {
    title: 'Luxury Retail Showroom',
    category: 'Commercial',
    location: 'Kampala, Uganda',
    year: '2023',
    description: 'A high-end furniture and d\u00e9cor showroom designed to showcase collections in curated vignettes and inspire customers.',
    challenge: 'Creating an engaging retail environment that displays 500+ products while maintaining a cohesive luxury aesthetic.',
    solution: 'We designed thematic zones, strategic lighting, and flexible display systems that highlight products while telling a design story.',
    highlights: [
      'Multiple thematic vignettes',
      'Professional product lighting',
      'Customer consultation zones',
      'Seasonal flexibility',
    ],
    timeline: [
      { phase: 'Concept Development', duration: '4 weeks' },
      { phase: 'Detailed Design', duration: '6 weeks' },
      { phase: 'Installation', duration: '4 weeks' },
      { phase: 'Launch & Styling', duration: '2 weeks' },
    ],
    services: ['Interior Design', 'Installation', 'Project Management'],
  },
  'penthouse-suite': {
    title: 'Penthouse Suite Design',
    category: 'Residential',
    location: 'Dar es Salaam, Tanzania',
    year: '2022',
    description: 'Luxury penthouse with 360-degree city views designed as a contemporary art collector\'s home and entertainment space.',
    challenge: 'Creating a sophisticated backdrop for a significant art collection while maintaining functional living spaces.',
    solution: 'We designed neutral, museum-quality walls with strategic lighting to showcase art, while creating warm living zones.',
    highlights: [
      'Gallery-quality wall treatments',
      'Professional art lighting systems',
      'Sophisticated entertaining spaces',
      'Integrated smart home systems',
    ],
    timeline: [
      { phase: 'Art Display Planning', duration: '3 weeks' },
      { phase: 'Design Development', duration: '8 weeks' },
      { phase: 'Installation & Finishes', duration: '6 weeks' },
      { phase: 'Art Curation & Styling', duration: '2 weeks' },
    ],
    services: ['Interior Design', 'Furniture Sourcing', 'Installation'],
  },
  'hospitality-resort': {
    title: 'Hospitality Resort Interior',
    category: 'Hospitality',
    location: 'Kampala, Uganda',
    year: '2023',
    description: 'Interior design for a 40-room luxury resort emphasizing comfort, local culture, and sustainability.',
    challenge: 'Creating a cohesive luxury brand experience across 40 individual rooms while incorporating local artistry.',
    solution: 'We developed a design language celebrating local craftsmanship, sustainable materials, and consistent luxury standards.',
    highlights: [
      'Locally-sourced materials',
      'Local artist collaborations',
      'Sustainable luxury practices',
      'Consistent brand experience',
    ],
    timeline: [
      { phase: 'Brand & Concept', duration: '4 weeks' },
      { phase: 'Design Development', duration: '10 weeks' },
      { phase: 'Sourcing & Procurement', duration: '12 weeks' },
      { phase: 'Installation & Launch', duration: '8 weeks' },
    ],
    services: ['Interior Design', 'Sourcing', 'Installation', 'Project Management'],
  },
  'boutique-hotel': {
    title: 'Boutique Hotel Concept',
    category: 'Hospitality',
    location: 'Kigali, Rwanda',
    year: '2022',
    description: 'Concept and design development for a 25-room boutique hotel emphasizing local culture and contemporary design.',
    challenge: 'Creating authentic local atmosphere without cultural appropriation while maintaining international hospitality standards.',
    solution: 'We collaborated with local artisans, artists, and cultural consultants to authentically integrate Rwandan design.',
    highlights: [
      'Authentic cultural integration',
      'Artisan partnerships',
      'Contemporary local design',
      'Hospitality excellence',
    ],
    timeline: [
      { phase: 'Cultural Research', duration: '3 weeks' },
      { phase: 'Concept Development', duration: '6 weeks' },
      { phase: 'Design & Planning', duration: '8 weeks' },
      { phase: 'Implementation Support', duration: 'Ongoing' },
    ],
    services: ['Architecture', 'Interior Design', 'Cultural Consulting'],
  },
  'family-home': {
    title: 'Family Home Extension',
    category: 'Residential',
    location: 'Jinja, Uganda',
    year: '2022',
    description: 'Addition and interior redesign of a family home to accommodate growing family and working-from-home needs.',
    challenge: 'Extending the home without disrupting daily life while creating a cohesive design across old and new spaces.',
    solution: 'We designed a seamless addition with consistent aesthetics, created flexible multi-use spaces, and phased construction carefully.',
    highlights: [
      'Seamless addition integration',
      'Multi-functional spaces',
      'Enhanced natural light',
      'Family-focused design',
    ],
    timeline: [
      { phase: 'Planning & Permits', duration: '4 weeks' },
      { phase: 'Design Development', duration: '6 weeks' },
      { phase: 'Construction', duration: '14 weeks' },
      { phase: 'Interior Finishing', duration: '3 weeks' },
    ],
    services: ['Architecture', 'Interior Design', 'Project Management'],
  },
}

interface ProjectPageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  return Object.keys(projectDetails).map((slug) => ({
    slug,
  }))
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const project = projectDetails[params.slug]

  if (!project) {
    return {
      title: 'Project Not Found',
      description: 'This project could not be found',
    }
  }

  return {
    title: `${project.title} | The Revamp UG`,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      type: 'website',
      images: [
        {
          url: `https://therevampug.com/api/og?title=${encodeURIComponent(project.title)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.description,
    },
  }
}

export default function ProjectDetailPage({ params }: ProjectPageProps) {
  const project = projectDetails[params.slug]
  const [likes, setLikes] = useState(147)
  const [liked, setLiked] = useState(false)

  if (!project) {
    notFound()
  }

  const toggleLike = () => {
    setLiked(!liked)
    setLikes(liked ? likes - 1 : likes + 1)
  }

  const projectSchema = generateProjectSchema({
    name: project.title,
    description: project.description,
    image: `https://therevampug.com/api/og?title=${encodeURIComponent(project.title)}`,
    location: project.location,
    startDate: new Date(project.year).toISOString(),
  })

  return (
    <>
      <SchemaScript schema={projectSchema} />
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative">
          <div className="h-96 md:h-[600px] bg-gradient-to-br from-muted to-muted/50" />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-5xl px-6 md:px-8 pb-12 md:pb-16">
              <div className="space-y-4">
                <Link
                  href="/portfolio"
                  className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Portfolio
                </Link>
                <h1 className="font-serif text-5xl md:text-6xl font-light text-foreground">{project.title}</h1>
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground font-light">
                  <span>{project.category}</span>
                  <span>•</span>
                  <span>{project.location}</span>
                  <span>•</span>
                  <span>{project.year}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className="border-b border-border/20 py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h2 className="font-serif text-3xl font-light text-foreground">Project Overview</h2>
                <p className="text-lg text-muted-foreground font-light leading-relaxed">{project.description}</p>
              </div>
              <div className="space-y-8">
                <div>
                  <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-3">Challenge</p>
                  <p className="text-muted-foreground font-light">{project.challenge}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-3">Solution</p>
                  <p className="text-muted-foreground font-light">{project.solution}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="border-b border-border/20 py-16 md:py-20 bg-muted/5">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <h2 className="font-serif text-3xl font-light text-foreground mb-12">Project Highlights</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {project.highlights.map((highlight: string, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 pt-1">
                    <div className="flex items-center justify-center size-6 rounded-full bg-primary/10">
                      <span className="text-xs font-medium text-primary">✓</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground font-light">{highlight}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="border-b border-border/20 py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <h2 className="font-serif text-3xl font-light text-foreground mb-12">Project Timeline</h2>
            <div className="space-y-6">
              {project.timeline.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-6 pb-6 border-b border-border/20 last:border-0">
                  <div className="flex-shrink-0 w-24">
                    <p className="text-sm font-medium text-primary/70">{item.duration}</p>
                  </div>
                  <div>
                    <p className="font-light text-foreground">{item.phase}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="border-b border-border/20 py-16 md:py-20 bg-muted/5">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <h2 className="font-serif text-3xl font-light text-foreground mb-8">Services Provided</h2>
            <div className="flex flex-wrap gap-3">
              {project.services.map((service: string) => (
                <span
                  key={service}
                  className="px-4 py-2 rounded-full bg-primary/10 text-primary font-light text-sm"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Engagement */}
        <section className="py-12 border-b border-border/20">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="flex items-center gap-8">
              <button
                onClick={toggleLike}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/20 hover:border-primary/40 text-muted-foreground hover:text-primary transition-colors font-light"
              >
                <svg
                  className={`size-5 ${liked ? 'fill-current' : ''}`}
                  fill={liked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 21s-6.716-4.736-9.237-7.257A5.5 5.5 0 0 1 6 4.5 5.5 5.5 0 0 1 12 8.09 5.5 5.5 0 0 1 18 4.5a5.5 5.5 0 0 1 3.237 9.243C18.716 16.264 12 21 12 21z"
                  />
                </svg>
                <span>{likes} likes</span>
              </button>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-24">
          <div className="mx-auto max-w-3xl px-6 md:px-8 text-center space-y-8">
            <div className="space-y-4">
              <h2 className="font-serif text-4xl font-light text-foreground">
                Ready to transform your space?
              </h2>
              <p className="text-lg text-muted-foreground font-light">
                Let's discuss how we can bring your vision to life
              </p>
            </div>
            <Link
              href="/book-consultation"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-light transition-colors"
            >
              Book a Consultation
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
