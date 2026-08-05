'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { cn } from '@/lib/utils'
import { ReactNode, useState } from 'react'

const questionCategories = [
  { category: 'All' },
  { category: 'General' },
  { category: 'Interior Design' },
  { category: 'Architecture' },
  { category: 'Global Sourcing' },
  { category: 'Products & Collections' },
  { category: 'Orders & Payments' },
  { category: 'Shipping & Installation' },
  { category: 'Trade Program' },
  { category: 'Membership & Loyalty' },
  { category: 'Returns & Warranties' },
  { category: 'Contact & Support' },
  { category: 'Consulting' },
]

const defaultFaqs = [
  {
    q: 'What is The Revamp UG?',
    a: 'The Revamp UG is a luxury interior design and architecture studio specializing in thoughtfully designed spaces, globally sourced furnishings, bespoke solutions, and white-glove project delivery. We create timeless residential, commercial, hospitality, and lifestyle environments tailored to every client\'s vision.',
    category: 'General',
  },
  {
    q: 'What is the process for starting a design project with Revamp UG?',
    a: 'The process begins with an initial consultation to understand your needs, followed by a proposal and design plan.',
    category: 'General',
  },
  {
    q: 'How does The Revamp UG source its products and materials?',
    a: 'We have a global network of suppliers and artisans, ensuring high-quality and unique materials for our projects.',
    category: 'Global Sourcing',
  },
  {
    q: 'What are the real goals of a good project?',
    a: 'A strong, secure and functional structure.',
    category: 'Architecture',
  },
]

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/80">
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function Faqs() {
  const [category, setCategory] = useState<string>('All')
  const filteredFaqs = category === 'All' ? defaultFaqs : defaultFaqs.filter((item) => item.category === category)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="border-b border-border/10 bg-gradient-to-br from-background via-background to-muted/20 py-20 md:py-26">
          <div className="mx-auto max-w-5xl px-6 md:px-8 space-y-4">
            <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground">
              Frequently Asked Questions
            </h1>
            <p className="max-w-2xl text-xl text-muted-foreground font-light">
              Find answers to common questions about our design, development, and consulting services.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 md:px-8 py-12 lg:py-16">
          <FilterGroup title="Filters">
            <div className="flex flex-wrap gap-3">
              {questionCategories.map((f) => (
                <button
                  key={f.category}
                  type="button"
                  onClick={() => setCategory(f.category)}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-sm font-sans transition-colors px-3 py-1.5 rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    category === f.category ? 'bg-gold/10 text-gold border-gold/30'
                      : 'bg-transparent text-foreground/70 hover:text-foreground hover:bg-muted/5 border-transparent',
                  )}
                >
                  {f.category}
                </button>
              ))}
            </div>
          </FilterGroup>

          <section className="py-6 md:py-8 border-b border-border/20 bg-muted/5 rounded-2xl">
            <div className="mx-auto max-w-5xl px-4 md:px-6">
              <div className="grid md:grid-cols-2 gap-12">
                {filteredFaqs.map((member) => (
                  <div
                    key={member.q}
                    className="space-y-4 p-6 rounded-lg border border-border/20 hover:border-primary/20 transition-colors"
                  >
                    <p className="text-primary/90 font-medium text-sm">{member.q}</p>
                    <p className="text-muted-foreground font-light leading-relaxed">{member.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
