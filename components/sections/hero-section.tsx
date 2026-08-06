'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Slide {
  id: number
  type: 'image' | 'video'
  src: string
  poster?: string
  eyebrow: string
  titleLine1: string
  titleLine2: string
  description: string
  primaryCta: { label: string; href: string }
  secondaryCta: { label: string; href: string; isVideoModal?: boolean }
}

const slides: Slide[] = [
  {
    id: 1,
    type: 'image',
    src: 'https://res.cloudinary.com/r8epy5mg/image/upload/L3D733S57ENDOVMJQ5QUWIF6ILUFX73BZXQ8_cpiqvz.jpg',
    eyebrow: 'Est. Uganda',
    titleLine1: 'The Architecture',
    titleLine2: 'of Refined Living',
    description:
      'Bespoke interior design, architecture, and global sourcing, crafted for clients who demand the extraordinary.',
    primaryCta: { label: 'Book a Consultation', href: '/contact' },
    secondaryCta: { label: 'View Our Work', href: '/portfolio' },
  },
  {
    id: 2,
    type: 'video',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', // Replace with your video URL
    poster: 'https://res.cloudinary.com/r8epy5mg/image/upload/L3D733S57ENDOVMJQ5QUWIF6ILUFX73BZXQ8_cpiqvz.jpg',
    eyebrow: 'Curated Spaces',
    titleLine1: 'Craftsmanship &',
    titleLine2: 'Timeless Elegance',
    description:
      'From custom furniture manufacturing to 3D visualization, we turn ambitious concepts into living realities.',
    primaryCta: { label: 'Explore Services', href: '/services' },
    secondaryCta: { label: 'Our Signature Style', href: '/services/signature-services' },
  },
  {
    id: 3,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920&auto=format&fit=crop',
    eyebrow: 'Global Sourcing',
    titleLine1: 'Exclusive Collections',
    titleLine2: 'Sourced Worldwide',
    description:
      'Access rare materials, bespoke décor, and artisan manufacturing through our international trade program.',
    primaryCta: { label: 'Source With Us', href: '/source-with-revamp' },
    secondaryCta: { label: 'Join Trade Program', href: '/trade' },
  },
]

export function HeroSection() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  // Handle auto-advance
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 7000)

    return () => clearInterval(timer)
  }, [isPaused])

  // Play video on active slide, pause others
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === current) {
          video.currentTime = 0
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      }
    })
  }, [current])

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)

  return (
    <section 
      className="relative min-h-screen flex items-end overflow-hidden bg-obsidian pt-20 md:pt-24 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Media Carousel */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-1000 ease-in-out',
            index === current ? 'opacity-100 z-0' : 'opacity-0 -z-10'
          )}
        >
          {slide.type === 'image' ? (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 scale-105"
              style={{ backgroundImage: `url('${slide.src}')` }}
              role="img"
              aria-label={slide.titleLine1}
            />
          ) : (
            <video
              ref={(el) => { videoRefs.current[index] = el }}
              src={slide.src}
              poster={slide.poster}
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Layered dark gradients for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        </div>
      ))}

      {/* Manual Controls (Prev/Next Arrows) */}
      <div className="absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 hidden md:flex">
        <button
          onClick={prevSlide}
          className="p-3 border border-white/20 rounded-full text-white/70 hover:text-white hover:border-gold hover:bg-black/40 transition-all backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={nextSlide}
          className="p-3 border border-white/20 rounded-full text-white/70 hover:text-white hover:border-gold hover:bg-black/40 transition-all backdrop-blur-sm"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Hero Content Area */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-12 pb-20 md:pb-24 w-full">
        <div className="max-w-3xl">
          {/* Animated Slide Content */}
          {slides.map((slide, index) => {
            if (index !== current) return null
            return (
              <div key={slide.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Eyebrow */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-px bg-gold" />
                  <span className="font-sans text-xs tracking-[0.3em] uppercase text-gold">
                    {slide.eyebrow}
                  </span>
                </div>

                {/* Dynamic Headline */}
                <h1 className="font-serif font-light text-white leading-[1.05] mb-8">
                  <span className="block text-5xl md:text-7xl lg:text-8xl">{slide.titleLine1}</span>
                  <span className="block text-5xl md:text-7xl lg:text-8xl italic text-gold-gradient mt-1">
                    {slide.titleLine2}
                  </span>
                </h1>

                {/* Dynamic Sub-copy */}
                <p className="font-sans text-white/70 text-base md:text-lg leading-relaxed max-w-xl mb-10">
                  {slide.description}
                </p>

                {/* Dynamic CTAs */}
                <div className="flex flex-wrap items-center gap-4">
                  <Link href={slide.primaryCta.href}>
                    <Button
                      size="lg"
                      className="rounded-none bg-gold text-obsidian hover:bg-gold-light font-sans text-xs tracking-widest uppercase px-8 py-6 group"
                    >
                      {slide.primaryCta.label}
                      <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>

                  <Link href={slide.secondaryCta.href}>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="rounded-none border border-white/30 text-white hover:border-gold hover:text-gold font-sans text-xs tracking-widest uppercase px-8 py-6 group"
                    >
                      {slide.type === 'video' && <Play size={12} className="mr-2 fill-current" />}
                      {slide.secondaryCta.label}
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}

          {/* Carousel Slide Indicators */}
          <div className="flex items-center gap-3 mt-12">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={cn(
                  'h-1 transition-all duration-300 rounded-full',
                  index === current ? 'w-10 bg-gold' : 'w-4 bg-white/30 hover:bg-white/60'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4 mt-12 pt-8 border-t border-white/10">
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




{/*'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden bg-obsidian pt-20 md:pt-24">
      {/* Background image with overlay *
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/r8epy5mg/image/upload/L3D733S57ENDOVMJQ5QUWIF6ILUFX73BZXQ8_cpiqvz.jpg')`,
          }}
          role="img"
          aria-label="Luxury interior design space"
        />
        {/* Layered dark gradient — bottom-heavy for text legibility *
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      {/* Decorative gold line top-left 
      <div className="absolute top-28 md:top-36 left-6 lg:left-12 flex items-center gap-3 z-10">
        <div className="w-10 h-px bg-gold opacity-60" />
        <span className="font-sans text-xs tracking-[0.25em] uppercase text-white/50">Est. Uganda</span>
      </div>*/}

      {/* Scroll indicator *
      <div className="absolute right-6 lg:right-12 bottom-1/3 z-10 flex flex-col items-center gap-2">
        <div className="w-px h-16 bg-white/20" />
        <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-white/40 rotate-90 mt-2">Scroll</span>
      </div>

      {/* Hero content *
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-12 pb-20 md:pb-28 w-full">
        <div className="max-w-3xl">
          {/* Eyebrow *
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-gold" />
            <span className="font-sans text-xs tracking-[0.3em] uppercase text-gold">
              Est. Uganda
            </span>
          </div>

          {/* Headline *
          <h1 className="font-serif font-light text-white leading-[1.05] mb-8">
            <span className="block text-5xl md:text-7xl lg:text-8xl">The Architecture</span>
            <span className="block text-5xl md:text-7xl lg:text-8xl italic text-gold-gradient mt-1">
              of Refined Living
            </span>
          </h1>

          {/* Sub-copy *
          <p className="font-sans text-white/60 text-base md:text-lg leading-relaxed max-w-xl mb-10">
            Bespoke interior design, architecture, and global sourcing , crafted for
            clients who demand the extraordinary. From concept to white-glove installation.
          </p>

          {/* CTAs *
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

          {/* Stats row *
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
} */}
