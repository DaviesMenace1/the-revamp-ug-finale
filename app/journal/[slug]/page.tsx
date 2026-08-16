import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateArticleSchema } from '@/lib/seo/schema-generator'
import { db } from '@/lib/db/client'
import { articles } from '@/lib/db/schema'
import { eq, ne, and, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const DEFAULT_IMAGE =
  'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg'

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const published = await db
    .select({ slug: articles.slug })
    .from(articles)
    .where(eq(articles.status, 'published'))

  return published.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await db.query.articles.findFirst({ where: eq(articles.slug, slug) })

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'This article could not be found',
    }
  }

  const description = (article.content || article.excerpt || '').substring(0, 160)

  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      publishedTime: (article.publishedAt || article.createdAt).toISOString(),
      authors: article.author ? [article.author] : [],
      tags: article.category ? [article.category] : [],
      images: article.featuredImage ? [{ url: article.featuredImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: article.featuredImage ? [article.featuredImage] : [],
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params

  const article = await db.query.articles.findFirst({ where: eq(articles.slug, slug) })

  if (!article || article.status !== 'published') {
    notFound()
  }

  const sameCategory = article.category
    ? await db
        .select()
        .from(articles)
        .where(
          and(
            eq(articles.status, 'published'),
            eq(articles.category, article.category),
            ne(articles.id, article.id),
          ),
        )
        .orderBy(desc(articles.publishedAt))
        .limit(2)
    : []

  let relatedArticles = sameCategory

  if (relatedArticles.length < 2) {
    const fallback = await db
      .select()
      .from(articles)
      .where(and(eq(articles.status, 'published'), ne(articles.id, article.id)))
      .orderBy(desc(articles.publishedAt))
      .limit(2 - relatedArticles.length + relatedArticles.length)

    const existingIds = new Set(relatedArticles.map((a) => a.id))
    const additional = fallback.filter((a) => !existingIds.has(a.id))
    relatedArticles = [...relatedArticles, ...additional].slice(0, 2)
  }

  const readTime = (content: string | null) => {
    const wordCount = (content || '').split(/\s+/).filter(Boolean).length
    return `${Math.max(1, Math.round(wordCount / 200))} min read`
  }

  const publishedDate = article.publishedAt || article.createdAt

  const articleSchema = generateArticleSchema({
    headline: article.title,
    description: (article.content || article.excerpt || '').substring(0, 160),
    image:
      article.featuredImage ||
      `https://therevampug.com/api/og?title=${encodeURIComponent(article.title)}`,
    datePublished: publishedDate.toISOString(),
    author: article.author || 'The Revamp UG',
    category: article.category || 'Journal',
  })

  const contentParagraphs = (article.content || '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <>
      <SchemaScript schema={articleSchema} />
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="border-b border-border/20 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-6 md:px-8 space-y-6">
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Journal
            </Link>

            <div className="space-y-4">
              <p className="uppercase text-xs font-medium text-primary/80 tracking-wider">
                {article.category || 'Journal'}
              </p>
              <h1 className="font-serif text-5xl md:text-6xl font-light text-foreground leading-tight">
                {article.title}
              </h1>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-light border-t border-border/20 pt-6">
              <span>{article.author}</span>
              <span>•</span>
              <span>
                {publishedDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span>{readTime(article.content)}</span>
            </div>
          </div>
        </section>

        <section className="border-b border-border/20">
          <div className="mx-auto max-w-4xl px-6 md:px-8 py-12">
            <div className="relative w-full h-96 rounded-lg overflow-hidden">
              <Image
                src={article.featuredImage || DEFAULT_IMAGE}
                alt={article.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 896px"
              />
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            <article className="prose prose-lg max-w-none font-light">
              <div className="space-y-6 text-muted-foreground">
                {contentParagraphs.map((paragraph, idx) => (
                  <p key={idx} className="leading-relaxed text-base">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          </div>
        </section>

        {relatedArticles.length > 0 && (
          <section className="border-t border-border/20 py-20 md:py-24 bg-muted/5">
            <div className="mx-auto max-w-7xl px-6 md:px-8">
              <h2 className="font-serif text-4xl font-light text-foreground mb-12">Related Articles</h2>
              <div className="grid gap-8 md:grid-cols-2">
                {relatedArticles.map((related) => (
                  <Link key={related.slug} href={`/journal/${related.slug}`} className="group">
                    <article className="space-y-4 cursor-pointer">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden group-hover:opacity-80 transition-opacity">
                        <Image
                          src={related.featuredImage || DEFAULT_IMAGE}
                          alt={related.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="uppercase font-medium text-primary/80 tracking-wider">
                          {related.category || 'Journal'}
                        </span>
                        <span className="text-muted-foreground font-light">
                          {readTime(related.content)}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-light text-foreground group-hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  )
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
