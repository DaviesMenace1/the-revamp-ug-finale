'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

const DEFAULT_IMAGE =
  'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg'

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

export default function JournalListingClient({ articles = [] }: { articles: Article[] }) {
  const categories = useMemo(() => {
    const unique = Array.from(new Set(articles.map((a) => a.category).filter(Boolean))) as string[]
    return ['All', ...unique]
  }, [articles])

  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredArticles =
    selectedCategory === 'All' ? articles : articles.filter((a) => a.category === selectedCategory)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="border-b border-border/20 bg-gradient-to-br from-background via-background to-muted/20 py-24 md:py-32">
          <div className="mx-auto max-w-5xl px-6 md:px-8 space-y-6">
            <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground">
              Journal
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground font-light">
              Insights, inspiration, and stories from our team of designers and architects
            </p>
          </div>
        </section>

        <section className="border-b border-border/20 py-8">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full font-light text-sm transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map((article) => (
                <Link key={article.id} href={`/journal/${article.slug}`} className="group h-full">
                  <article className="space-y-4 cursor-pointer h-full flex flex-col">
                    <div className="relative w-full h-64 rounded-lg overflow-hidden group-hover:opacity-80 transition-opacity">
                      <Image
                        src={article.imageUrl || DEFAULT_IMAGE}
                        alt={article.title || 'Article Image'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="uppercase font-medium text-primary/80 tracking-wider">
                        {article.category || 'Journal'}
                      </span>
                      <span className="text-muted-foreground font-light">
                        {new Date(article.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h2 className="font-serif text-2xl font-light text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h2>

                    <p className="text-muted-foreground font-light leading-relaxed flex-grow line-clamp-2">
                      {article.excerpt}
                    </p>

                    <div className="flex items-center justify-between text-sm pt-4 border-t border-border/20">
                      <span className="text-muted-foreground font-light">{article.author}</span>
                      <span className="text-primary/70 font-light">{article.readTime}</span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-light">No articles in this category yet</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
