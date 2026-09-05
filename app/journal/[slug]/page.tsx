import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { articles } from '@/lib/db/schema'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

async function getArticle(slug: string) { const rows = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1); return rows[0] }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const article = await getArticle(slug); return { title: article ? `${article.slug} - Journal` : 'Journal - The Revamp UG', description: article?.excerpt || 'An entry from The Revamp UG Journal.' } }

export default async function JournalDetail({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const article = await getArticle(slug); if (!article || article.status !== 'published') notFound(); return <><SiteHeader /><main className="bg-canvas px-6 py-16 lg:px-12"><article className="mx-auto max-w-3xl"><Link href="/journal" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gilded">← Journal</Link><p className="mt-12 text-[10px] uppercase tracking-[0.2em] text-gilded">{article.category || 'Journal'}{article.author ? ` · ${article.author}` : ''}</p><h1 className="mt-4 font-serif text-4xl font-medium leading-tight md:text-5xl">{article.title}</h1>{article.excerpt && <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>}{article.featuredImage && <div className="mt-10 overflow-hidden rounded-md"><Image src={article.featuredImage} alt={article.title} width={1200} height={900} className="w-full object-cover" /></div>}<div className="mt-10 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{article.content}</div></article></main><SiteFooter /></> }
