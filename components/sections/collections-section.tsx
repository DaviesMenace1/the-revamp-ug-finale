import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getNewArrivals, isNewArrival, formatPrice } from '@/lib/data/products'

export function CollectionsSection() {
  const items = getNewArrivals(6)

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
            <p className="font-sans text-sm text-muted-foreground mt-3 max-w-md">
              The latest pieces to join our catalog | sourced, crafted, and ready to define your space.
            </p>
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
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/collections/${item.slug}`}
              className="group relative bg-background flex-none w-64 md:w-auto snap-start overflow-hidden"
            >
              {/* Image */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url('${item.images[0]}')` }}
                  role="img"
                  aria-label={item.name}
                />
                <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/40 transition-colors duration-500" />

                {/* New Arrivals tag — updates automatically as newer products are added */}
                {isNewArrival(item) && (
                  <span className="absolute top-3 left-3 bg-gold text-obsidian font-sans text-[10px] tracking-widest uppercase px-2.5 py-1">
                    New Arrivals
                  </span>
                )}
              </div>

              {/* Label */}
              <div className="p-4 border-t border-border">
                <h3 className="font-serif text-base font-light text-foreground group-hover:text-gold transition-colors leading-tight mb-1">
                  {item.name}
                </h3>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans text-[11px] text-muted-foreground tracking-wide uppercase">
                    {item.itemType}
                  </span>
                  <span className="font-sans text-xs text-foreground font-medium">
                    {formatPrice(item.price, item.currency)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
