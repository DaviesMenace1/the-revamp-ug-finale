'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Play } from '@/components/ui/luxury-icons'
import { cn } from '@/lib/utils'

interface Slide {
  id: number
  src: string
  poster: string
  eyebrow: string
  titleLine1: string
  titleLine2: string
  description: string
  primaryCta: { label: string; href: string }
  secondaryCta: { label: string; href: string }
}

const FALLBACK_POSTER = 'https://res.cloudinary.com/r8epy5mg/image/upload/L3D733S57ENDOVMJQ5QUWIF6ILUFX73BZXQ8_cpiqvz.jpg'

const slides: Slide[] = [
  {
    id: 1,
    src: 'https://res.cloudinary.com/r8epy5mg/video/upload/v1785487037/85_ytqesd.mp4',
    poster: FALLBACK_POSTER,
    eyebrow: 'Est. Uganda',
    titleLine1: 'The Architecture',
    titleLine2: 'of Refined Living',
    description: 'Bespoke interior design, architecture, and global sourcing, crafted for clients who demand the extraordinary.',
    primaryCta: { label: 'Book a Consultation', href: '/book-consultation' },
    secondaryCta: { label: 'View Our Work', href: '/portfolio' },
  },
  {
    id: 2,
    src: 'https://res.cloudinary.com/r8epy5mg/video/upload/v1785487048/IMG_3268_kpqjhz.mov',
    poster: FALLBACK_POSTER,
    eyebrow: 'Curated Spaces',
    titleLine1: 'Craftsmanship &',
    titleLine2: 'Timeless Elegance',
    description: 'From custom furniture manufacturing to 3D visualization, we turn ambitious concepts into living realities.',
    primaryCta: { label: 'Explore Services', href: '/services' },
    secondaryCta: { label: 'Our Signature Style', href: '/services' },
  },
  {
    id: 3,
    src: 'https://res.cloudinary.com/r8epy5mg/video/upload/v1785487048/IMG_3268_kpqjhz.mov',
    poster: FALLBACK_POSTER,
    eyebrow: 'Global Sourcing',
    titleLine1: 'Exclusive Collections',
    titleLine2: 'Sourced Worldwide',
    description: 'Access rare materials, bespoke décor, and artisan manufacturing through our international trade program.',
    primaryCta: { label: 'Source With Us', href: '/source-with-revamp' },
    secondaryCta: { label: 'Join Trade Program', href: '/trade-program' },
  },
]

export function HeroSection() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setReduceMotion(mediaQuery.matches)
    updateMotionPreference()
    mediaQuery.addEventListener('change', updateMotionPreference)
    return () => mediaQuery.removeEventListener('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    if (isPaused || reduceMotion) return
    const timer = window.setInterval(() => {
      setCurrent((previous) => (previous + 1) % slides.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [isPaused, reduceMotion])

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return
      if (index === current && !reduceMotion) {
        video.currentTime = 0
        void video.play().catch(() => undefined)
      } else {
        video.pause()
      }
    })
  }, [current, reduceMotion])

  const previousSlide = () => setCurrent((previous) => (previous - 1 + slides.length) % slides.length)
  const nextSlide = () => setCurrent((previous) => (previous + 1) % slides.length)
  const slide = slides[current]

  return (
    <section
      className="relative flex min-h-dvh items-end overflow-hidden bg-obsidian pt-20 select-none"
      aria-roledescription="carousel"
      aria-label="The Revamp UG highlights"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false)
      }}
    >
      {slides.map((item, index) => (
        <div
          key={item.id}
          className={cn('absolute inset-0 transition-opacity duration-700 ease-out', index === current ? 'z-0 opacity-100' : 'pointer-events-none -z-10 opacity-0')}
          aria-hidden={index !== current}
        >
          <video
            ref={(element) => { videoRefs.current[index] = element }}
            src={item.src}
            poster={item.poster}
            muted
            playsInline
            preload={index === 0 ? 'metadata' : 'none'}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
        </div>
      ))}

      <div className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 md:right-8 md:flex">
        <button type="button" onClick={previousSlide} className="flex size-11 items-center justify-center rounded-full border border-white/25 text-white/80 backdrop-blur-sm transition-colors hover:border-gold hover:text-white" aria-label="Previous slide">
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button type="button" onClick={nextSlide} className="flex size-11 items-center justify-center rounded-full border border-white/25 text-white/80 backdrop-blur-sm transition-colors hover:border-gold hover:text-white" aria-label="Next slide">
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-16 sm:px-6 md:pb-24 lg:px-12">
        <div className="max-w-3xl" aria-live="polite">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-8 bg-gold" aria-hidden="true" />
            <span className="text-xs uppercase tracking-[0.3em] text-gold">{slide.eyebrow}</span>
          </div>

          <h1 className="mb-7 font-serif font-light leading-[1.02] text-white">
            <span className="block text-5xl md:text-7xl lg:text-8xl">{slide.titleLine1}</span>
            <span className="mt-1 block text-5xl font-serif text-gold-gradient md:text-7xl lg:text-8xl">{slide.titleLine2}</span>
          </h1>

          <p className="mb-9 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">{slide.description}</p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href={slide.primaryCta.href} className="inline-flex min-h-12 items-center justify-center bg-gold px-6 text-xs font-medium uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian">
              {slide.primaryCta.label}
              <ArrowRight size={14} className="ml-2" aria-hidden="true" />
            </Link>
            <Link href={slide.secondaryCta.href} className="inline-flex min-h-12 items-center justify-center border border-white/30 px-6 text-xs font-medium uppercase tracking-[0.16em] text-white transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian">
              <Play size={12} className="mr-2 fill-current" aria-hidden="true" />
              {slide.secondaryCta.label}
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-3" role="tablist" aria-label="Choose hero slide">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrent(index)}
                className={cn('flex min-h-11 items-center transition-all', index === current ? 'w-10' : 'w-6')}
                role="tab"
                aria-selected={index === current}
                aria-label={`Go to slide ${index + 1}`}
              >
                <span className={cn('h-1 w-full rounded-full transition-colors', index === current ? 'bg-gold' : 'bg-white/30 hover:bg-white/60')} />
              </button>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/15 pt-6">
            {['Interior Design', 'Architecture', 'Sourcing', 'Custom Work'].map((service) => (
              <div key={service} className="text-[10px] uppercase tracking-[0.16em] text-white/55">{service}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
