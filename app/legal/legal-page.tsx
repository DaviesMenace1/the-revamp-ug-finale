import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

type LegalPageProps = {
  eyebrow: string
  title: string
  intro: string
  lastUpdated?: string
  showReviewNote?: boolean
  sections: Array<{ heading: string; body: string }>
}

export function LegalPage({
  eyebrow,
  title,
  intro,
  lastUpdated,
  showReviewNote = true,
  sections,
}: LegalPageProps) {
  return (
    <>
      <SiteHeader />
      <main className="bg-canvas">
        <section className="px-6 pb-20 pt-16 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="inline-flex items-center gap-3">
              <span className="h-px w-8 bg-gilded" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gilded">{eyebrow}</span>
            </div>
            <h1 className="mt-6 max-w-4xl font-serif text-5xl font-medium leading-[1.05] md:text-7xl">{title}</h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>
            {lastUpdated && <p className="mt-6 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Last updated: {lastUpdated}</p>}
          </div>
        </section>

        <section className="px-6 pb-32 lg:px-12">
          <div className="mx-auto max-w-3xl border-t border-border pt-10">
            <nav aria-label="Legal pages" className="mb-2 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <Link href="/legal/privacy" className="hover:text-foreground hover:underline">Privacy policy</Link>
              <Link href="/legal/cookies" className="hover:text-foreground hover:underline">Cookie policy</Link>
              <Link href="/legal/terms" className="hover:text-foreground hover:underline">Terms of service</Link>
            </nav>

            {sections.map((section) => (
              <section key={section.heading} className="border-b border-border py-10 last:border-0">
                <h2 className="font-serif text-3xl font-medium md:text-4xl">{section.heading}</h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{section.body}</p>
              </section>
            ))}

            {showReviewNote && <div className="mt-8 rounded-md border border-gilded/30 bg-gilded/5 p-5 text-sm leading-6">These legal pages should be reviewed and approved by The Revamp UG before publication as final legal terms.</div>}
            <Link href="/contact" className="mt-8 inline-flex rounded-full bg-obsidian px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-canvas hover:bg-gilded hover:text-obsidian">Contact the studio</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
