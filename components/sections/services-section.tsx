import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const services = [
  {
    number: '01',
    title: 'Interior Design',
    description:
      'Full-service residential and commercial interior design — from concept boards and spatial planning to material selection and final installation.',
    tags: ['Residential', 'Commercial', 'Hospitality'],
    href: '/services/interior-design',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80&auto=format&fit=crop',
  },
  {
    number: '02',
    title: 'Architecture',
    description:
      'Award-winning architectural design that harmonises form, function, and environment. We craft buildings that endure and inspire.',
    tags: ['New Build', 'Renovation', 'Masterplanning'],
    href: '/architecture',
    image: 'https://images.unsplash.com/photo-1545569262-a5f9d0d83b93?w=800&q=80&auto=format&fit=crop',
  },
  {
    number: '03',
    title: 'Global Sourcing',
    description:
      'Access to the world\'s finest furniture, art, and décor. We source from over 15 countries, securing exclusive pieces unavailable elsewhere.',
    tags: ['Furniture', 'Lighting', 'Art & Objects'],
    href: '/services/sourcing',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80&auto=format&fit=crop',
  },
  {
    number: '04',
    title: 'White-Glove Installation',
    description:
      'Seamless project delivery from logistics coordination to precision installation. Your vision, realised without compromise.',
    tags: ['Logistics', 'Installation', 'Handover'],
    href: '/services/installation',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&auto=format&fit=crop',
  },
]

export function ServicesSection() {
  return (
    <section className="section-pad bg-background">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="gold-line" />
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground leading-tight">
              What We Do
            </h2>
          </div>
          <p className="font-sans text-muted-foreground text-sm leading-relaxed max-w-sm md:text-right">
            A comprehensive suite of luxury design services — architecture, interiors, global sourcing, and meticulous installation.
          </p>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          {services.map((service) => (
            <Link
              key={service.number}
              href={service.href}
              className="group relative bg-background overflow-hidden block"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${service.image}')` }}
                  role="img"
                  aria-label={service.title}
                />
                <div className="absolute inset-0 bg-foreground/40 group-hover:bg-foreground/20 transition-colors duration-500" />
                {/* Number */}
                <div className="absolute top-4 left-6 font-serif text-5xl font-light text-white/20 leading-none">
                  {service.number}
                </div>
                {/* Arrow */}
                <div className="absolute top-4 right-6 w-8 h-8 rounded-full border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:border-gold">
                  <ArrowUpRight size={14} className="text-white group-hover:text-gold" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 border-t border-border">
                <h3 className="font-serif text-2xl font-light text-foreground mb-2 group-hover:text-gold transition-colors">
                  {service.title}
                </h3>
                <p className="font-sans text-muted-foreground text-sm leading-relaxed mb-4">
                  {service.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {service.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-sans text-[10px] tracking-widest uppercase text-muted-foreground border border-border px-2.5 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
