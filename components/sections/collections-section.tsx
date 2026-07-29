import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const collections = [
  {
    title: 'Living Spaces',
    count: '48 pieces',
    href: '/collections/living',
    image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=700&q=80&auto=format&fit=crop',
  },
  {
    title: 'Dining & Entertaining',
    count: '32 pieces',
    href: '/collections/dining',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=700&q=80&auto=format&fit=crop',
  },
  {
    title: 'Bedroom Sanctuaries',
    count: '55 pieces',
    href: '/collections/bedroom',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=700&q=80&auto=format&fit=crop',
  },
  {
    title: 'Outdoor & Terraces',
    count: '29 pieces',
    href: '/collections/outdoor',
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=700&q=80&auto=format&fit=crop',
  },
  {
    title: 'Lighting Atelier',
    count: '41 pieces',
    href: '/collections/lighting',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80&auto=format&fit=crop',
  },
  {
    title: 'Art & Objects',
    count: '67 pieces',
    href: '/collections/art',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=700&q=80&auto=format&fit=crop',
  },
]

export function CollectionsSection() {
  return (
    <section className="section-pad bg-background">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="gold-line" />
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground leading-tight">
              Curated Collections
            </h2>
          </div>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 font-sans text-xs tracking-widest uppercase text-gold hover-line group"
          >
            Browse All
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-px overflow-x-auto snap-x snap-mandatory scrollbar-none md:grid md:grid-cols-3 lg:grid-cols-6 bg-border">
          {collections.map((col) => (
            <Link
              key={col.href}
              href={col.href}
              className="group relative bg-background flex-none w-64 md:w-auto snap-start overflow-hidden"
            >
              {/* Image */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url('${col.image}')` }}
                  role="img"
                  aria-label={col.title}
                />
                <div className="absolute inset-0 bg-foreground/30 group-hover:bg-foreground/50 transition-colors duration-500" />
              </div>

              {/* Label */}
              <div className="p-4 border-t border-border">
                <h3 className="font-serif text-base font-light text-foreground group-hover:text-gold transition-colors leading-tight mb-0.5">
                  {col.title}
                </h3>
                <span className="font-sans text-[11px] text-muted-foreground tracking-wide">
                  {col.count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
