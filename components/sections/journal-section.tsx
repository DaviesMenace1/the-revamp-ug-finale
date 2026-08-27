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

export function JournalSection({ articles: initialArticles }: { articles: HomepageArticle[] }) {
  const [articles, setArticles] = useState(initialArticles)
  const [isLoading, setIsLoading] = useState(initialArticles.length === 0)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (initialArticles.length > 0) return

    const controller = new AbortController()
    const loadArticles = async () => {
      try {
        const response = await fetch('/api/articles?limit=3', { signal: controller.signal })
        const payload = await response.json().catch(() => null) as { data?: unknown } | null
        if (!response.ok || !payload || !Array.isArray(payload.data)) return

        const normalized = payload.data.flatMap((value) => {
          if (!value || typeof value !== 'object') return []
          const record = value as Record<string, unknown>
          const slug = typeof record.slug === 'string' ? record.slug : ''
          const title = typeof record.title === 'string' ? record.title : ''
          if (!slug || !title) return []
          const body = typeof record.content === 'string' ? record.content : ''
          const publishedAt = typeof record.publishedAt === 'string' || record.publishedAt instanceof Date ? new Date(record.publishedAt) : null
          return [{
            slug,
            category: typeof record.category === 'string' && record.category ? record.category : 'Design Journal',
            title,
            excerpt: typeof record.excerpt === 'string' && record.excerpt ? record.excerpt : title,
            date: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt.toLocaleDateString('en-UG', { month: 'long', year: 'numeric' }) : '',
            readTime: `${Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200))} min read`,
            image: typeof record.featuredImage === 'string' ? record.featuredImage : null,
          }]
        })
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
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12"><div className="h-56 animate-pulse border-y border-border bg-muted/30" /></div>
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

  const featured = articles[activeIndex % articles.length]
  const rest = articles.filter((_, index) => index !== activeIndex % articles.length).slice(0, 2)

  return (
    <section className="section-pad bg-background">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="gold-line" />
            <h2 className="font-serif text-4xl font-light leading-tight text-foreground md:text-5xl lg:text-6xl">The Journal</h2>
          </div>
          <Link href="/journal" className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-widest text-gold hover:underline">All articles <ArrowRight size={14} /></Link>
        </div>

        <div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-2">
          <Link key={featured.slug} href={`/journal/${featured.slug}`} className="group relative block min-h-[420px] overflow-hidden bg-background lg:row-span-2">
            {featured.image ? <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${featured.image}')` }} role="img" aria-label={featured.title} /> : <div className="absolute inset-0 bg-muted" aria-hidden="true" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8">
              <Badge variant="outline" className="mb-4 rounded-none border-gold/50 font-sans text-[10px] uppercase tracking-widest text-gold">{featured.category}</Badge>
              <h3 className="mb-3 font-serif text-2xl font-light leading-tight text-white md:text-3xl">{featured.title}</h3>
              <p className="mb-4 line-clamp-2 max-w-md text-sm leading-relaxed text-white/70">{featured.excerpt}</p>
              <div className="flex items-center gap-3 text-xs text-white/50"><span>{featured.date}</span><span className="h-3 w-px bg-white/20" /><span>{featured.readTime}</span></div>
            </div>
          </Link>

          <div className="flex flex-col gap-px bg-border">
            {rest.map((article) => <Link key={article.slug} href={`/journal/${article.slug}`} className="group flex gap-6 bg-background p-6 transition-colors hover:bg-muted/30"><div className="h-28 w-28 flex-none overflow-hidden bg-muted">{article.image && <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${article.image}')` }} role="img" aria-label={article.title} />}</div><div className="flex min-w-0 flex-col justify-center"><Badge variant="outline" className="mb-2 w-fit rounded-none border-border font-sans text-[10px] uppercase tracking-widest text-muted-foreground">{article.category}</Badge><h3 className="mb-2 font-serif text-lg font-light leading-snug text-foreground transition-colors group-hover:text-gold">{article.title}</h3><p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{article.excerpt}</p><div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground/60"><span>{article.date}</span><span className="h-3 w-px bg-border" /><span>{article.readTime}</span></div></div></Link>)}
          </div>
        </div>
      </div>
    </section>
  )
}
