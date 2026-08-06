import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const articles = [
  {
    slug: 'the-art-of-layering-textures',
    category: 'Design Insights',
    title: 'The Art of Layering Textures in Luxury Interiors',
    excerpt:
      'How the interplay of linen, velvet, marble, and raw timber creates depth and warmth that defines truly exceptional spaces.',
    date: 'January 2025',
    readTime: '6 min read',
    image: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487078/L3D124S57ENDOVLZRRYUWLZS6LUFX7Y3WLA8_4000x3000_gb14hk.jpg',
    featured: true,
  },
  {
    slug: 'east-african-modernism',
    category: 'Architecture',
    title: 'East African Modernism: Designing for Climate & Culture',
    excerpt:
      'Our approach to architecture that responds intelligently to the equatorial climate while celebrating local heritage.',
    date: 'December 2024',
    readTime: '8 min read',
    image: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785649177/Untitled-hallway-20240830-180031_ubzqez.jpg',
    featured: false,
  },
  {
    slug: 'sourcing-guide-milan',
    category: 'Global Sourcing',
    title: 'Behind the Scenes: Sourcing at Milan Design Week 2024',
    excerpt:
      'Our buyers traveled to Salone del Mobile to discover the finest emerging studios and established ateliers.',
    date: 'November 2024',
    readTime: '5 min read',
    image: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487043/f0779d7a1f24b500f151ff2301e8e9_dqpccd.jpg',
    featured: false,
  },
]

export function JournalSection() {
  const [featured, ...rest] = articles

  return (
    <section className="section-pad bg-background">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="gold-line" />
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground leading-tight">
              The Journal
            </h2>
          </div>
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 font-sans text-xs tracking-widest uppercase text-gold hover-line group"
          >
            All Articles
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Grid: featured + 2 small */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border">
          {/* Featured */}
          <Link href={`/journal/${featured.slug}`} className="group relative bg-background overflow-hidden block lg:row-span-2">
            <div
              className="aspect-[16/10] lg:aspect-auto lg:h-full min-h-[400px] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url('${featured.image}')` }}
              role="img"
              aria-label={featured.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <Badge variant="outline" className="font-sans text-[10px] tracking-widest uppercase border-gold/50 text-gold mb-4 rounded-none">
                {featured.category}
              </Badge>
              <h3 className="font-serif text-2xl md:text-3xl font-light text-white leading-tight mb-3 group-hover:text-gold transition-colors">
                {featured.title}
              </h3>
              <p className="font-sans text-white/60 text-sm leading-relaxed mb-4 max-w-md">
                {featured.excerpt}
              </p>
              <div className="flex items-center gap-3 font-sans text-xs text-white/40">
                <span>{featured.date}</span>
                <span className="w-px h-3 bg-white/20" />
                <span>{featured.readTime}</span>
              </div>
            </div>
          </Link>

          {/* Two smaller articles */}
          <div className="flex flex-col gap-px bg-border">
            {rest.map((article) => (
              <Link
                key={article.slug}
                href={`/journal/${article.slug}`}
                className="group bg-background flex gap-6 p-6 hover:bg-muted/30 transition-colors"
              >
                <div
                  className="flex-none w-28 h-28 bg-cover bg-center"
                  style={{ backgroundImage: `url('${article.image}')` }}
                  role="img"
                  aria-label={article.title}
                />
                <div className="flex flex-col justify-center min-w-0">
                  <Badge variant="outline" className="font-sans text-[10px] tracking-widest uppercase border-border text-muted-foreground mb-2 rounded-none w-fit">
                    {article.category}
                  </Badge>
                  <h3 className="font-serif text-lg font-light text-foreground group-hover:text-gold transition-colors leading-snug mb-2">
                    {article.title}
                  </h3>
                  <p className="font-sans text-muted-foreground text-xs leading-relaxed line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-2 mt-3 font-sans text-xs text-muted-foreground/60">
                    <span>{article.date}</span>
                    <span className="w-px h-3 bg-border" />
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
