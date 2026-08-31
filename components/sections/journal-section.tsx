'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from '@/components/ui/luxury-icons'

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

const AUTO_SCROLL_SPEED = 24

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return ''

  return value
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normaliseImage(value: unknown): string | null {
  if (typeof value !== 'string') {
    if (Array.isArray(value)) {
      const first = value.find(
        (item): item is string =>
          typeof item === 'string' &&
          /^https?:\/\//i.test(item.trim()),
      )

      return first?.trim() || null
    }

    return null
  }

  let candidate: unknown = value.trim()

  if (!candidate) return null

  /*
   * Handles:
   *
   * "https://..."
   *
   * ["https://...", "https://..."]
   *
   * "[\"https://...\", \"https://...\"]"
   *
   * JSON encoded more than once.
   */
  for (let attempt = 0; attempt < 3; attempt += 1) {
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

    return first?.trim() || null
  }

  if (
    typeof candidate === 'string' &&
    /^https?:\/\//i.test(candidate.trim())
  ) {
    return candidate.trim()
  }

  return null
}

function calculateReadTime(content: string): string {
  const words = cleanText(content)
    .split(/\s+/)
    .filter(Boolean).length

  if (!words) return '3 min read'

  return `${Math.max(1, Math.ceil(words / 200))} min read`
}

function formatDate(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleDateString('en-UG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function normaliseArticles(
  payload: unknown,
): HomepageArticle[] {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const root = payload as Record<string, unknown>

  const possibleData =
    root.data ??
    root.articles ??
    root.items

  if (!Array.isArray(possibleData)) {
    return []
  }

  return possibleData.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return []
    }

    const article =
      entry as Record<string, unknown>

    const slug =
      typeof article.slug === 'string'
        ? article.slug.trim()
        : ''

    const title =
      typeof article.title === 'string'
        ? cleanText(article.title)
        : ''

    if (!slug || !title) {
      return []
    }

    const category =
      cleanText(
        article.category ??
          article.categoryName ??
          article.type,
      ) || 'Design Journal'

    const excerpt =
      cleanText(
        article.excerpt ??
          article.summary ??
          article.description,
      ) || title

    const content =
      cleanText(article.content)

    const date =
      formatDate(
        article.publishedAt ??
          article.published_at ??
          article.createdAt ??
          article.created_at,
      )

    const image =
      normaliseImage(
        article.featuredImage ??
          article.featured_image ??
          article.image,
      ) ?? FALLBACK_IMAGE

    return [
      {
        slug,
        category,
        title,
        excerpt,
        date,
        readTime: calculateReadTime(
          content,
        ),
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
    useState<HomepageArticle[]>(
      initialArticles,
    )

  const [isLoading, setIsLoading] =
    useState(
      initialArticles.length === 0,
    )

  const railRef =
    useRef<HTMLDivElement | null>(null)

  const animationFrameRef =
    useRef<number | null>(null)

  const lastFrameTimeRef =
    useRef<number | null>(null)

  const isDraggingRef =
    useRef(false)

  const pointerStartXRef =
    useRef(0)

  const startingScrollLeftRef =
    useRef(0)

  const resumeTimeoutRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null)

  const [isUserInteracting, setIsUserInteracting] =
    useState(false)

  /*
   * Fetch the live Journal records.
   *
   * If the server already supplied articles,
   * we use those and avoid another request.
   */
  useEffect(() => {
    if (initialArticles.length > 0) {
      setArticles(initialArticles)
      setIsLoading(false)
      return
    }

    const controller =
      new AbortController()

    async function loadArticles() {
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
            `Journal request failed: ${response.status}`,
          )
        }

        const payload =
          await response.json()

        const nextArticles =
          normaliseArticles(payload)

        setArticles(nextArticles)
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(
            '[JournalSection] Unable to load articles',
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

    return () => {
      controller.abort()
    }
  }, [initialArticles])

  /*
   * Keep only one duplicated set.
   *
   * The second copy allows the rail to move
   * continuously without reaching an empty end.
   */
  const railArticles = useMemo(
    () => [...articles, ...articles],
    [articles],
  )

  /*
   * Immediately start the continuous movement.
   *
   * There is intentionally:
   *
   * - no hover dependency
   * - no "play" button
   * - no initial user interaction
   */
  useEffect(() => {
    const rail = railRef.current

    if (!rail || articles.length < 2) {
      return
    }

    lastFrameTimeRef.current =
      performance.now()

    const animate = (
      timestamp: number,
    ) => {
      const previous =
        lastFrameTimeRef.current ??
        timestamp

      const delta =
        Math.min(
          timestamp - previous,
          50,
        )

      lastFrameTimeRef.current =
        timestamp

      if (
        !isDraggingRef.current &&
        !isUserInteracting
      ) {
        rail.scrollLeft +=
          (AUTO_SCROLL_SPEED *
            delta) /
          1000
      }

      const loopPoint =
        rail.scrollWidth / 2

      if (
        loopPoint > 0 &&
        rail.scrollLeft >= loopPoint
      ) {
        rail.scrollLeft -= loopPoint
      }

      animationFrameRef.current =
        requestAnimationFrame(
          animate,
        )
    }

    animationFrameRef.current =
      requestAnimationFrame(
        animate,
      )

    return () => {
      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current,
        )
      }

      animationFrameRef.current = null
      lastFrameTimeRef.current = null
    }
  }, [
    articles.length,
    isUserInteracting,
  ])

  /*
   * Clear delayed resume timers.
   */
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(
          resumeTimeoutRef.current,
        )
      }
    }
  }, [])

  const temporarilyPause = useCallback(
    (duration = 450) => {
      setIsUserInteracting(true)

      if (resumeTimeoutRef.current) {
        clearTimeout(
          resumeTimeoutRef.current,
        )
      }

      resumeTimeoutRef.current =
        setTimeout(() => {
          setIsUserInteracting(false)
        }, duration)
    },
    [],
  )

  const moveRail = useCallback(
    (direction: 'left' | 'right') => {
      const rail = railRef.current

      if (!rail) return

      temporarilyPause(800)

      const amount =
        Math.max(
          320,
          Math.min(
            rail.clientWidth * 0.72,
            720,
          ),
        )

      rail.scrollBy({
        left:
          direction === 'right'
            ? amount
            : -amount,
        behavior: 'smooth',
      })
    },
    [temporarilyPause],
  )

  /*
   * Pointer / touch dragging.
   */
  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    const rail = railRef.current

    if (!rail) return

    isDraggingRef.current = true

    setIsUserInteracting(true)

    pointerStartXRef.current =
      event.clientX

    startingScrollLeftRef.current =
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
      pointerStartXRef.current

    rail.scrollLeft =
      startingScrollLeftRef.current -
      distance
  }

  function finishPointerInteraction(
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
     * Resume automatically.
     */
    if (resumeTimeoutRef.current) {
      clearTimeout(
        resumeTimeoutRef.current,
      )
    }

    resumeTimeoutRef.current =
      setTimeout(() => {
        setIsUserInteracting(false)
      }, 250)
  }

  if (isLoading) {
    return (
      <section className="overflow-hidden bg-background py-20 md:py-28 lg:py-32">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <div className="mb-5 h-px w-12 bg-primary" />

              <div className="h-14 w-64 animate-pulse bg-muted/40" />
            </div>
          </div>

          <div className="flex gap-14 overflow-hidden">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="w-[78vw] flex-none sm:w-[55vw] md:w-[42vw] lg:w-[31vw]"
                >
                  <div className="aspect-[4/3] animate-pulse bg-muted/40" />

                  <div className="mt-6 h-3 w-20 animate-pulse bg-muted/40" />

                  <div className="mt-4 h-8 w-4/5 animate-pulse bg-muted/40" />

                  <div className="mt-4 h-5 w-full animate-pulse bg-muted/40" />
                </div>
              ),
            )}
          </div>
        </div>
      </section>
    )
  }

  if (articles.length === 0) {
    return (
      <section className="overflow-hidden bg-background py-20 md:py-28 lg:py-32">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="flex flex-col gap-8 border-y border-border py-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-5 h-px w-12 bg-primary" />

              <h2 className="font-serif text-5xl font-light leading-none text-foreground md:text-6xl lg:text-7xl">
                The Journal
              </h2>

              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                Thoughts on spaces, materials,
                sourcing, and the work of making
                a room feel like your own.
              </p>
            </div>

            <Link
              href="/journal"
              className="inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-primary transition-colors hover:text-foreground"
            >
              Visit the Journal
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden bg-background py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        {/* HEADER */}
        <div className="mb-12 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-5 h-px w-12 bg-primary" />

            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <h2 className="font-serif text-5xl font-light leading-none text-foreground md:text-6xl lg:text-7xl">
                The Journal
              </h2>

              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Spaces / Materials / Living
              </span>
            </div>

            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Thoughts, observations and stories
              from the world of refined living.
            </p>
          </div>

          <div className="flex items-center gap-7">
            <Link
              href="/journal"
              className="inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-primary transition-colors hover:text-foreground"
            >
              View all
              <ArrowRight size={15} />
            </Link>

            <div className="flex items-center">
              <button
                type="button"
                aria-label="Previous journal stories"
                onClick={() =>
                  moveRail('left')
                }
                className="flex size-11 items-center justify-center border-y border-l border-border text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <ArrowLeft size={16} />
              </button>

              <button
                type="button"
                aria-label="Next journal stories"
                onClick={() =>
                  moveRail('right')
                }
                className="flex size-11 items-center justify-center border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* CONTINUOUS EDITORIAL RAIL */}
        <div
          ref={railRef}
          className={[
            'flex gap-14 overflow-x-auto',
            'overscroll-x-contain',
            'pb-5',
            'select-none',
            'touch-pan-y',
            isDraggingRef.current
              ? 'cursor-grabbing'
              : 'cursor-grab',
            '[scrollbar-width:none]',
            '[&::-webkit-scrollbar]:hidden',
          ].join(' ')}
          onPointerDown={
            handlePointerDown
          }
          onPointerMove={
            handlePointerMove
          }
          onPointerUp={
            finishPointerInteraction
          }
          onPointerCancel={
            finishPointerInteraction
          }
        >
          {railArticles.map(
            (article, index) => (
              <Link
                key={`${article.slug}-${index}`}
                href={`/journal/${article.slug}`}
                draggable={false}
                className="group block w-[82vw] flex-none sm:w-[57vw] md:w-[42vw] lg:w-[30vw]"
              >
                <article>
                  {/* IMAGE */}
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
                        onError={(
                          event,
                        ) => {
                          const image =
                            event.currentTarget

                          if (
                            image.src !==
                            FALLBACK_IMAGE
                          ) {
                            image.src =
                              FALLBACK_IMAGE
                          }
                        }}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          The Revamp UG
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CATEGORY */}
                  <div className="mt-6">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-foreground">
                      {article.category}
                    </span>
                  </div>

                  {/* TITLE */}
                  <h3 className="mt-3 max-w-[560px] font-sans text-[25px] font-semibold leading-[1.12] tracking-[-0.025em] text-foreground transition-colors duration-300 group-hover:text-primary sm:text-[28px] lg:text-[30px]">
                    {article.title}
                  </h3>

                  {/* EXCERPT */}
                  <p className="mt-4 max-w-[560px] text-[17px] leading-[1.45] text-muted-foreground">
                    {article.excerpt}
                  </p>

                  {/* DATE / READ TIME */}
                  <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
                    {article.date && (
                      <span>
                        {article.date}
                      </span>
                    )}

                    {article.date &&
                      article.readTime && (
                        <span
                          aria-hidden="true"
                          className="h-1 w-1 rounded-full bg-muted-foreground/50"
                        />
                      )}

                    <span>
                      {article.readTime}
                    </span>
                  </div>
                </article>
              </Link>
            ),
          )}
        </div>

        {/* FOOTER CONTROLS */}
        <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Explore the journal
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

export default JournalSection
