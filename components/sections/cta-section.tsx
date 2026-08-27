import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { siteContact } from '@/lib/site-config'

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-foreground">
      {/* Background image */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://res.cloudinary.com/r8epy5mg/image/upload/v1785487043/f0779d7a1f24b500f151ff2301e8e9_dqpccd.jpg')",
          }}
          role="img"
          aria-label="Luxury interior design"
        />
        <div className="absolute inset-0 bg-foreground/85" />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-12 py-28 md:py-40">
        <div className="max-w-3xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-8 h-px bg-gold" />
            <span className="font-sans text-xs tracking-[0.3em] uppercase text-gold">
              Begin Your Journey
            </span>
            <div className="w-8 h-px bg-gold" />
          </div>

          {/* Headline */}
          <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-background leading-[1.05] mb-6">
            Your Dream Space<br />
            <span className="italic text-gold">Awaits</span>
          </h2>

          {/* Sub-copy */}
          <p className="font-sans text-background/60 text-base md:text-lg leading-relaxed mb-12 max-w-xl mx-auto">
            Every extraordinary space begins with a single conversation. Let us understand your vision and show you what is possible.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={siteContact.bookingPath}>
              <Button
                size="lg"
                className="rounded-none bg-gold text-obsidian hover:bg-gold-light font-sans text-xs tracking-widest uppercase px-10 py-6 group min-w-[220px]"
              >
                Book a Consultation
                <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href={siteContact.phoneHref}>
              <Button
                variant="ghost"
                size="lg"
                className="rounded-none border border-background/30 text-background hover:border-gold hover:text-gold font-sans text-xs tracking-widest uppercase px-10 py-6 group min-w-[220px]"
              >
                <Phone size={14} className="mr-2" />
                Call Us Now
              </Button>
            </a>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mt-16 pt-12 border-t border-background/10">
            {[
              'Bespoke Design',
              'Global Sourcing',
              'Thoughtful Sourcing',
              'Considered Delivery',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-gold" />
                <span className="font-sans text-xs tracking-wide uppercase text-background/50">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
