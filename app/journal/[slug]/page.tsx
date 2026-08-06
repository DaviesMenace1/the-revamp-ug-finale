import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateArticleSchema } from '@/lib/seo/schema-generator'

const articles: Record<string, any> = {
  'the-art-of-minimalism': {
    title: 'The Art of Minimalism in Modern Living',
    author: 'Sarah Chen',
    date: '2024-01-15',
    category: 'Design Trends',
    readTime: '5 min read',
    content: `
      <p>Minimalism has become more than a design trend—it's a lifestyle philosophy that resonates deeply with contemporary living. In our quest for clarity and purpose, we're discovering that l[...]
      
      <h3>The Philosophy Behind Minimalism</h3>
      <p>Minimalism isn't about emptiness or cold spaces. Rather, it's about intentionality. Every object, color, and element serves a purpose. It's a celebration of what matters most.</p>
      
      <h3>Key Principles</h3>
      <ul>
        <li>Functionality: Every piece must serve a clear purpose</li>
        <li>Quality over quantity: Invest in fewer, better pieces</li>
        <li>Negative space: Allow rooms to breathe</li>
        <li>Neutral palettes: Create calm through color restraint</li>
      </ul>
      
      <p>When we embrace minimalism thoughtfully, we create spaces that feel organized, calm, and deeply personal.</p>
    `,
  },
  'sustainable-luxury': {
    title: 'Sustainable Luxury: The Future of Interior Design',
    author: 'James Wilson',
    date: '2024-01-10',
    category: 'Sustainability',
    readTime: '8 min read',
    content: `
      <p>The future of luxury design is sustainable. High-end materials and eco-conscious choices are no longer mutually exclusive—they're becoming the new standard.</p>
      
      <h3>Why Sustainable Luxury Matters</h3>
      <p>Today's conscious consumers demand more than aesthetics. They want to know that their purchases align with their values. Sustainable luxury meets this demand.</p>
      
      <h3>Materials Making the Difference</h3>
      <ul>
        <li>Reclaimed wood and materials</li>
        <li>Organic textiles and fabrics</li>
        <li>Responsibly sourced leather</li>
        <li>Non-toxic, eco-friendly finishes</li>
      </ul>
      
      <p>Premium doesn't mean wasteful. It means thoughtful, beautiful, and responsible.</p>
    `,
  },
  'color-psychology': {
    title: 'Understanding Color Psychology in Spaces',
    author: 'Emma Rodriguez',
    date: '2024-01-05',
    category: 'Design Theory',
    readTime: '6 min read',
    content: `
      <p>Color is one of the most powerful tools in interior design. It influences our mood, perception, and overall wellbeing. Understanding color psychology can transform any space.</p>
      
      <h3>The Science of Color</h3>
      <p>Colors trigger psychological and emotional responses. Warm colors energize, while cool colors calm. The hue, saturation, and brightness all play crucial roles.</p>
      
      <h3>Color Strategies for Different Spaces</h3>
      <ul>
        <li>Bedrooms: Soft, cool tones for relaxation</li>
        <li>Living rooms: Warm, inviting palettes</li>
        <li>Kitchens: Energizing but not overwhelming</li>
        <li>Offices: Focused, professional tones</li>
      </ul>
      
      <p>The right color palette can make a space feel larger, cozier, more professional, or more playful—all without changing a single piece of furniture.</p>
    `,
  },
  'global-design-influences': {
    title: 'Global Design Influences: East Meets West',
    author: 'David Park',
    date: '2023-12-28',
    category: 'Global Design',
    readTime: '7 min read',
    content: `
      <p>The most compelling modern interiors blend design traditions from around the world. When executed thoughtfully, global influences create rich, layered spaces with depth and character.</p>
      
      <h3>East Meets West: A Harmonious Balance</h3>
      <p>Scandinavian minimalism pairs beautifully with Japanese Zen principles. Mid-century modern design complements Moroccan textiles. The key is intention and balance.</p>
      
      <h3>Design Traditions Worth Exploring</h3>
      <ul>
        <li>Scandinavian: Clean lines, functionality, natural materials</li>
        <li>Japanese: Zen minimalism, natural elements, negative space</li>
        <li>Moroccan: Rich textures, warm colors, ornamental details</li>
        <li>Mid-Century Modern: Bold shapes, organic forms, quality materials</li>
      </ul>
      
      <p>Our globalized world offers endless inspiration. The most beautiful spaces are those that respectfully incorporate influences from multiple cultures.</p>
    `,
  },
}

interface ArticlePageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  return Object.keys(articles).map((slug) => ({
    slug,
  }))
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const article = articles[params.slug]

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'This article could not be found',
    }
  }

  return {
    title: article.title,
    description: article.content.substring(0, 160),
    openGraph: {
      title: article.title,
      description: article.content.substring(0, 160),
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
      tags: [article.category],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.content.substring(0, 160),
    },
  }
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const article = articles[params.slug]

  if (!article) {
    notFound()
  }

  const articleSchema = generateArticleSchema({
    headline: article.title,
    description: article.content.substring(0, 160),
    image: `https://therevampug.com/api/og?title=${encodeURIComponent(article.title)}`,
    datePublished: article.date,
    author: article.author,
    category: article.category,
  })

  return (
    <>
      <SchemaScript schema={articleSchema} />
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Article Hero */}
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
                {article.category}
              </p>
              <h1 className="font-serif text-5xl md:text-6xl font-light text-foreground leading-tight">
                {article.title}
              </h1>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-light border-t border-border/20 pt-6">
              <span>{article.author}</span>
              <span>•</span>
              <span>
                {new Date(article.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span>{article.readTime}</span>
            </div>
          </div>
        </section>

        {/* Featured Image */}
        <section className="border-b border-border/20">
          <div className="mx-auto max-w-4xl px-6 md:px-8 py-12">
            <div className="w-full h-96 bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground/40 font-light">Article Featured Image</span>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            <article className="prose prose-lg max-w-none font-light">
              <div className="space-y-6 text-muted-foreground">
                {article.content.split('\n').map((line: string, idx: number) => {
                  if (line.trim().startsWith('<h3>')) {
                    const title = line.replace(/<h3>|<\/h3>/g, '').trim()
                    return (
                      <h3 key={idx} className="font-serif text-2xl font-light text-foreground mt-8 mb-4">
                        {title}
                      </h3>
                    )
                  }
                  if (line.trim().startsWith('<p>')) {
                    const text = line.replace(/<p>|<\/p>/g, '').trim()
                    return (
                      <p key={idx} className="leading-relaxed text-base">
                        {text}
                      </p>
                    )
                  }
                  if (line.trim().startsWith('<ul>') || line.trim().startsWith('<li>')) {
                    return null
                  }
                  return null
                })}

                {/* Bullet Points */}
                <ul className="space-y-2 list-none">
                  <li className="flex gap-3">
                    <span className="text-primary/60">•</span>
                    <span>Functionality: Every piece must serve a clear purpose</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary/60">•</span>
                    <span>Quality over quantity: Invest in fewer, better pieces</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary/60">•</span>
                    <span>Negative space: Allow rooms to breathe</span>
                  </li>
                </ul>

                <p className="leading-relaxed text-base">
                  When we embrace thoughtful design principles, we create spaces that feel organized, calm, and deeply personal.
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* Related Articles */}
        <section className="border-t border-border/20 py-20 md:py-24 bg-muted/5">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <h2 className="font-serif text-4xl font-light text-foreground mb-12">Related Articles</h2>
            <div className="grid gap-8 md:grid-cols-2">
              {['the-art-of-minimalism', 'sustainable-luxury'].map(slug => {
                if (slug === params.slug) return null
                const relatedArticle = articles[slug]
                return (
                  <Link key={slug} href={`/journal/${slug}`} className="group">
                    <article className="space-y-4 cursor-pointer">
                      <div className="h-48 bg-gradient-to-br from-muted to-muted/50 rounded-lg group-hover:opacity-80 transition-opacity" />
                      <h3 className="font-serif text-xl font-light text-foreground group-hover:text-primary transition-colors">
                        {relatedArticle.title}
                      </h3>
                      <p className="text-sm text-muted-foreground font-light">
                        {relatedArticle.category}
                      </p>
                    </article>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
