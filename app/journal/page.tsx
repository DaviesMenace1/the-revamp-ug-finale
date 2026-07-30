'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import Link from 'next/link'
import { useState } from 'react'

const articles = [
  {
    id: 1,
    slug: 'the-art-of-minimalism',
    title: 'The Art of Minimalism in Modern Living',
    excerpt: 'Discover how less can truly be more in contemporary interior design. Minimalism isn\'t about emptiness—it\'s about intentionality.',
    category: 'Design Trends',
    author: 'Sarah Chen',
    date: '2024-01-15',
    readTime: '5 min read',
  },
  {
    id: 2,
    slug: 'sustainable-luxury',
    title: 'Sustainable Luxury: The Future of Interior Design',
    excerpt: 'Exploring how eco-conscious choices elevate luxury spaces. Premium materials meet environmental responsibility.',
    category: 'Sustainability',
    author: 'James Wilson',
    date: '2024-01-10',
    readTime: '8 min read',
  },
  {
    id: 3,
    slug: 'color-psychology',
    title: 'Understanding Color Psychology in Spaces',
    excerpt: 'How colors influence mood, perception, and the overall feel of a room. The science behind design decisions.',
    category: 'Design Theory',
    author: 'Emma Rodriguez',
    date: '2024-01-05',
    readTime: '6 min read',
  },
  {
    id: 4,
    slug: 'global-design-influences',
    title: 'Global Design Influences: East Meets West',
    excerpt: 'Travel through design cultures and discover how international styles create stunning modern interiors.',
    category: 'Global Design',
    author: 'David Park',
    date: '2023-12-28',
    readTime: '7 min read',
  },
]

const categories = ['All', 'Design Trends', 'Sustainability', 'Design Theory', 'Global Design']

export default function JournalPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredArticles = selectedCategory === 'All' 
    ? articles 
    : articles.filter(a => a.category === selectedCategory)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Hero */}
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

        {/* Filters */}
        <section className="border-b border-border/20 py-8">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="flex flex-wrap gap-3">
              {categories.map(cat => (
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

        {/* Articles Grid */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map(article => (
                <Link
                  key={article.id}
                  href={`/journal/${article.slug}`}
                  className="group h-full"
                >
                  <article className="space-y-4 cursor-pointer h-full flex flex-col">
                    {/* Image Placeholder */}
                    <div className="relative w-full h-64 bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden group-hover:opacity-80 transition-opacity">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-muted-foreground/40 font-light">Article Image</span>
                      </div>
                    </div>

                    {/* Category & Date */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="uppercase font-medium text-primary/80 tracking-wider">
                        {article.category}
                      </span>
                      <span className="text-muted-foreground font-light">
                        {new Date(article.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="font-serif text-2xl font-light text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-muted-foreground font-light leading-relaxed flex-grow line-clamp-2">
                      {article.excerpt}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm pt-4 border-t border-border/20">
                      <span className="text-muted-foreground font-light">
                        {article.author}
                      </span>
                      <span className="text-primary/70 font-light">
                        {article.readTime}
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-light">
                  No articles in this category yet
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
