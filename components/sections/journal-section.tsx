'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export type HomepageArticle = {
  slug: string
  category: string
  title: string
  excerpt: string
  date: string
  readTime: string
  image: string | null
}

const FALLBACK_IMAGE =
  'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg'

function normaliseImage(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  let parsed: unknown = trimmed

  for (let i = 0; i < 2; i += 1) {
    if (typeof parsed !== 'string') break

    try {
      parsed = JSON.parse(parsed)
    } catch {
      break
    }
  }

  if (Array.isArray(parsed)) {
    const first = parsed.find(
      (item): item is string =>
        typeof item === 'string' && /^https?:\/\//i.test(item.trim()),
    )

    return first?.trim() || null
  }

  if (typeof parsed === 'string' && /^https?:\/\//i.test(parsed)) {
    return parsed.trim()
  }

  return null
}

function normaliseArticles(payload: unknown): HomepageArticle[] {
  if (!payload || typeof payload !== 'object') return []

  const record = payload as Record<string, unknown>
  const data = record.data

  if (!Array.isArray(data)) return []

  return data.flatMap((value) => {
    if (!value || typeof value !== 'object') return []

    const article = value as Record<string, unknown>

    const slug =
      typeof article.slug === 'string' ? article.slug.trim() : ''

    const title =
      typeof article.title === 'string' ? article.title.trim() : ''

    if (!slug || !title) return []

    const excerpt =
      typeof article.excerpt === 'string' && article.excerpt.trim()
        ? article.excerpt.trim()
        : title

    const category =
      typeof article.category === 'string' && article.category.trim()
        ? article.category.trim()
        : 'Design Journal'

    const content =
      typeof article.content === 'string' ? article.content : ''

    const publishedAt =
      typeof article.publishedAt === 'string'
        ? new Date(article.publishedAt)
        : null

    const date =
      publishedAt && !Number.isNaN(publishedAt.getTime())
        ? publishedAt.toLocaleDateString('en-UG', {
            month: 'long',
            year: 'numeric',
          })
        : ''

    const readTime = `${Math.max(
      1,
      Math.round(
        content.split(/\s+/).filter(Boolean).length / 200,
      ),
    )} min read`

    return [
      {
        slug,
        category,
        title,
        excerpt,
        date,
        readTime,
        image:
          normaliseImage(article.featuredImage) ??
          normaliseImage(article.featured_image) ??
          FALLBACK_IMAGE,
      },
    ]
  })
}

export function JournalSection({
  articles: initialArticles = [],
}: {
  articles?: HomepageArticle[]
}) {
  const [articles, setArticles] =
    useState<HomepageArticle[]>(initialArticles)

  const [isLoading, setIsLoading] = useState(
    initialArticles.length === 0,
  )

  const [isPaused, setIsPaused] = useState(false)

  const railRef = useRef<HTMLDivElement>(null)

  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartScrollLeft = useRef(0)

  useEffect(() => {
    if (initialArticles.length > 0) {
      setArticles(initialArticles)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    async function loadArticles() {
      try {
        const response = await fetch('/api/articles?limit=8', {
          signal: controller.signal,
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to load articles')
        }

        const payload = await response.json()
        const normalised = normaliseArticles(payload)

        setArticles(normalised)
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(
            '[JournalSection] Failed to load articles:',
            error,
          )
          setArticles([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadArticles()

    return () => controller.abort()
  }, [initialArticles])

  /*
   * Continuous rail movement.
   *
   * The duplicated set allows us to jump back by one set width
   * when the user reaches the second copy, making the movement
   * look continuous.
   */
  useEffect(() => {
    const rail = railRef.current

    if (!rail || articles.length < 2) return
    if (isPaused) return

    let animationFrame = 0
    let previousTime = performance.now()

    const speed = 0.095

    const animate = (time: number) => {
      const delta = time - previousTime
      previousTime = time

      rail.scrollLeft += delta * speed

      const halfWidth = rail.scrollWidth / 2

      if (rail.scrollLeft >= halfWidth) {
        rail.scrollLeft -= halfWidth
      }

      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [articles.length, isPaused])

  function scrollByAmount(direction: 'left' | 'right') {
    const rail = railRef.current

    if (!rail) return

    const amount = Math.min(
      Math.max(320, rail.clientWidth * 0.72),
      700,
    )

    rail.scrollBy({
      left: direction === 'right' ? amount : -amount,
      behavior: 'smooth',
    })
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    const rail = railRef.current

    if (!rail) return

    isDragging.current = true
    dragStartX.current = event.clientX
    dragStartScrollLeft.current = rail.scrollLeft

    setIsPaused(true)

    rail.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    const rail = railRef.current

    if (!rail || !isDragging.current) return

    const distance = event.clientX - dragStartX.current

    rail.scrollLeft =
      dragStartScrollLeft.current - distance
  }

  function handlePointerUp(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    const rail = railRef.current

    isDragging.current = false

    if (rail?.hasPointerCapture(event.pointerId)) {
      rail.releasePointerCapture(event.pointerId)
    }

    setIsPaused(false)
  }

  if (isLoading) {
    return (
      <section className="section-pad bg-background">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="mb-10">
            <div className="mb-4 h-px w-12 bg-primary" />
            <div className="h-12 w-56 animate-pulse bg-muted/40" />
          </div>

          <div className="flex gap-5 overflow-hidden">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="w-[78vw] flex-none md:w-[42vw] lg:w-[31vw]"
              >
                <div className="aspect-[4/3] animate-pulse bg-muted/40" />
                <div className="mt-5 h-3 w-24 animate-pulse bg-muted/40" />
                <div className="mt-3 h-8 w-4/5 animate-pulse bg-muted/40" />
              </div>
            ))}
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
              <div className="mb-4 h-px w-12 bg-primary" />
              <h2 className="font-serif text-4xl font-light text-foreground md:text-5xl lg:text-6xl">
                The Journal
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                Thoughts on spaces, materials, sourcing, and the work
                of making a room feel like your own.
              </p>
            </div>

            <Link
              href="/journal"
              className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:text-foreground"
            >
              Visit the Journal
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const railArticles = [...articles, ...articles]

  return (
    <section
      className="section-pad overflow-hidden bg-background"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 h-px w-12 bg-primary" />

            <div className="flex items-end gap-5">
              <h2 className="font-serif text-4xl font-light leading-none text-foreground md:text-5xl lg:text-6xl">
                The Journal
              </h2>

              <span className="pb-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Ideas / Spaces / Living
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/journal"
              className="inline-flex min-h-10 items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:text-foreground"
            >
              View all
              <ArrowRight size={14} />
            </Link>

            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                aria-label="Previous journal stories"
                onClick={() => scrollByAmount('left')}
                className="flex size-10 items-center justify-center border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <ArrowLeft size={15} />
              </button>

              <button
                type="button"
                aria-label="Next journal stories"
                onClick={() => scrollByAmount('right')}
                className="flex size-10 items-center justify-center border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={railRef}
          className="journal-rail flex cursor-grab gap-5 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {railArticles.map((article, index) => (
            <Link
              key={`${article.slug}-${index}`}
              href={`/journal/${article.slug}`}
              draggable={false}
              className="group w-[78vw] flex-none select-none md:w-[42vw] lg:w-[31vw]"
            >
              <article>
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.title}
                      draggable={false}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-primary">
                    {article.category}
                  </span>

                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {article.readTime}
                  </span>
                </div>

                <h3 className="mt-3 max-w-xl font-serif text-2xl font-light leading-[1.08] text-foreground transition-colors duration-300 group-hover:text-primary md:text-3xl">
                  {article.title}
                </h3>

                <p className="mt-3 max-w-xl line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {article.excerpt}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {article.date}
                  </span>

                  <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-foreground transition-colors group-hover:text-primary">
                    Read story
                    <ArrowRight size={13} />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Drag to explore
          </span>

          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {articles.length.toString().padStart(2, '0')} stories
          </span>
        </div>
      </div>
    </section>
  )
} 

// 'use client'

// import { useEffect, useState } from 'react'
// import Link from 'next/link'
// import { ArrowRight } from 'lucide-react'
// import { Badge } from '@/components/ui/badge'

// export type HomepageArticle = {
//   slug: string
//   category: string
//   title: string
//   excerpt: string
//   date: string
//   readTime: string
//   image: string | null
// }

// function normaliseImage(value: unknown): string | null {
//   if (typeof value === 'string') {
//     const trimmed = value.trim()
//     if (!trimmed) return null
//     let candidate: unknown = trimmed
//     for (let i = 0; i < 2; i += 1) {
//       if (typeof candidate !== 'string') break
//       try { candidate = JSON.parse(candidate) } catch { break }
//     }
//     if (Array.isArray(candidate)) {
//       const first = candidate.find((item) => typeof item === 'string' && item.trim())
//       return typeof first === 'string' ? first : null
//     }
//     if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate)) return candidate
//     return null
//   }
//   if (Array.isArray(value)) {
//     const first = value.find((item) => typeof item === 'string' && item.trim())
//     return typeof first === 'string' ? first : null
//   }
//   return null
// }

// function normaliseArticles(value: unknown): HomepageArticle[] {
//   if (!Array.isArray(value)) return []
//   return value.flatMap((item) => {
//     if (!item || typeof item !== 'object') return []
//     const record = item as Record<string, unknown>
//     const slug = typeof record.slug === 'string' ? record.slug.trim() : ''
//     const title = typeof record.title === 'string' ? record.title.trim() : ''
//     if (!slug || !title) return []
//     const body = typeof record.content === 'string' ? record.content : ''
//     const publishedAt = typeof record.publishedAt === 'string' || record.publishedAt instanceof Date ? new Date(record.publishedAt) : null
//     return [{
//       slug,
//       category: typeof record.category === 'string' && record.category.trim() ? record.category.trim() : 'Design Journal',
//       title,
//       excerpt: typeof record.excerpt === 'string' && record.excerpt.trim() ? record.excerpt.trim() : title,
//       date: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt.toLocaleDateString('en-UG', { month: 'long', year: 'numeric' }) : '',
//       readTime: `${Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200))} min read`,
//       image: normaliseImage(record.featuredImage),
//     }]
//   })
// }

// export function JournalSection({ articles: initialArticles }: { articles: HomepageArticle[] }) {
//   const [articles, setArticles] = useState<HomepageArticle[]>(normaliseArticles(initialArticles))
//   const [isLoading, setIsLoading] = useState(initialArticles.length === 0)
//   const [activeIndex, setActiveIndex] = useState(0)

//   useEffect(() => {
//     if (initialArticles.length > 0) return
//     const controller = new AbortController()
//     const loadArticles = async () => {
//       try {
//         const response = await fetch('/api/articles?limit=6', { signal: controller.signal, cache: 'no-store' })
//         const payload = await response.json().catch(() => null) as { data?: unknown } | null
//         if (!response.ok || !payload) return
//         setArticles(normaliseArticles(payload.data))
//       } catch {
//         if (!controller.signal.aborted) setArticles([])
//       } finally {
//         if (!controller.signal.aborted) setIsLoading(false)
//       }
//     }
//     void loadArticles()
//     return () => controller.abort()
//   }, [initialArticles])

//   useEffect(() => {
//     if (articles.length < 2) return
//     const timer = window.setInterval(() => setActiveIndex((previous) => (previous + 1) % articles.length), 5000)
//     return () => window.clearInterval(timer)
//   }, [articles.length])

//   if (isLoading) {
//     return <section className="section-pad bg-background" aria-live="polite" aria-busy="true"><div className="mx-auto max-w-[1440px] px-6 lg:px-12"><div className="h-80 animate-pulse border-y border-border bg-muted/30" /></div></section>
//   }

//   if (articles.length === 0) {
//     return <section className="section-pad bg-background"><div className="mx-auto max-w-[1440px] px-6 lg:px-12"><div className="border-y border-border py-12"><div className="gold-line" /><h2 className="font-serif text-4xl font-light leading-tight text-foreground md:text-5xl lg:text-6xl">The Journal</h2><p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Stories, observations, and considered thoughts from the world of refined living.</p><Link href="/journal" className="mt-7 inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-widest text-gold hover:underline">Visit the journal <ArrowRight size={14} /></Link></div></div></section>
//   }

//   const featuredIndex = activeIndex % articles.length
//   const featured = articles[featuredIndex]
//   const rest = articles.filter((_, index) => index !== featuredIndex).slice(0, 2)

//   return <section className="section-pad bg-background">
//     <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
//       <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
//         <div><div className="gold-line" /><h2 className="font-serif text-4xl font-light leading-tight text-foreground md:text-5xl lg:text-6xl">The Journal</h2><p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Stories, observations, and considered thoughts from the world of refined living.</p></div>
//         <Link href="/journal" className="inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-widest text-gold hover:underline">All articles <ArrowRight size={14} /></Link>
//       </div>
//       <div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-3">
//         <Link href={`/journal/${featured.slug}`} className="group relative block min-h-[540px] overflow-hidden bg-background lg:col-span-2">
//           {featured.image ? <img src={featured.image} alt={featured.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <div className="absolute inset-0 bg-muted" aria-hidden="true" />}
//           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
//           <div className="absolute inset-x-0 bottom-0 p-8 sm:p-10"><Badge variant="outline" className="mb-4 rounded-none border-gold/50 font-sans text-[10px] uppercase tracking-widest text-gold">{featured.category}</Badge><h3 className="mb-3 max-w-3xl font-serif text-3xl font-light leading-tight text-white md:text-5xl">{featured.title}</h3><p className="mb-4 line-clamp-3 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">{featured.excerpt}</p><div className="flex items-center gap-3 text-xs text-white/55"><span>{featured.date}</span><span className="h-3 w-px bg-white/20" /><span>{featured.readTime}</span></div></div>
//         </Link>
//         <div className="grid bg-border lg:grid-rows-2">
//           {rest.map((article) => <Link key={article.slug} href={`/journal/${article.slug}`} className="group flex min-h-[230px] flex-col bg-background"><div className="relative h-52 overflow-hidden bg-muted">{article.image && <img src={article.image} alt={article.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} />}</div><div className="flex flex-1 flex-col justify-center p-6"><Badge variant="outline" className="mb-3 w-fit rounded-none border-border font-sans text-[10px] uppercase tracking-widest text-muted-foreground">{article.category}</Badge><h3 className="font-serif text-2xl font-light leading-snug text-foreground transition-colors group-hover:text-gold">{article.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{article.excerpt}</p></div></Link>)}
//         </div>
//       </div>
//       <div className="mt-8 flex items-center justify-between border-t border-border pt-5"><span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{String(featuredIndex + 1).padStart(2, '0')} / {String(articles.length).padStart(2, '0')}</span><div className="flex items-center gap-2"><button type="button" aria-label="Previous journal story" onClick={() => setActiveIndex((previous) => (previous - 1 + articles.length) % articles.length)} className="flex size-10 items-center justify-center border border-border text-foreground transition-colors hover:border-primary hover:text-primary"><ArrowRight size={15} className="rotate-180" /></button><button type="button" aria-label="Next journal story" onClick={() => setActiveIndex((previous) => (previous + 1) % articles.length)} className="flex size-10 items-center justify-center border border-border text-foreground transition-colors hover:border-primary hover:text-primary"><ArrowRight size={15} /></button></div></div>
//     </div>
//   </section>
// }
