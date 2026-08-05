import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

const questionCategories = [
    {
        category: 'General',
    },
    {
        category: 'Interior Design',
    },
    {
        category: 'Architecture',
    }
    {
        category: 'Global Sourcing',
    }
    {
        category: 'Products & Collections',
    }
    {
        category: 'Orders & Payments',
    }
    {
        category: 'Shipping & Installation',
    }
    {
        category: 'Trade Program',
    },
    {
        category: 'Membership & Loyalty',
    },
    {
        category: 'Returns & Warranties',
    },
    {
        category: 'Contact & Support',
    },
    {
        category: 'Consulting',
    },
]

const defaultFaqs = [
    {
      q: 'What is The Revamp UG?',
      a: 'The Revamp UG is a luxury interior design and architecture studio specializing in thoughtfully designed spaces, globally sourced furnishings, bespoke solutions, and white-glove project delivery. We create timeless residential, commercial, hospitality, and lifestyle environments tailored to every client\'s vision.',
      category: 'General',
    },
    {
      q: 'What is the process for starting a design project with Revamp UG?',
      a: 'The process begins with an initial consultation to understand your needs, followed by a proposal and design plan.',
      category: 'General',
    },
    {
      q: 'How does The Revamp UG source its products and materials?',
      a: 'We have a global network of suppliers and artisans, ensuring high-quality and unique materials for our projects.',
      category: 'Global Sourcing',
    },
    {
        q: 'What are the real goals of a good project?',
        a: 'A strong , secure and functional structure',
        category: 'Design',
    }
]

export default function Faqs() {
    return(
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border/10 bg-gradient-to-br from-background via-background to-muted/20 py-20 md:py-26">
          <div className="mx-auto max-w-5xl px-6 md:px-8 space-y-4">
            <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground">
              Frequently Asked Questions
            </h1>
            <p className="max-w-2xl text-xl text-muted-foreground font-light">
              Find answers to common questions about our design, development, and consulting services.
            </p>
          </div>
        </section>
        {/* Faqs */}
        <section className="py-20 md:py-28 border-b border-border/20 bg-muted/5">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
              <div className="grid md:grid-cols-2 gap-12"></div>
                {defaultFaqs.map(member => (
                  <div key={member.q} className="space-y-4 p-6 rounded-lg border border-border/20 hover:border-primary/20 transition-colors">
                    <p className="text-primary/90 font-medium text-sm ">{member.q}</p>
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