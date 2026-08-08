'use client'

import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Form submission logic here
    console.log('Form submitted:', formState)
    setFormState({ name: '', email: '', phone: '', message: '' })
  }

  return (
    <>
      <SiteHeader />
      <br />
      <br />
      <br />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border/20 bg-gradient-to-br from-background via-background to-muted/20 py-6 md:py-8">
          <div className="mx-auto max-w-5xl px-6 md:px-8 space-y-6">
            <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground">
              Get in Touch
            </h1>
          </div>
        </section>

        {/* Description and Contact Form */}
        <section className="py-28 md:py-28">
          <div className="mx-auto max-w-3xl px-6 md:px-8">
            <div className="space-y-12">
              <p className="max-w-2xl text-lg text-muted-foreground font-light">
                Let's discuss your project and explore how we can transform your space
              </p>

              <div>
                <h2 className="font-serif text-3xl font-light text-foreground mb-8">Contact Information</h2>
                <div className="grid md:grid-cols-3 gap-8 mb-14">
                  <div>
                    <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-2">Address</p>
                    <p className="text-muted-foreground font-light">
                      Plot 12, Kyanja<br />
                      Kampala, Uganda
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-2">Phone</p>
                    <p className="text-muted-foreground font-light">
                      <a href="tel:+256703861668" className="hover:text-primary transition-colors">
                        +256 (0) 703 861 668
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary/80 uppercase tracking-wider mb-2">Email</p>
                    <p className="text-muted-foreground font-light">
                      <a href="mailto:support@revampug.com" className="hover:text-primary transition-colors">
                        support@revampug.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-3">
                    Name
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

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-3">
                    Email
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
                    Phone (Optional)
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formState.phone}
                    onChange={handleChange}
                    placeholder="+256 (0) 700 000 000"
                    className="rounded-none border-muted"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-3">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formState.message}
                    onChange={handleChange}
                    placeholder="Tell us about your project..."
                    rows={6}
                    className="rounded-none border-muted resize-none font-light"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-light text-base"
                >
                  Send Message
                </Button>
              </form>

              <div>
                <h3 className="font-serif text-2xl font-light text-foreground mb-6">Business Hours</h3>
                <div className="space-y-2 text-muted-foreground font-light">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                  <p>Saturday: 10:00 AM - 4:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>

              <div>
                <h3 className="font-serif text-2xl font-light text-foreground mb-6">Follow Us</h3>
                <div className="flex gap-4">
                  {['Instagram', 'Facebook', 'LinkedIn'].map(platform => (
                    <a
                      key={platform}
                      href="#"
                      className="text-muted-foreground hover:text-primary transition-colors font-light"
                    >
                      {platform}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
