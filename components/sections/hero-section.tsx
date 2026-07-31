'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden bg-obsidian pt-20 md:pt-24">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/r8epy5mg/image/upload/L3D733S57ENDOVMJQ5QUWIF6ILUFX73BZXQ8_cpiqvz.jpg')`,
          }}
          role="img"
          aria-label="Luxury interior design space"
        />
        {/* Layered dark gradient — bottom-heavy for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      {/* Decorative gold line top-left 
      <div className="absolute top-28 md:top-36 left-6 lg:left-12 flex items-center gap-3 z-10">
        <div className="w-10 h-px bg-gold opacity-60" />
        <span className="font-sans text-xs tracking-[0.25em] uppercase text-white/50">Est. Uganda</span>
      </div>*/}

      {/* Scroll indicator */}
      <div className="absolute right-6 lg:right-12 bottom-1/3 z-10 flex flex-col items-center gap-2">
        <div className="w-px h-16 bg-white/20" />
        <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-white/40 rotate-90 mt-2">Scroll</span>
      </div>

      {/* Hero content */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-12 pb-20 md:pb-28 w-full">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-gold" />
            <span className="font-sans text-xs tracking-[0.3em] uppercase text-gold">
              Est. Uganda
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-serif font-light text-white leading-[1.05] mb-8">
            <span className="block text-5xl md:text-7xl lg:text-8xl">Spaces That</span>
            <span className="block text-5xl md:text-7xl lg:text-8xl italic text-gold-gradient mt-1">
              Tell Your Story
            </span>
          </h1>

          {/* Sub-copy */}
          <p className="font-sans text-white/60 text-base md:text-lg leading-relaxed max-w-xl mb-10">
            Bespoke interior design, architecture, and global sourcing , crafted for
            clients who demand the extraordinary. From concept to white-glove installation.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/contact">
              <Button
                size="lg"
                className="rounded-none bg-gold text-obsidian hover:bg-gold-light font-sans text-xs tracking-widest uppercase px-8 py-6 group"
              >
                Book a Consultation
                <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button
                variant="ghost"
                size="lg"
                className="rounded-none border border-white/30 text-white hover:border-gold hover:text-gold font-sans text-xs tracking-widest uppercase px-8 py-6 group"
              >
                <Play size={12} className="mr-2" />
                View Our Work
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4 mt-16 pt-10 border-t border-white/10">
            {[
              { value: '200+', label: 'Projects Completed' },
              { value: '12+', label: 'Years of Excellence' },
              { value: '15+', label: 'Countries Sourced' },
              { value: '98%', label: 'Client Satisfaction' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-serif text-3xl font-light text-white">{stat.value}</div>
                <div className="font-sans text-xs tracking-wide uppercase text-white/40 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
