import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const projects = [
  {
    id: 1,
    slug: 'nakasero-residence',
    title: 'The Nakasero Residence',
    category: 'Residential Interior',
    location: 'Kampala, Uganda',
    year: '2024',
    image: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487038/8b1d75021b8a7a8e012e34efa8e029_xmuibg.jpg',
    size: 'large', // spans 2 cols
  },
  {
    id: 2,
    slug: 'kololo-villa-renovation',
    title: 'Kololo Villa Renovation',
    category: 'Architecture',
    location: 'Kololo, Uganda',
    year: '2024',
    image: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487079/L3D124S57ENDOVMH4UYUWIF6ILUFX73NOMA8_4000x3000_loxyzb.jpg',
    size: 'small',
  },
  {
    id: 3,
    slug: 'serena-penthouse-suite',
    title: 'Serena Penthouse Suite',
    category: 'Hospitality',
    location: 'Kampala, Uganda',
    year: '2023',
    image: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487083/L3D552S148ENDOVNXUSIUWIOKALUFX73VHJQ8_1024x576_wfxusq.jpg',
    size: 'small',
  },
  {
    id: 4,
    slug: 'muyenga-heritage-home',
    title: 'Muyenga Heritage Home',
    category: 'Residential Interior',
    location: 'Muyenga, Uganda',
    year: '2023',
    image: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487080/L3D124S57ENDOVMH53YUWLVIELUFX73NCSY8_4000x3000_wsv3cj.jpg',
    size: 'small',
  },
  {
    id: 5,
    slug: 'pearl-marina-corporate-hq',
    title: 'HC of Bosnia & Herzegovina',
    category: 'Commercial Design',
    location: 'Entebbe, Uganda',
    year: '2023',
    image: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785649986/Untitled-reception-20240830-171128_1_enmmlf.jpg',
    size: 'large',
  },
]

export function PortfolioSection() {
  const featured = projects.find((p) => p.size === 'large' && p.id === 1)!
  const small1 = projects.find((p) => p.id === 2)!
  const small2 = projects.find((p) => p.id === 3)!
  const small3 = projects.find((p) => p.id === 4)!
  const featured2 = projects.find((p) => p.size === 'large' && p.id === 5)!

  return (
    <section className="section-pad bg-canvas dark:bg-background">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="gold-line" />
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground leading-tight">
              Selected Work
            </h2>
          </div>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 font-sans text-xs tracking-widest uppercase text-gold hover-line group"
          >
            View All Projects
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {/* Large featured */}
          <ProjectCard project={featured} className="md:col-span-2 aspect-[16/9] md:aspect-auto md:min-h-[520px]" />

          {/* Small stack */}
          <div className="grid grid-rows-2 gap-px bg-border">
            <ProjectCard project={small1} className="min-h-[250px]" />
            <ProjectCard project={small2} className="min-h-[250px]" />
          </div>

          {/* Bottom row */}
          <ProjectCard project={small3} className="min-h-[340px]" />
          <ProjectCard project={featured2} className="md:col-span-2 min-h-[340px]" />
        </div>
      </div>
    </section>
  )
}

function ProjectCard({
  project,
  className = '',
}: {
  project: (typeof projects)[0]
  className?: string
}) {
  return (
    <Link
      href={`/portfolio/${project.slug}`}
      className={`group relative bg-background overflow-hidden block ${className}`}
    >
      {/* Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{ backgroundImage: `url('${project.image}')` }}
        role="img"
        aria-label={project.title}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <Badge
          variant="outline"
          className="font-sans text-[10px] tracking-widest uppercase border-white/30 text-white/70 mb-3 rounded-none"
        >
          {project.category}
        </Badge>
        <h3 className="font-serif text-xl md:text-2xl font-light text-white leading-tight mb-1">
          {project.title}
        </h3>
        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2">
          <span className="font-sans text-xs text-white/50">{project.location}</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="font-sans text-xs text-white/50">{project.year}</span>
        </div>
      </div>

      {/* Arrow */}
      <div className="absolute top-5 right-5 w-9 h-9 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:border-gold">
        <ArrowRight size={14} className="text-white group-hover:text-gold -rotate-45" />
      </div>
    </Link>
  )
}
