'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export type HomepageArticle = {
  slug: string
  category: string
  title: string
  excerpt: string
  date: string
  readTime: string
  image: string | null
}

function normaliseImage(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null

    // Older article records may contain a JSON string or an accidentally
    // double-encoded JSON array. Pick the first usable URL in either case.
    let candidate: unknown = trimmed
    for (let i = 0; i < 2; i += 1) {
      if (typeof candidate !== 'string') break
      try {
        const parsed = JSON.parse(candidate)
        candidate = parsed
      } catch {
        break
      }
    }

    if (Array.isArray(candidate)) {
      const first = candidate.find((item) => typeof item === 'string' && item.trim())
      return typeof first === 'string' ? first : null
    }

    if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate)) return candidate
    return null
  }

  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string' && item.trim())
    return typeof first === 'string' ? first : null
  }

  return null
}

function normaliseArticles(value: unknown): HomepageArticle[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const slug = typeof record.slug === 'string' ? record.slug.trim() : ''
    const title = typeof record.title === 'string' ? record.title.trim() : ''
    if (!slug || !title) return []

    const body = typeof record.content === 'string' ? record.content : ''
    const publishedAt = typeof record.publishedAt === 'string' || record.publishedAt instanceof Date
      ? new Date(record.publishedAt)
      : null

    const excerpt = typeof record.excerpt === 'string' && record.excerpt.trim()
      ? record.excerpt.trim()
      : title

    return [{
      slug,
      category: typeof record.category === 'string' && record.category.trim() ? record.category.trim() : 'Design Journal',
      title,
      excerpt,
      date: publishedAt && !Number.isNaN(publishedAt.getTime())
        ? publishedAt.toLocaleDateString('en-UG', { month: 'long', year: 'numeric' })
        : '',
      readTime: `${Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200))} min read`,
      image: normaliseImage(record.featuredImage),
    }]
  })
}

export function JournalSection({ articles: initialArticles }: { articles: HomepageArticle[] }) {
  const [articles, setArticles] = useState<HomepageArticle[]>(normaliseArticles(initialArticles))
  const [isLoading, setIsLoading] = useState(initialArticles.length === 0)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (initialArticles.length > 0) return

    const controller = new AbortController()
    const loadArticles = async () => {
      try {
        const response = await fetch('/api/articles?limit=3', {
          signal: controller.signal,
          cache: 'no-store',
        })
        const payload = await response.json().catch(() => null) as { data?: unknown } | null
        if (!response.ok || !payload) return
        const normalized = normaliseArticles(payload.data)
        setArticles(normalized)
      } catch {
        if (!controller.signal.aborted) setArticles([])
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadArticles()
    return () => controller.abort()
  }, [initialArticles])

  useEffect(() => {
    if (articles.length < 2) return
    const timer = window.setInterval(() => {
      setActiveIndex((previous) => (previous + 1) % articles.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [articles.length])

  if (isLoading) {
    return (
      <section className="section-pad bg-background" aria-live="polite" aria-busy="true">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="gold-line" />
              <h2 className="font-serif text-4xl font-light leading-tight text-foreground md:text-5xl lg:text-6xl">The Journal</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-3">
            <div className="h-80 animate-pulse bg-muted/30 md:col-span-2" />
            <div className="h-80 animate-pulse bg-muted/30" />
          </div>
        </div>
      </section>
    )
  }

  if (articles.length === 0) {
    return (
      <section className="section-pad bg-background">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="flex flex-col gap-6 border-y border-border py-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="gold-line" />
              <h2 className="font-serif text-4xl font-light leading-tight text-foreground md:text-5xl lg:text-6xl">The Journal</h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Thoughts on spaces, materials, sourcing, and the work of making a room feel like your own.</p>
            </div>
            <Link href="/journal" className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-widest text-gold hover:underline">Visit the journal <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>
    )
  }

  const featuredIndex = activeIndex % articles.length
  const featured = articles[featuredIndex]
  const rest = articles.filter((_, index) => index !== featuredIndex).slice(0, 2)

  return (
    <section className="section-pad bg-background">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="gold-line" />
            <h2 className="font-serif text-4xl font-light leading-tight text-foreground md:text-5xl lg:text-6xl">The Journal</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Stories, observations, and considered thoughts from the world of refined living.</p>
          </div>
          <Link href="/journal" className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-widest text-gold hover:underline">All articles <ArrowRight size={14} /></Link>
        </div>

        <div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-3">
          <Link href={`/journal/${featured.slug}`} className="group relative block min-h-[520px] overflow-hidden bg-background lg:col-span-2">
            {featured.image ? (
              <img
                src={featured.image}
                alt={featured.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                onError={(event) => { event.currentTarget.style.display = 'none' }}
              />
            ) : <div className="absolute inset-0 bg-muted" aria-hidden="true" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8 sm:p-10">
              <Badge variant="outline" className="mb-4 rounded-none border-gold/50 font-sans text-[10px] uppercase tracking-widest text-gold">{featured.category}</Badge>
              <h3 className="mb-3 max-w-3xl font-serif text-3xl font-light leading-tight text-white md:text-5xl">{featured.title}</h3>
              <p className="mb-4 line-clamp-3 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">{featured.excerpt}</p>
              <div className="flex items-center gap-3 text-xs text-white/55"><span>{featured.date}</span><span className="h-3 w-px bg-white/20" /><span>{featured.readTime}</span></div>
            </div>
          </Link>

          <div className="grid bg-border lg:grid-rows-2">
            {rest.map((article) => (
              <Link key={article.slug} href={`/journal/${article.slug}`} className="group flex min-h-[220px] flex-col bg-background">
                <div className="relative h-48 overflow-hidden bg-muted">
                  {article.image && <img src={article.image} alt={article.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} />}
                </div>
                <div className="flex flex-1 flex-col justify-center p-6">
                  <Badge variant="outline" className="mb-3 w-fit rounded-none border-border font-sans text-[10px] uppercase tracking-widest text-muted-foreground">{article.category}</Badge>
                  <h3 className="font-serif text-2xl font-light leading-snug text-foreground transition-colors group-hover:text-gold">{article.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{String(featuredIndex + 1).padStart(2, '0')} / {String(articles.length).padStart(2, '0')}</span>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Previous journal story" onClick={() => setActiveIndex((previous) => (previous - 1 + articles.length) % articles.length)} className="flex size-10 items-center justify-center border border-border text-foreground transition-colors hover:border-primary hover:text-primary"><ArrowRight size={15} className="rotate-180" /></button>
            <button type="button" aria-label="Next journal story" onClick={() => setActiveIndex((previous) => (previous + 1) % articles.length)} className="flex size-10 items-center justify-center border border-border text-foreground transition-colors hover:border-primary hover:text-primary"><ArrowRight size={15} /></button>
          </div>
        </div>
      </div>
    </section>
  )
}
