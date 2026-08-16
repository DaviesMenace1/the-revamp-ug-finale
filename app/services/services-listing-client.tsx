'use client'

import { useState, useMemo } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Search, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEFAULT_FALLBACK_IMAGE = 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487078/L3D124S57ENDOVLZRRYUWLZS6LUFX7Y3WLA8_4000x3000_gb14hk.jpg'

type ServiceItem = {
  slug: string
  name: string
  description: string | null
  image: string | null
}

type ServiceCategory = {
  id: string
  slug: string
  name: string
  description: string | null
  services: ServiceItem[]
}

export default function ServicesListingClient({ categories }: { categories: ServiceCategory[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredCategories = useMemo(() => {
    return categories
      .map((category) => {
        if (selectedCategory !== 'all' && category.id !== selectedCategory) {
          return null
        }

        const matchingServices = category.services.filter((service) => {
          const query = searchQuery.toLowerCase().trim()
          if (!query) return true

          return (
            service.name.toLowerCase().includes(query) ||
            (service.description ?? '').toLowerCase().includes(query) ||
            category.name.toLowerCase().includes(query)
          )
        })

        if (matchingServices.length === 0) return null

        return {
          ...category,
          services: matchingServices,
        }
      })
      .filter(Boolean) as ServiceCategory[]
  }, [categories, searchQuery, selectedCategory])

  const totalResultsCount = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + (cat?.services.length || 0), 0)
  }, [filteredCategories])

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="border-b border-border/20 py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="space-y-4">
              <h1 className="font-serif text-4xl md:text-6xl font-light text-foreground leading-tight">
                Our Services
              </h1>
              <p className="max-w-2xl text-base md:text-lg text-muted-foreground font-light leading-relaxed">
                From concept to completion, we offer a comprehensive range of luxury design and procurement services
                tailored to your unique vision.
              </p>
            </div>
          </div>
        </section>

        <section className="sticky top-16 md:top-20 z-30 bg-background/95 backdrop-blur-md border-b border-border/40 py-4 shadow-sm">
          <div className="mx-auto max-w-7xl px-6 md:px-8 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-full pl-10 pr-10 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">
                <SlidersHorizontal size={14} />
                <span>
                  Showing <strong className="text-foreground">{totalResultsCount}</strong> services
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs tracking-wider uppercase font-medium whitespace-nowrap transition-all duration-200 border',
                  selectedCategory === 'all'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background border-border text-foreground/70 hover:border-gold hover:text-gold'
                )}
              >
                All Categories ({categories.reduce((acc, cat) => acc + cat.services.length, 0)})
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs tracking-wider uppercase font-medium whitespace-nowrap transition-all duration-200 border',
                    selectedCategory === category.id
                      ? 'bg-gold text-white border-gold'
                      : 'bg-background border-border text-foreground/70 hover:border-gold hover:text-gold'
                  )}
                >
                  {category.name} ({category.services.length})
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            {filteredCategories.length > 0 ? (
              <div className="space-y-16">
                {filteredCategories.map((category) => (
                  <div key={category!.id} className="space-y-6">
                    <div className="border-b border-border/40 pb-4">
                      <h2 className="font-serif text-2xl md:text-3xl font-light text-foreground">
                        {category!.name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                        {category!.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {category!.services.map((service) => {
                        const imageUrl = service.image || DEFAULT_FALLBACK_IMAGE

                        return (
                          <Link
                            key={service.slug}
                            href={`/services/${category!.slug}/${service.slug}`}
                            className="group flex flex-col h-full bg-background border border-border/40 rounded-xl overflow-hidden hover:border-gold/60 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                              <img
                                src={imageUrl}
                                alt={service.name}
                                onError={(e) => {
                                  e.currentTarget.src = DEFAULT_FALLBACK_IMAGE
                                }}
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>

                            <div className="flex flex-col justify-between flex-1 p-6">
                              <div>
                                <h3 className="font-medium text-foreground group-hover:text-gold transition-colors text-base">
                                  {service.name}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                                  {service.description}
                                </p>
                              </div>

                              <div className="mt-6 pt-4 flex items-center justify-between border-t border-border/20 text-xs font-medium text-gold uppercase tracking-wider">
                                <span>Explore Service</span>
                                <ArrowRight
                                  size={14}
                                  className="group-hover:translate-x-1 transition-transform duration-200"
                                />
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-border rounded-xl space-y-4 max-w-md mx-auto">
                <p className="text-lg font-serif text-foreground">No matching services found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search keyword or switching category tabs.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                  }}
                  variant="outline"
                  className="rounded-full text-xs uppercase tracking-wider"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-border/20 bg-foreground text-background py-20 md:py-24">
          <div className="mx-auto max-w-3xl px-6 md:px-8 text-center space-y-8">
            <div className="space-y-4">
              <h2 className="font-serif text-4xl md:text-5xl font-light">
                Ready to transform your space?
              </h2>
              <p className="text-lg opacity-90">
                Book a consultation with our team to discuss your project and discover how we can bring your vision to life.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-gold text-foreground hover:bg-gold/90 rounded-full font-medium text-base px-8 py-3"
            >
              <Link href="/contact">Schedule a Consultation</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
