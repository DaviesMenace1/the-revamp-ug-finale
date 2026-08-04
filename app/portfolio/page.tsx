{/*'use client'*/}

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import Link from 'next/link'
import { useState } from 'react'

const projects = [
  {
    id: 1,
    slug: 'skyline-apartment',
    title: 'Skyline Apartment',
    category: 'Residential',
    location: 'Kampala, Uganda',
    image: 'url('https://res.cloudinary.com/r8epy5mg/image/upload/v1785487071/L3D121S57ENDOVL2MOYUWLXMCLUFX7Y3AOY8_1600x1200_mhyep1.jpg')',
  },
  {
    id: 2,
    slug: 'corporate-office',
    title: 'Corporate Office Refurbishment',
    category: 'Commercial',
    location: 'Nairobi, Kenya',
    image: 'url('https://res.cloudinary.com/r8epy5mg/image/upload/v1785487053/IMG_3609_3_un8mzr.jpg')',
  },
  {
    id: 3,
    slug: 'villa-renovation',
    title: 'Lakeside Villa Renovation',
    category: 'Residential',
    location: 'Entebbe, Uganda',
    image: 'url('https://res.cloudinary.com/r8epy5mg/image/upload/v1785487078/L3D124S57ENDOVLZRRYUWLZS6LUFX7Y3WLA8_4000x3000_gb14hk.jpg')',
  },
  {
    id: 4,
    slug: 'retail-showroom',
    title: 'Luxury Retail Showroom',
    category: 'Commercial',
    location: 'Kampala, Uganda',
    image: 'url('https://res.cloudinary.com/r8epy5mg/image/upload/v1785575628/3c01978f6da28d6772001d9bad12cc_j6e7tf.jpg')',
  },
  {
    id: 5,
    slug: 'penthouse-suite',
    title: 'Penthouse Suite Design',
    category: 'Residential',
    location: 'Dar es Salaam, Tanzania',
    image: 'url('https://res.cloudinary.com/r8epy5mg/image/upload/v1785487082/L3D124S57ENDOVMJO2QUWLXMCLUFX73OMKQ8_4000x3000_tpuyal.jpg')',
  },
  {
    id: 6,
    slug: 'hospitality-resort',
    title: 'Hospitality Resort Interior',
    category: 'Hospitality',
    location: 'Kampala, Uganda',
    image: 'url('https://res.cloudinary.com/r8epy5mg/image/upload/v1785487083/L3D552S148ENDOVNXUSIUWIOKALUFX73VHJQ8_1024x576_wfxusq.jpg')',
  },
  {
    id: 7,
    slug: 'boutique-hotel',
    title: 'Boutique Hotel Concept',
    category: 'Hospitality',
    location: 'Kigali, Rwanda',
    image: 'url('https://res.cloudinary.com/r8epy5mg/image/upload/v1785487084/L3D552S148ENDOVNXUXIUWLQRWLUFX73V6EA8_1024x576_z8fqi0.jpg')',
  },
  {
    id: 8,
    slug: 'family-home',
    title: 'Family Home Extension',
    category: 'Residential',
    location: 'Jinja, Uganda',
    image: 'url('https://res.cloudinary.com/r8epy5mg/image/upload/v1785487085/L3D733S57ENDOVMJQ5QUWIF6ILUFX73BZXQ8_cpiqvz.jpg')',
  },
]

const categories = ['All', 'Residential', 'Commercial', 'Hospitality']

export default function PortfolioPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredProjects = selectedCategory === 'All'
    ? projects
    : projects.filter(p => p.category === selectedCategory)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border/20 bg-gradient-to-br from-background via-background to-muted/20 py-24 md:py-32">
          <div className="mx-auto max-w-5xl px-6 md:px-8 space-y-6">
            <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground">
              Portfolio
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground font-light">
              120+ completed projects showcasing our expertise in residential, commercial, and hospitality design
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b border-border/20 py-8">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="flex flex-wrap gap-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full font-light text-sm transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Grid */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="grid gap-8 md:grid-cols-2">
              {filteredProjects.map(project => (
                <Link
                  key={project.id}
                  href={`/portfolio/${project.slug}`}
                  className="group h-full"
                >
                  <article className="space-y-4 cursor-pointer h-full flex flex-col rounded-lg overflow-hidden border border-border/20 hover:border-primary/20 transition-colors">
                    {/* Image */}
                    <div className={`relative w-full h-80 ${project.image} overflow-hidden group-hover:opacity-80 transition-opacity`} />

                    {/* Content */}
                    <div className="flex-grow p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="uppercase font-medium text-primary/80 text-xs tracking-wider">
                          {project.category}
                        </span>
                        <span className="text-muted-foreground font-light text-sm">
                          {project.location}
                        </span>
                      </div>

                      <h2 className="font-serif text-2xl font-light text-foreground group-hover:text-primary transition-colors">
                        {project.title}
                      </h2>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6">
                      <span className="inline-flex items-center gap-2 text-primary/70 group-hover:text-primary transition-colors font-light text-sm">
                        View Project
                        <svg className="size-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-light">
                  No projects in this category yet
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="border-t border-border/20 py-20 md:py-24 bg-muted/5">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div className="space-y-2">
                <p className="font-serif text-5xl font-light text-primary">120+</p>
                <p className="text-muted-foreground font-light">Projects Completed</p>
              </div>
              <div className="space-y-2">
                <p className="font-serif text-5xl font-light text-primary">14</p>
                <p className="text-muted-foreground font-light">Years of Experience</p>
              </div>
              <div className="space-y-2">
                <p className="font-serif text-5xl font-light text-primary">98%</p>
                <p className="text-muted-foreground font-light">Client Satisfaction</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
