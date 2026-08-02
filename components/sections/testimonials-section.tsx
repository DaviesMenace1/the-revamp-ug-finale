'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const testimonials = [
  {
    quote:
      'The Revamp UG transformed our home into something beyond what we imagined. Their attention to detail, global taste, and white-glove delivery were impeccable.',
    author: 'Henry Mugenyi',
    title: 'Residential Client, Kampala',
    image: 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785647630/image_20260314_001645_yvfkdw.png',
  },
  {
    quote:
      'Working with The Revamp UG on our corporate offices was an experience of true luxury. Every space tells our brand story with extraordinary craft.',
    author: 'James Okiror',
    title: 'HC of Bosnia & Hezergonia',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop&crop=face',
  },
  {
    quote:
      'Their sourcing capabilities are world-class. They found pieces for our villa that we could not have discovered anywhere else. Absolutely unmatched.',
    author: 'Fatima Al-Rashid',
    title: 'Villa Owner, Munyonyo',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&auto=format&fit=crop&crop=face',
  },
]

export function TestimonialsSection() {
  const [active, setActive] = useState(0)

  const prev = () => setActive((i) => (i === 0 ? testimonials.length - 1 : i - 1))
  const next = () => setActive((i) => (i === testimonials.length - 1 ? 0 : i + 1))

  const t = testimonials[active]

  return (
    <section className="section-pad bg-canvas dark:bg-background overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: quote */}
          <div>
            <div className="gold-line" />
            <p className="font-serif text-3xl md:text-4xl font-light text-foreground leading-snug mb-10 italic">
              &ldquo;{t.quote}&rdquo;
            </p>
            {/* Author */}
            <div className="flex items-center gap-4 mb-10">
              <div
                className="size-14 rounded-full bg-cover bg-center flex-none"
                style={{ backgroundImage: `url('${t.image}')` }}
                role="img"
                aria-label={t.author}
              />
              <div>
                <div className="font-sans text-sm font-medium text-foreground">{t.author}</div>
                <div className="font-sans text-xs text-muted-foreground mt-0.5">{t.title}</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={prev}
                className="w-10 h-10 border border-border flex items-center justify-center text-muted-foreground hover:border-gold hover:text-gold transition-colors"
                aria-label="Previous testimonial"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={cn(
                      'h-px transition-all duration-300',
                      i === active ? 'w-8 bg-gold' : 'w-4 bg-border',
                    )}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="w-10 h-10 border border-border flex items-center justify-center text-muted-foreground hover:border-gold hover:text-gold transition-colors"
                aria-label="Next testimonial"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Right: visual */}
          <div className="relative hidden lg:block">
            <div
              className="aspect-[4/5] bg-cover bg-center"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1600210492493-0946911123ea?w=900&q=80&auto=format&fit=crop')",
              }}
              role="img"
              aria-label="Interior design showcase"
            />
            {/* Decorative element */}
            <div className="absolute -top-6 -left-6 w-32 h-32 border border-gold/20" />
            <div className="absolute -bottom-6 -right-6 w-32 h-32 border border-gold/20" />
          </div>
        </div>
      </div>
    </section>
  )
}
