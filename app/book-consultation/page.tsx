'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'

export default function BookConsultationPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    projectType: '',
    preferredDate: '',
    message: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Consultation booked:', formState)
    setFormState({
      name: '',
      email: '',
      phone: '',
      projectType: '',
      preferredDate: '',
      message: '',
    })
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border/20 bg-gradient-to-br from-background via-background to-muted/20 py-24 md:py-32">
          <div className="mx-auto max-w-5xl px-6 md:px-8 space-y-6">
            <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground">
              Book Your Consultation
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground font-light">
              Let's discuss your project and explore how we can transform your space
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            <div className="space-y-12">
              {/* Info */}
              <div className="grid md:grid-cols-3 gap-8 pb-12 border-b border-border/20">
                <div>
                  <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-2">Duration</p>
                  <p className="text-muted-foreground font-light">60 minutes</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-2">Location</p>
                  <p className="text-muted-foreground font-light">In-person or Virtual</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-2">Investment</p>
                  <p className="text-muted-foreground font-light">Complimentary</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-3">
                    Full Name <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formState.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="rounded-none border-muted"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-3">
                      Email <span className="text-primary">*</span>
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formState.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="rounded-none border-muted"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-3">
                      Phone Number <span className="text-primary">*</span>
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formState.phone}
                      onChange={handleChange}
                      placeholder="+256 (0) 700 000 000"
                      className="rounded-none border-muted"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="projectType" className="block text-sm font-medium text-foreground mb-3">
                    Project Type <span className="text-primary">*</span>
                  </label>
                  <select
                    id="projectType"
                    name="projectType"
                    value={formState.projectType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-muted bg-background text-foreground rounded-none font-light focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  >
                    <option value="">Select a project type</option>
                    <option value="residential">Residential Design</option>
                    <option value="commercial">Commercial Design</option>
                    <option value="architecture">Architecture</option>
                    <option value="sourcing">Furniture Sourcing</option>
                    <option value="renovation">Renovation & Restoration</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="preferredDate" className="block text-sm font-medium text-foreground mb-3">
                    Preferred Consultation Date <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="preferredDate"
                    name="preferredDate"
                    type="date"
                    value={formState.preferredDate}
                    onChange={handleChange}
                    className="rounded-none border-muted"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-3">
                    Tell us about your project
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formState.message}
                    onChange={handleChange}
                    placeholder="Share details about your project, vision, or any specific requirements..."
                    rows={6}
                    className="rounded-none border-muted resize-none font-light"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-light text-base py-6"
                >
                  Book Consultation
                </Button>

                <p className="text-center text-sm text-muted-foreground font-light">
                  We'll confirm your consultation within 24 hours
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 md:py-24 border-t border-border/20 bg-muted/5">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            <h2 className="font-serif text-4xl font-light text-foreground mb-12 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: 'What should I prepare for the consultation?',
                  a: 'Bring photos of your space, inspiration images, and a general budget range if available.',
                },
                {
                  q: 'Is the consultation really free?',
                  a: 'Yes, our initial consultation is complimentary. We offer it to understand your vision and needs.',
                },
                {
                  q: 'How far in advance should I book?',
                  a: 'We typically have availability within 2-3 weeks. Book at your earliest convenience.',
                },
                {
                  q: 'Can I do a virtual consultation?',
                  a: 'Absolutely! We offer both in-person and virtual consultations via video call.',
                },
              ].map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="font-serif text-lg font-light text-foreground">{item.q}</h3>
                  <p className="text-muted-foreground font-light leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
