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
        {/* Faqs */}
        <section className="py-20 md:py-28 border-b border-border/20 bg-muted/5">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
              <div className="grid md:grid-cols-2 gap-12"></div>
                {defaultFaqs.map(member => (
                  <div key={member.q} className="space-y-4 p-6 rounded-lg border border-border/20 hover:border-primary/20 transition-colors">
                    <p className="text-primary/50 font-medium text-sm ">{member.q}</p>
                  <p className="text-muted-foreground font-light leading-relaxed">{member.a}</p>
                    </div>
                ))}
              </div>
          </section>
        </main>
        <SiteFooter/>
    </>
    )
}