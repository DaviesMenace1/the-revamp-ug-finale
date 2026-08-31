'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowUpRight } from '@/components/ui/luxury-icons'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { cn } from '@/lib/utils'

const DEFAULT_IMAGE = 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg'

type Article = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  category: string | null
  author: string | null
  date: string
  readTime: string
  imageUrl: string | null
}

function dateLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-UG', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function ArticleImage({ article, className, sizes }: { article: Article; className?: string; sizes: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-canvas-dark', className)}>
      <Image
        src={article.imageUrl || DEFAULT_IMAGE}
        alt={article.title || 'Journal article image'}
        fill
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        sizes={sizes}
      />
    </div>
  )
}

function ArticleMeta({ article, dark = false }: { article: Article; dark?: boolean }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] uppercase tracking-[0.18em]', dark ? 'text-white/55' : 'text-foreground/55')}>
      <span>{article.category || 'Journal'}</span>
      <span aria-hidden="true" className={dark ? 'text-white/25' : 'text-foreground/25'}>·</span>
      <span>{dateLabel(article.date)}</span>
      <span aria-hidden="true" className={dark ? 'text-white/25' : 'text-foreground/25'}>·</span>
      <span>{article.readTime}</span>
    </div>
  )
}

function EditorialLink({ href, children, dark = false }: { href: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <Link href={href} className={cn('group inline-flex min-h-11 items-center gap-2 border-b pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors', dark ? 'border-white/35 text-white hover:border-gold hover:text-gold' : 'border-foreground/35 text-foreground hover:border-gold hover:text-gold')}>
      {children}
      <ArrowUpRight size={14} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}

export default function JournalListingClient({ articles = [] }: { articles: Article[] }) {
  const categories = useMemo(() => {
    const unique = Array.from(new Set(articles.map((article) => article.category).filter(Boolean))) as string[]
    return ['All', ...unique]
  }, [articles])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const filteredArticles = useMemo(() => selectedCategory === 'All' ? articles : articles.filter((article) => article.category === selectedCategory), [articles, selectedCategory])
  const [featured, ...secondary] = filteredArticles

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background text-foreground">
        <section className="bg-obsidian px-5 pb-14 pt-28 text-white sm:px-8 sm:pb-20 sm:pt-36 lg:px-12 lg:pb-28">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">The Revamp House · Journal</p>
              <h1 className="mt-5 max-w-4xl font-serif text-[clamp(4rem,10vw,9rem)] font-light leading-[0.82] tracking-[-0.04em]">Editorial<br /><span className="italic text-gold-light">perspectives.</span></h1>
            </div>
            <div className="max-w-xl border-t border-white/20 pt-6 lg:mb-1">
              <p className="max-w-lg text-sm leading-7 text-white/70 sm:text-base">Notes on architecture, interiors, objects and the quiet decisions that make a space feel complete.</p>
              <div className="mt-7 flex flex-wrap items-center gap-6"><EditorialLink href="#journal-feed" dark>Explore the journal</EditorialLink><span className="text-[10px] uppercase tracking-[0.18em] text-white/45">{articles.length} {articles.length === 1 ? 'story' : 'stories'}</span></div>
            </div>
          </div>
        </section>

        <section className="border-b border-foreground/15 bg-background px-5 py-5 sm:px-8 lg:px-12" aria-label="Filter journal categories">
          <div className="mx-auto flex max-w-[1440px] items-center gap-5 overflow-x-auto scrollbar-none">
            <span className="shrink-0 text-[10px] uppercase tracking-[0.22em] text-foreground/55">Browse by</span>
            <div className="flex items-center gap-5">
              {categories.map((category) => (
                <button key={category} type="button" onClick={() => setSelectedCategory(category)} className={cn('shrink-0 border-b pb-1 text-[10px] uppercase tracking-[0.18em] transition-colors', selectedCategory === category ? 'border-gold text-foreground' : 'border-transparent text-foreground/55 hover:text-foreground')}>
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {featured ? (
          <>
            <section className="bg-background px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
              <div className="mx-auto max-w-[1440px]">
                <div className="mb-8 flex items-end justify-between gap-6 border-b border-foreground/15 pb-6"><div><p className="text-[10px] uppercase tracking-[0.28em] text-foreground/55">Featured story</p><h2 className="mt-3 font-serif text-4xl font-light leading-none sm:text-6xl">In focus.</h2></div><span className="hidden text-[10px] uppercase tracking-[0.18em] text-foreground/60 sm:block">Latest from the studio</span></div>
                <Link href={`/journal/${encodeURIComponent(featured.slug)}`} className="group grid gap-7 md:grid-cols-[1.25fr_0.75fr] md:items-end md:gap-12">
                  <ArticleImage article={featured} className="aspect-[5/4] sm:aspect-[16/10]" sizes="(max-width: 768px) 100vw, 70vw" />
                  <div className="md:pb-2"><ArticleMeta article={featured} /><h3 className="mt-4 max-w-xl font-serif text-4xl font-light leading-[0.9] transition-colors group-hover:text-gold sm:text-6xl">{featured.title}</h3>{featured.excerpt && <p className="mt-5 max-w-md text-sm leading-7 text-foreground/65">{featured.excerpt}</p>}<span className="mt-7 inline-flex min-h-11 items-center gap-2 border-b border-foreground/35 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors group-hover:border-gold group-hover:text-gold">Read story <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></div>
                </Link>
              </div>
            </section>

            {secondary.length > 0 && <section id="journal-feed" className="border-y border-foreground/10 bg-canvas dark:bg-background px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-32"><div className="mx-auto max-w-[1440px]"><div className="mb-9 flex items-end justify-between gap-6"><div><p className="text-[10px] uppercase tracking-[0.28em] text-foreground/55">The archive</p><h2 className="mt-3 font-serif text-4xl font-light leading-none sm:text-6xl">More to explore.</h2></div><span className="hidden text-[10px] uppercase tracking-[0.18em] text-foreground/60 sm:block">Ideas worth returning to</span></div><div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 md:gap-y-14">{secondary.map((article, index) => <Link key={article.id} href={`/journal/${encodeURIComponent(article.slug)}`} className={cn('group block', index % 3 === 1 && 'mt-8 md:mt-14', index % 3 === 2 && 'md:-mt-4')}><ArticleImage article={article} className={cn('aspect-[4/5]', index % 3 === 0 && 'aspect-[5/6]')} sizes="(max-width: 768px) 50vw, 33vw" /><div className="mt-4"><ArticleMeta article={article} /><h3 className="mt-2 font-serif text-2xl font-light leading-[0.95] transition-colors group-hover:text-gold sm:text-3xl">{article.title}</h3>{article.excerpt && <p className="mt-3 line-clamp-2 text-xs leading-5 text-foreground/60">{article.excerpt}</p>}<span className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-foreground/65 transition-colors group-hover:text-gold">Continue reading <ArrowRight size={13} aria-hidden="true" /></span></div></Link>)}</div></div></section>}
          </>
        ) : (
          <section id="journal-feed" className="px-5 py-24 text-center sm:px-8 sm:py-32"><p className="font-serif text-4xl font-light">The journal is taking shape.</p><p className="mx-auto mt-4 max-w-md text-sm leading-7 text-foreground/60">New perspectives from the studio will appear here as they are published.</p><Link href="/contact" className="mt-7 inline-flex text-[10px] uppercase tracking-[0.18em] text-foreground underline underline-offset-4">Speak with the studio</Link></section>
        )}

        <section className="bg-foreground px-5 py-20 text-background sm:px-8 sm:py-28 lg:px-12 lg:py-36"><div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-[1fr_0.65fr] md:items-end"><div><p className="text-[10px] uppercase tracking-[0.28em] text-background/55">Keep looking</p><blockquote className="mt-5 max-w-4xl font-serif text-4xl font-light leading-[0.95] sm:text-6xl">A room becomes memorable through the decisions you almost miss.</blockquote></div><div className="md:pb-1"><p className="max-w-sm text-sm leading-7 text-background/65">The journal is a record of those decisions in material, proportion, light and use.</p><div className="mt-7"><EditorialLink href="/services" dark>Explore the practice</EditorialLink></div></div></div></section>
      </main>
      <SiteFooter />
    </>
  )
}
