import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

const defaultFaqs = [
    {
        q: 'What are the real goals of a good project?',
        a: 'A strong , secure and functional structure',
    }
]

export default function Faqs() {
    return(
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border/20 bg-gradient-to-br from-background via-background to-muted/20 py-24 md:py-32">
          <div className="mx-auto max-w-5xl px-6 md:px-8 space-y-6">
            <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground">
              Frequetly Asked Questions (FAQs)
            </h1>
            <p className="max-w-2xl text-xl text-muted-foreground font-light">
              Transforming spaces and lives through thoughtful design, architecture, and global curation
            </p>
          </div>
        </section>
        </main>
        <SiteFooter/>
    </>
    )
}