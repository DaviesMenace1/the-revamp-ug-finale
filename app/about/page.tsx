'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const teamMembers = [
  {
    name: 'Faridah Nakayiwa A.',
    title: 'Founder & Creative Director',
    bio: 'The visionary behind The Revamp UG, blending refined East African craft with world-class design sensibility.',
    image: '/team/faridah-nakayiwa.webp',
  },
  {
    name: 'Davis Musinguzi',
    title: 'Co-Founder & Head of Operations',
    bio: 'Drives flawless delivery across every project, from global sourcing to white-glove installation.',
    image: '/team/davis-musinguzi.jpg',
  },
]

const stats = [
  { number: '120+', label: 'Projects Completed' },
  { number: '14', label: 'Years of Experience' },
  { number: '98%', label: 'Client Satisfaction' },
  { number: '25+', label: 'Countries Sourced From' },
]

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border/20 bg-gradient-to-br from-background via-background to-muted/20 py-24 md:py-32">
          <div className="mx-auto max-w-5xl px-6 md:px-8 space-y-6">
            <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground">
              About Revamp UG
            </h1>
            <p className="max-w-2xl text-xl text-muted-foreground font-light">
              Transforming spaces and lives through thoughtful design, architecture, and global curation
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-20 md:py-28 border-b border-border/20">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <h2 className="font-serif text-4xl font-light text-foreground">Our Story</h2>
                <p className="text-lg text-muted-foreground font-light leading-relaxed">
                  Revamp UG was founded with a simple mission: to bring world-class design and architecture to East Africa. 
                  What started as a dream in Kampala has grown into a full-service design studio serving clients across Uganda, 
                  Kenya, Tanzania, and beyond.
                </p>
                <p className="text-lg text-muted-foreground font-light leading-relaxed">
                  We believe that exceptional design isn't a luxury—it's a necessity. Every project, from residential apartments 
                  to commercial spaces, deserves thoughtful design, quality materials, and meticulous execution.
                </p>
              </div>
              <div className="h-96 bg-gradient-to-br from-muted to-muted/50 rounded-lg" />
            </div>
          </div>
        </section>

        {/* Mission & Values */}
        <section className="py-20 md:py-28 border-b border-border/20 bg-muted/5">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="grid md:grid-cols-2 gap-16">
              <div className="space-y-4">
                <h3 className="font-serif text-3xl font-light text-foreground">Our Mission</h3>
                <p className="text-muted-foreground font-light leading-relaxed">
                  To create exceptional spaces that inspire, function beautifully, and reflect the unique personalities 
                  and aspirations of our clients. We combine international design expertise with local knowledge to deliver 
                  truly transformative projects.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="font-serif text-3xl font-light text-foreground">Our Values</h3>
                <ul className="space-y-3">
                  {['Quality & Craftsmanship', 'Client-Centered Design', 'Global Vision, Local Touch', 'Sustainable Practices'].map(
                    value => (
                      <li key={value} className="flex items-start gap-3">
                        <span className="text-primary/60 mt-1">•</span>
                        <span className="text-muted-foreground font-light">{value}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 md:py-28 border-b border-border/20">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {stats.map(stat => (
                <div key={stat.label} className="space-y-2">
                  <p className="font-serif text-5xl font-light text-primary">{stat.number}</p>
                  <p className="text-muted-foreground font-light">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 md:py-28 border-b border-border/20 bg-muted/5">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <h2 className="font-serif text-4xl font-light text-foreground mb-16 text-center">Meet Our Team</h2>
            <div className="grid md:grid-cols-2 gap-12">
              {teamMembers.map(member => (
                <div key={member.name} className="space-y-4 p-6 rounded-lg border border-border/20 hover:border-primary/20 transition-colors">
                  <div className="relative h-80 overflow-hidden rounded-lg mb-4 bg-gradient-to-br from-muted to-muted/50">
                    {member.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.image || "/placeholder.svg"}
                        alt={`Portrait of ${member.name}`}
                        className="absolute inset-0 h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-serif text-5xl font-light text-primary/40">
                          {member.name
                            .split(' ')
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-serif text-2xl font-light text-foreground">{member.name}</h3>
                  <p className="text-primary/80 font-medium text-sm uppercase tracking-wider">{member.title}</p>
                  <p className="text-muted-foreground font-light leading-relaxed">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-24">
          <div className="mx-auto max-w-3xl px-6 md:px-8 text-center space-y-8">
            <div className="space-y-4">
              <h2 className="font-serif text-4xl font-light text-foreground">
                Let's Create Something Beautiful Together
              </h2>
              <p className="text-lg text-muted-foreground font-light">
                Ready to transform your space? Get in touch with our team.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-light text-base px-8 py-6"
              >
                <Link href="/book-consultation">Book Consultation</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-none font-light text-base px-8 py-6"
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
