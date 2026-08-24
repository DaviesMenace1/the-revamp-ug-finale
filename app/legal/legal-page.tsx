import Link from 'next/link'

export function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string
  title: string
  intro: string
  sections: Array<{ heading: string; body: string }>
}) {
  return (
    <main className="min-h-screen bg-background px-6 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary hover:underline">
          The Revamp UG
        </Link>
        <p className="mt-16 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight text-foreground md:text-7xl">{title}</h1>
        <p className="mt-8 max-w-2xl text-base leading-7 text-muted-foreground">{intro}</p>
        <div className="mt-12 space-y-10 border-t border-border/70 pt-10">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-2xl text-foreground md:text-3xl">{section.heading}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-14 border border-gold/30 bg-gold/5 p-5 text-sm leading-6 text-foreground">
          These pages are working website copy and should be reviewed and approved by The Revamp UG before publication as final legal terms.
        </div>
        <Link href="/contact" className="mt-8 inline-flex min-h-11 items-center rounded border border-border px-4 text-sm font-medium transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          Contact The Revamp UG
        </Link>
      </div>
    </main>
  )
}
