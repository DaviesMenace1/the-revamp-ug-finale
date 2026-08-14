'use client'

import { useState, useEffect } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

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

interface FAQ {
  id: string
  category: string
  question: string
  answer: string
  status: string
}

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
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function loadFaqs() {
      try {
        const res = await fetch('/api/faqs?status=published')
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setFaqs(json.data)
        }
      } catch (err) {
        console.error('Failed to load published FAQs:', err)
      } finally {
        setLoading(false)
      }
    }
    loadFaqs()
  }, [])

  const filteredFaqs =
    category === 'All' ? faqs : faqs.filter((item) => item.category === category)

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
              Find answers to common questions about our design, global sourcing, development, and studio services.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 md:px-8 py-12 lg:py-16 space-y-8">
          <FilterGroup title="Filter by Category">
            <div className="flex flex-wrap gap-2.5">
              {questionCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-sans transition-colors px-4 py-2 rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    category === cat
                      ? 'bg-gold/10 text-gold border-gold/30 font-medium'
                      : 'bg-transparent text-foreground/70 hover:text-foreground hover:bg-muted/10 border-border/40'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </FilterGroup>

          <section className="py-6 md:py-8 border border-border/20 bg-muted/5 rounded-2xl p-6">
            {loading ? (
              <div className="flex justify-center items-center py-16 text-muted-foreground">
                <Loader2 className="animate-spin mr-2" size={20} /> Loading questions...
              </div>
            ) : filteredFaqs.length > 0 ? (
              <div className="space-y-4">
                {filteredFaqs.map((item) => (
                  <div
                    key={item.id || item.question}
                    className="space-y-2 p-6 rounded-lg border border-border/20 bg-card hover:border-gold/30 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-foreground font-serif text-lg font-normal">
                        {item.question}
                      </h3>
                      <span className="text-[10px] uppercase tracking-widest text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20 flex-shrink-0">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm font-light leading-relaxed pt-1">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground font-light text-sm">
                No FAQs available under <span className="text-foreground font-medium">{category}</span>.
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}

