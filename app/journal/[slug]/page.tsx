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

const DEFAULT_IMAGE = 'https://res.cloudinary.com/r8epy5mg/image/upload/v1785487048/IMG_3277_1_llqjlz.jpg'
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

function getArticleImages(value: unknown): string[] {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    let candidate: unknown = trimmed
    for (let i = 0; i < 2; i += 1) {
      if (typeof candidate !== 'string') break
      try { candidate = JSON.parse(candidate) } catch { break }
    }
    if (Array.isArray(candidate)) return candidate.filter((item): item is string => typeof item === 'string' && /^https?:\/\//i.test(item.trim())).map((item) => item.trim())
    return typeof candidate === 'string' && /^https?:\/\//i.test(candidate) ? [candidate] : []
  }
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && /^https?:\/\//i.test(item.trim())).map((item) => item.trim())
  return []
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await db.query.articles.findFirst({ where: eq(articles.slug, slug) })
  if (!article || article.status !== 'published') return { title: 'Article Not Found', description: 'This article could not be found' }
  const description = (article.content || article.excerpt || '').substring(0, 160)
  const canonical = `${SITE_URL}/journal/${encodeURIComponent(article.slug)}`
  const image = getArticleImages(article.featuredImage)[0]
  return {
    title: article.title,
    alternates: { canonical },
    description,
    openGraph: { title: article.title, description, type: 'article', url: canonical, publishedTime: (article.publishedAt || article.createdAt).toISOString(), authors: article.author ? [article.author] : [], tags: article.category ? [article.category] : [], images: image ? [{ url: image }] : [] },
    twitter: { card: 'summary_large_image', title: article.title, description, images: image ? [image] : [] },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await db.query.articles.findFirst({ where: eq(articles.slug, slug) })
  if (!article || article.status !== 'published') notFound()

  const sameCategory = article.category
    ? await db.select().from(articles).where(and(eq(articles.status, 'published'), eq(articles.category, article.category), ne(articles.id, article.id))).orderBy(desc(articles.publishedAt)).limit(2)
    : []

  let relatedArticles = sameCategory
  if (relatedArticles.length < 2) {
    const fallback = await db.select().from(articles).where(and(eq(articles.status, 'published'), ne(articles.id, article.id))).orderBy(desc(articles.publishedAt)).limit(2)
    const existingIds = new Set(relatedArticles.map((a) => a.id))
    relatedArticles = [...relatedArticles, ...fallback.filter((a) => !existingIds.has(a.id))].slice(0, 2)
  }

  const readTime = (content: string | null) => `${Math.max(1, Math.round((content || '').split(/\s+/).filter(Boolean).length / 200))} min read`
  const publishedDate = article.publishedAt || article.createdAt
  const articleImages = getArticleImages(article.featuredImage)
  const heroImage = articleImages[0] || DEFAULT_IMAGE
  const articleSchema = generateArticleSchema({ headline: article.title, description: (article.content || article.excerpt || '').substring(0, 160), image: heroImage, datePublished: publishedDate.toISOString(), author: article.author || 'The Revamp UG', category: article.category || 'Journal', options: { url: `${SITE_URL}/journal/${encodeURIComponent(article.slug)}`, datePublished: publishedDate.toISOString() } })
  const contentParagraphs = (article.content || '').replace(/\\n/g, '\n').split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean)

  return (
    <>
      <SchemaScript schema={articleSchema} />
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="border-b border-border/20 py-16 md:py-20">
          <div className="mx-auto max-w-4xl space-y-6 px-6 md:px-8">
            <Link href="/journal" className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground transition-colors hover:text-foreground">← Back to Journal</Link>
            <div className="space-y-4">
              <p className="uppercase text-xs font-medium tracking-[0.18em] text-primary/80">{article.category || 'Journal'}</p>
              <h1 className="font-serif text-5xl font-light leading-[1.03] text-foreground md:text-7xl">{article.title}</h1>
            </div>
            <div className="flex flex-wrap gap-4 border-t border-border/20 pt-6 text-sm font-light text-muted-foreground"><span>{article.author || 'The Revamp UG'}</span><span>•</span><span>{publishedDate.toLocaleDateString('en-UG', { month: 'long', day: 'numeric', year: 'numeric' })}</span><span>•</span><span>{readTime(article.content)}</span></div>
          </div>
        </section>

        <section className="border-b border-border/20">
          <div className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-14">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted"><Image src={heroImage} alt={article.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 1152px" /></div>
            {articleImages.length > 1 && <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">{articleImages.slice(1, 4).map((image, index) => <div key={`${image}-${index}`} className="relative aspect-[4/3] overflow-hidden bg-muted"><Image src={image} alt={`${article.title} image ${index + 2}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" /></div>)}</div>}
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6 md:px-8"><article className="space-y-8 text-[1.08rem] leading-8 text-muted-foreground md:text-[1.15rem] md:leading-9">{contentParagraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}</article></div>
        </section>

        {relatedArticles.length > 0 && <section className="border-t border-border/20 bg-muted/5 py-20 md:py-24"><div className="mx-auto max-w-7xl px-6 md:px-8"><div className="mb-12 flex items-end justify-between gap-6"><h2 className="font-serif text-4xl font-light text-foreground md:text-5xl">Continue Reading</h2><Link href="/journal" className="hidden items-center gap-2 text-xs uppercase tracking-[0.16em] text-primary sm:inline-flex">All articles <ArrowRight className="size-4" /></Link></div><div className="grid gap-8 md:grid-cols-2">{relatedArticles.map((related) => { const relatedImage = getArticleImages(related.featuredImage)[0] || DEFAULT_IMAGE; return <Link key={related.slug} href={`/journal/${related.slug}`} className="group"><article className="space-y-4"><div className="relative aspect-[16/9] overflow-hidden bg-muted"><Image src={relatedImage} alt={related.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" /></div><div className="flex items-center justify-between text-xs"><span className="uppercase font-medium tracking-[0.16em] text-primary/80">{related.category || 'Journal'}</span><span className="font-light text-muted-foreground">{readTime(related.content)}</span></div><h3 className="font-serif text-2xl font-light leading-snug text-foreground transition-colors group-hover:text-primary">{related.title}</h3></article></Link> })}</div></div></section>}
      </main>
      <SiteFooter />
    </>
  )
}
