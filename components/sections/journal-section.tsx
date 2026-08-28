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

  let candidate: unknown = value.trim()

  if (!candidate) return null

  for (let i = 0; i < 3; i += 1) {
    if (typeof candidate !== 'string') break

    const trimmed = candidate.trim()

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed
    }

    try {
      candidate = JSON.parse(trimmed)
    } catch {
      break
    }
  }

  if (Array.isArray(candidate)) {
    const first = candidate.find(
      (item): item is string =>
        typeof item === 'string' &&
        /^https?:\/\//i.test(item.trim()),
    )

    return first?.trim() ?? null
  }

  return typeof candidate === 'string' &&
    /^https?:\/\//i.test(candidate.trim())
    ? candidate.trim()
    : null
}

function normaliseArticles(payload: unknown): HomepageArticle[] {
  if (!payload || typeof payload !== 'object') return []

  const root = payload as Record<string, unknown>
  const data = root.data

  if (!Array.isArray(data)) return []

  return data.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []

    const article = entry as Record<string, unknown>

    const slug =
      typeof article.slug === 'string'
        ? article.slug.trim()
        : ''

    const title =
      typeof article.title === 'string'
        ? article.title.trim()
        : ''

    if (!slug || !title) return []

    const category =
      typeof article.category === 'string' &&
      article.category.trim()
        ? article.category.trim()
        : 'Design Journal'

    const excerpt =
      typeof article.excerpt === 'string' &&
      article.excerpt.trim()
        ? article.excerpt.trim()
        : title

    const content =
      typeof article.content === 'string'
        ? article.content.replace(/\\n/g, '\n')
        : ''

    const rawDate =
      typeof article.publishedAt === 'string'
        ? article.publishedAt
        : typeof article.published_at === 'string'
          ? article.published_at
          : ''

    const parsedDate = rawDate
      ? new Date(rawDate)
      : null

    const date =
      parsedDate &&
      !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString('en-UG', {
            month: 'long',
            year: 'numeric',
          })
        : ''

    const wordCount = content
      .split(/\s+/)
      .filter(Boolean)
      .length

    const readTime = `${Math.max(
      1,
      Math.ceil(wordCount / 200),
    )} min read`

    const image =
      normaliseImage(article.featuredImage) ??
      normaliseImage(article.featured_image) ??
      FALLBACK_IMAGE

    return [
      {
        slug,
        category,
        title,
        excerpt,
        date,
        readTime,
        image,
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

  const railRef = useRef<HTMLDivElement>(null)

  const animationRef = useRef<number | null>(null)

  const isDraggingRef = useRef(false)

  const dragStartXRef = useRef(0)

  const dragStartScrollLeftRef = useRef(0)

  const lastFrameTimeRef = useRef<number | null>(null)

  /*
   * The rail is intentionally always moving.
   * User interaction temporarily pauses movement,
   * then movement resumes on release.
   */
  const isInteractingRef = useRef(false)

  useEffect(() => {
    if (initialArticles.length > 0) {
      setArticles(initialArticles)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchArticles() {
      try {
        const response = await fetch(
          '/api/articles?limit=8',
          {
            signal: controller.signal,
            cache: 'no-store',
          },
        )

        if (!response.ok) {
          throw new Error(
            `Articles request failed: ${response.status}`,
          )
        }

        const payload = await response.json()

        const nextArticles =
          normaliseArticles(payload)

        setArticles(nextArticles)
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(
            '[JournalSection]',
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

    void fetchArticles()

    return () => {
      controller.abort()
    }
  }, [initialArticles])

  /*
   * Continuous scrolling.
   *
   * We render the article list twice.
   * Once the scroll position reaches the midpoint,
   * we jump back by exactly half of the content width.
   *
   * Because both halves are identical, the jump is invisible.
   */
  useEffect(() => {
    const rail = railRef.current

    if (!rail || articles.length < 2) {
      return
    }

    let frame: number

    lastFrameTimeRef.current =
      performance.now()

    const speed = 28

    const animate = (timestamp: number) => {
      const previous =
        lastFrameTimeRef.current ??
        timestamp

      const delta =
        timestamp - previous

      lastFrameTimeRef.current =
        timestamp

      if (!isInteractingRef.current) {
        rail.scrollLeft +=
          (speed * delta) / 1000
      }

      const midpoint =
        rail.scrollWidth / 2

      if (
        midpoint > 0 &&
        rail.scrollLeft >= midpoint
      ) {
        rail.scrollLeft -= midpoint
      }

      frame =
        requestAnimationFrame(animate)
    }

    /*
     * Start immediately.
     *
     * There is deliberately no hover condition here.
     */
    frame =
      requestAnimationFrame(animate)

    animationRef.current = frame

    return () => {
      cancelAnimationFrame(frame)
      animationRef.current = null
      lastFrameTimeRef.current = null
    }
  }, [articles.length])

  function scrollByAmount(
    direction: 'left' | 'right',
  ) {
    const rail = railRef.current

    if (!rail) return

    const amount =
      Math.max(
        320,
        Math.min(
          rail.clientWidth * 0.72,
          680,
        ),
      )

    isInteractingRef.current = true

    rail.scrollBy({
      left:
        direction === 'right'
          ? amount
          : -amount,
      behavior: 'smooth',
    })

    window.setTimeout(() => {
      isInteractingRef.current = false
    }, 700)
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    const rail = railRef.current

    if (!rail) return

    isDraggingRef.current = true

    isInteractingRef.current = true

    dragStartXRef.current =
      event.clientX

    dragStartScrollLeftRef.current =
      rail.scrollLeft

    rail.setPointerCapture(
      event.pointerId,
    )
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    const rail = railRef.current

    if (
      !rail ||
      !isDraggingRef.current
    ) {
      return
    }

    const distance =
      event.clientX -
      dragStartXRef.current

    rail.scrollLeft =
      dragStartScrollLeftRef.current -
      distance
  }

  function handlePointerUp(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    const rail = railRef.current

    isDraggingRef.current = false

    if (
      rail?.hasPointerCapture(
        event.pointerId,
      )
    ) {
      rail.releasePointerCapture(
        event.pointerId,
      )
    }

    /*
     * Resume automatically after the
     * pointer interaction is finished.
     */
    window.setTimeout(() => {
      isInteractingRef.current = false
    }, 120)
  }

  function handlePointerCancel(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    const rail = railRef.current

    isDraggingRef.current = false

    if (
      rail?.hasPointerCapture(
        event.pointerId,
      )
    ) {
      rail.releasePointerCapture(
        event.pointerId,
      )
    }

    isInteractingRef.current = false
  }

  if (isLoading) {
    return (
      <section className="section-pad overflow-hidden bg-background">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-4 h-px w-12 bg-primary" />

              <div className="h-12 w-56 animate-pulse bg-muted/40" />
            </div>
          </div>

          <div className="flex gap-5 overflow-hidden">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="w-[82vw] flex-none sm:w-[58vw] md:w-[42vw] lg:w-[31vw]"
              >
                <div className="aspect-[4/3] animate-pulse bg-muted/40" />

                <div className="mt-5 h-3 w-28 animate-pulse bg-muted/40" />

                <div className="mt-3 h-8 w-4/5 animate-pulse bg-muted/40" />

                <div className="mt-3 h-4 w-full animate-pulse bg-muted/40" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (articles.length === 0) {
    return (
      <section className="section-pad overflow-hidden bg-background">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="flex flex-col gap-6 border-y border-border py-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-4 h-px w-12 bg-primary" />

              <h2 className="font-serif text-4xl font-light leading-tight text-foreground md:text-5xl lg:text-6xl">
                The Journal
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                Thoughts on spaces, materials, sourcing, and the work of making a room feel like your own.
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

  /*
   * Duplicate the article list for the seamless loop.
   */
  const railArticles = [
    ...articles,
    ...articles,
  ]

  return (
    <section className="section-pad overflow-hidden bg-background">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 h-px w-12 bg-primary" />

            <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous journal stories"
                onClick={() =>
                  scrollByAmount('left')
                }
                className="flex size-10 items-center justify-center border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <ArrowLeft size={15} />
              </button>

              <button
                type="button"
                aria-label="Next journal stories"
                onClick={() =>
                  scrollByAmount('right')
                }
                className="flex size-10 items-center justify-center border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={railRef}
          className="flex touch-pan-y cursor-grab gap-5 overflow-x-auto overscroll-x-contain pb-4 select-none [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          {railArticles.map(
            (article, index) => (
              <Link
                key={`${article.slug}-${index}`}
                href={`/journal/${article.slug}`}
                draggable={false}
                className="group w-[82vw] flex-none sm:w-[58vw] md:w-[42vw] lg:w-[31vw]"
              >
                <article>
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt={article.title}
                        draggable={false}
                        loading={
                          index < 4
                            ? 'eager'
                            : 'lazy'
                        }
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                      />
                    ) : (
                      <div
                        className="h-full w-full bg-muted"
                        aria-hidden="true"
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
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

                  <p className="mt-3 line-clamp-3 max-w-xl text-sm leading-6 text-muted-foreground">
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
            ),
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Moving through the journal
          </span>

          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {articles.length
              .toString()
              .padStart(2, '0')}{' '}
            stories
          </span>
        </div>
      </div>
    </section>
  )
}
