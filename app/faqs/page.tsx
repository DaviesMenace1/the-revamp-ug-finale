import { db } from '@/lib/db/client'
import { faqs } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import { safeQuery } from '@/lib/server/safe-query'
import { SchemaScript } from '@/components/seo/schema-script'
import FaqsClient, { type FAQ } from './faqs-client'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://therevampug.com').replace(/\/$/, '')

export default async function FaqsPage() {
  const result = await safeQuery(
    db
      .select({ id: faqs.id, category: faqs.category, question: faqs.question, answer: faqs.answer })
      .from(faqs)
      .where(eq(faqs.status, 'published'))
      .orderBy(asc(faqs.order), asc(faqs.createdAt))
      .limit(200),
    'published FAQs',
    [],
  )
  const publishedFaqs = result.data as FAQ[]
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: 'Frequently Asked Questions | The Revamp UG',
    url: `${SITE_URL}/faqs`,
    mainEntity: publishedFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <>
      <SchemaScript schema={faqSchema} />
      <FaqsClient faqs={publishedFaqs} />
    </>
  )
}
