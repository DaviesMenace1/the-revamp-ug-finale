'use client'

import { useState, useMemo } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { SERVICES } from '@/lib/data/services'
import { ArrowRight, Search, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Filter categories and nested services based on category tab & search keyword
  const filteredCategories = useMemo(() => {
    return SERVICES.map((category) => {
      // If a specific category tab is selected, filter out others
      if (selectedCategory !== 'all' && category.id !== selectedCategory) {
        return null
      }

      // Filter sub-services by search query (matches service name or description)
      const matchingServices = category.services.filter((service) => {
        const query = searchQuery.toLowerCase().trim()
        if (!query) return true

        return (
          service.name.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query) ||
          category.name.toLowerCase().includes(query)
        )
      })

      if (matchingServices.length === 0) return null

      return {
        ...category,
        services: matchingServices,
      }
    }).filter(Boolean)
  }, [searchQuery, selectedCategory])

  // Count total matching services across all active categories
  const totalResultsCount = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + (cat?.services.length || 0), 0)
  }, [filteredCategories])

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Hero */}
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

        {/* Filters & Search Control Bar */}
        <section className="sticky top-16 md:top-20 z-30 bg-background/95 backdrop-blur-md border-b border-border/40 py-4 shadow-sm">
          <div className="mx-auto max-w-7xl px-6 md:px-8 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Search Bar Input */}
              <div className="relative flex-1 max-w-md">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search 70+ services (e.g. 3D, Interior, Sourcing)..."
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

              {/* Results Indicator */}
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-medium">
                <SlidersHorizontal size={14} />
                <span>
                  Showing <strong className="text-foreground">{totalResultsCount}</strong> services
                </span>
              </div>
            </div>

            {/* Category Filter Chips / Pills */}
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
                All Categories ({SERVICES.reduce((acc, cat) => acc + cat.services.length, 0)})
              </button>

              {SERVICES.map((category) => (
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

        {/* Services Results List */}
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

                    {/* Services Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category!.services.map((service) => (
                        <Link
                          key={service.slug}
                          href={`/services/${category!.slug}/${service.slug}`}
                          className="group block h-full"
                        >
                          <div className="h-full p-6 border border-border/40 bg-background rounded-lg hover:border-gold/60 hover:bg-gold/5 transition-all duration-300 flex flex-col justify-between">
                            <div>
                              <h3 className="font-medium text-foreground group-hover:text-gold transition-colors text-base">
                                {service.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                                {service.description}
                              </p>
                            </div>
                            <div className="mt-4 pt-3 flex items-center justify-between border-t border-border/20 text-xs font-medium text-gold uppercase tracking-wider">
                              <span>View Service</span>
                              <ArrowRight
                                size={14}
                                className="group-hover:translate-x-1 transition-transform duration-200"
                              />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty Search State */
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

        {/* CTA */}
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




{/*'use client'

import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { SERVICES } from '@/lib/data/services'
import { ChevronRight, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ServicesPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(SERVICES[0]?.id || null)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Hero *
        <section className="border-b border-border/20 py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="space-y-6">
              <h1 className="font-serif text-5xl md:text-6xl font-light text-foreground leading-tight">
                Our Services
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground font-light">
                From concept to completion, we offer a comprehensive range of luxury design and procurement services 
                tailored to your unique vision and requirements. Choose from 11 service categories and 70+ specialized services.
              </p>
            </div>
          </div>
        </section>

        {/* Services Grid *
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Categories Sidebar *
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">
                  Service Categories
                </p>
                {SERVICES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() =>
                      setExpandedCategory(expandedCategory === category.id ? null : category.id)
                    }
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-lg transition-all duration-200',
                      expandedCategory === category.id
                        ? 'bg-gold/10 border border-gold/20'
                        : 'hover:bg-background/50 border border-transparent'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className={cn(
                        'font-medium text-sm transition-colors',
                        expandedCategory === category.id ? 'text-gold' : 'text-foreground'
                      )}>
                        {category.name}
                      </h3>
                      <ChevronRight
                        size={16}
                        className={cn(
                          'transition-transform',
                          expandedCategory === category.id ? 'rotate-90 text-gold' : 'text-muted-foreground'
                        )}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.services.length} services
                    </p>
                  </button>
                ))}
              </div>

              {/* Services Content *
              <div className="lg:col-span-3">
                {SERVICES.map((category) => (
                  expandedCategory === category.id && (
                    <div key={category.id} className="space-y-8">
                      <div>
                        <h2 className="font-serif text-4xl font-light text-foreground mb-3">
                          {category.name}
                        </h2>
                        <p className="text-foreground/70 max-w-2xl">
                          {category.description}
                        </p>
                      </div>

                      {/* Services Grid *
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.services.map((service) => (
                          <Link
                            key={service.slug}
                            href={`/services/${category.slug}/${service.slug}`}
                            className="group block"
                          >
                            <div className="h-full p-6 border border-border/30 rounded-lg hover:border-gold/50 hover:bg-gold/5 transition-all duration-300">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-medium text-foreground group-hover:text-gold transition-colors">
                                    {service.name}
                                  </h3>
                                  <p className="text-sm text-foreground/60 mt-2 group-hover:text-foreground/70 transition-colors">
                                    {service.description}
                                  </p>
                                </div>
                                <ArrowRight
                                  size={16}
                                  className="text-muted-foreground group-hover:text-gold transition-all duration-300 ml-3 flex-shrink-0 group-hover:translate-x-1"
                                />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA *
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
              className="bg-gold text-foreground hover:bg-gold/90 rounded font-medium text-base px-8 py-3"
            >
              <Link href="/book-consultation">Schedule a Consultation</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}*/}
