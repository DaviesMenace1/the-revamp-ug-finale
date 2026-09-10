'use client'

import { useState, type ReactNode } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { cn } from '@/lib/utils'

const questionCategories = [
  'All',
  'General',
  'Interior Design',
  'Architecture',
  'Global Sourcing',
  'Products & Collections',
  'Orders & Payments',
  'Shipping & Installation',
  'Trade Program',
  'Membership & Loyalty',
  'Returns & Warranties',
  'Contact & Support',
  'Consulting',
]

export interface FAQ {
  id: string
  category: string
  question: string
  answer: string
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/80">{title}</h2>
      {children}
    </div>
  )
}

export default function FaqsClient({ faqs }: { faqs: FAQ[] }) {
  const [category, setCategory] = useState('All')
  const filteredFaqs = category === 'All' ? faqs : faqs.filter((item) => item.category === category)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="border-b border-border/10 bg-gradient-to-br from-background via-background to-muted/20 py-20 md:py-26">
          <div className="mx-auto max-w-5xl space-y-4 px-6 md:px-8">
            <h1 className="font-serif text-5xl font-light text-foreground md:text-7xl">Frequently Asked Questions</h1>
            <p className="max-w-2xl text-xl font-light text-muted-foreground">Find answers about our design, sourcing, furniture, architecture, and studio services.</p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl space-y-8 px-6 py-12 md:px-8 lg:py-16">
          <FilterGroup title="Filter by Category">
            <div className="flex flex-wrap gap-2.5">
              {questionCategories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={cn(
                    'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 py-2 font-sans text-xs uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    category === item ? 'border-gold/30 bg-gold/10 font-medium text-gold' : 'border-border/40 bg-transparent text-foreground/70 hover:bg-muted/10 hover:text-foreground',
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </FilterGroup>

          <section className="rounded-2xl border border-border/20 bg-muted/5 p-6 py-6 md:py-8">
            {filteredFaqs.length > 0 ? (
              <div className="space-y-4">
                {filteredFaqs.map((item) => (
                  <article key={item.id || item.question} className="space-y-2 rounded-lg border border-border/20 bg-card p-6 transition-colors hover:border-gold/30">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-serif text-lg font-normal text-foreground">{item.question}</h2>
                      <span className="flex-shrink-0 rounded border border-gold/20 bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">{item.category}</span>
                    </div>
                    <p className="pt-1 text-sm font-light leading-relaxed text-muted-foreground">{item.answer}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm font-light text-muted-foreground">No FAQs available under <span className="font-medium text-foreground">{category}</span>.</div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
