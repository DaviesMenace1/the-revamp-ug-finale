'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { submitServiceRequest } from '@/lib/actions/service-request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Check, Armchair, Sofa, Home, Lightbulb, Palette, FileText, ArrowRight, Sparkles } from '@/components/ui/luxury-icons'

const serviceTypes = [
  { id: 'custom-furniture', label: 'Custom Furniture', icon: Armchair, description: 'Bespoke pieces tailored to your space' },
  { id: 'upholstery', label: 'Custom Upholstery', icon: Sofa, description: 'Premium fabric and material selection' },
  { id: 'cabinetry', label: 'Custom Cabinetry', icon: Home, description: 'Built-in storage solutions' },
  { id: 'lighting', label: 'Custom Lighting', icon: Lightbulb, description: 'Bespoke lighting designs' },
  { id: 'styling', label: 'Interior Styling', icon: Palette, description: 'Complete space design package' },
  { id: 'other', label: 'Other', icon: FileText, description: 'Tell us what you need' },
]

function CustomServicesForm() {
  const searchParams = useSearchParams()
  const requestedService = searchParams.get('service')?.trim() || ''
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: '',
    budget: '',
    timeline: '',
    description: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!requestedService) return
    setSelectedService(requestedService)
    setFormData((current) => ({ ...current, serviceType: requestedService }))
    setStep(2)
  }, [requestedService])

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId)
    setFormData((current) => ({ ...current, serviceType: serviceId }))
    setSubmitError('')
    setStep(2)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((current) => ({ ...current, [name]: value }))
    if (submitError) setSubmitError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')
    const result = await submitServiceRequest({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      serviceType: formData.serviceType,
      budget: formData.budget,
      timeline: formData.timeline,
      projectDescription: formData.description,
    })
    setIsSubmitting(false)
    if (!result.success) {
      setSubmitError(result.error || 'We could not send your inquiry. Please try again.')
      return
    }
    setSubmitted(true)
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden border-b border-border bg-foreground py-16 text-background sm:py-20 lg:py-28">
          <div className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 left-1/3 size-96 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:px-8">
            <div>
              <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-primary"><Sparkles className="size-3.5" aria-hidden="true" /> Bespoke studio work</p>
              <h1 className="mt-5 max-w-3xl font-serif text-5xl font-light leading-[0.98] sm:text-6xl lg:text-7xl">Made for the way your space should feel.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-background/70 sm:text-lg">From a single statement chair to a complete interior, share your brief and we will shape the furniture, finishes, and atmosphere around it.</p>
              <div className="mt-8 flex flex-wrap gap-3"><a href="#start-a-brief" className="inline-flex min-h-12 items-center gap-2 rounded-md bg-primary px-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:-translate-y-0.5">Start a brief <ArrowRight className="size-4" aria-hidden="true" /></a><Link prefetch={false} href="/portfolio" className="inline-flex min-h-12 items-center rounded-md border border-background/25 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-background transition-colors hover:border-primary hover:text-primary">See project work</Link></div>
            </div>
            <div className="rounded-2xl border border-background/15 bg-background/10 p-5 backdrop-blur sm:p-6"><p className="text-[10px] uppercase tracking-[0.2em] text-primary">A focused start</p><p className="mt-4 font-serif text-2xl font-light">Tell us what you are building, restoring, or reimagining.</p><div className="mt-5 grid grid-cols-2 gap-3 text-xs text-background/65"><span className="rounded-lg border border-background/10 px-3 py-3">Furniture</span><span className="rounded-lg border border-background/10 px-3 py-3">Upholstery</span><span className="rounded-lg border border-background/10 px-3 py-3">Cabinetry</span><span className="rounded-lg border border-background/10 px-3 py-3">Interior styling</span></div></div>
          </div>
        </section>

        {/* Form Section */}
        <section id="start-a-brief" className="scroll-mt-24 py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8 text-accent" />
                  </div>
                  <h2 className="font-serif text-3xl font-light text-foreground mb-3">
                    Request Received
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Your brief has been saved. The studio can now review the details you shared and continue from this request.
                  </p>
                </div>
              ) : step === 1 ? (
                <div>
                  <h2 className="font-serif text-3xl font-light text-foreground mb-2">
                    What would you like to create?
                  </h2>
                  <p className="text-muted-foreground mb-12">
                    Select the type of custom service that best fits your needs
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    {serviceTypes.map((service) => {
                      const IconComponent = service.icon
                      return (
                        <button
                          key={service.id}
                          onClick={() => handleServiceSelect(service.id)}
                          aria-pressed={selectedService === service.id}
                          className={`group relative overflow-hidden rounded-lg border bg-card p-6 text-left transition-all hover:border-accent hover:shadow-lg ${selectedService === service.id ? 'border-accent ring-2 ring-accent/20' : 'border-border'}`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <IconComponent className="w-8 h-8 text-accent group-hover:scale-110 transition-transform" />
                            <div className="w-5 h-5 border-2 border-border group-hover:border-accent rounded-full group-hover:bg-accent/10 transition-all" />
                          </div>
                          <h3 className="font-medium text-foreground mb-1">{service.label}</h3>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
                    >
                      ← Change service type
                    </button>

                    <h2 className="font-serif text-3xl font-light text-foreground mb-2">
                      Tell us about your project
                    </h2>
                    <p className="text-muted-foreground mb-8">
                      The more details you provide, the better we can understand your vision
                    </p>
                    {selectedService && <p className="inline-flex rounded-full border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-foreground">Selected service: <span className="ml-1 font-medium">{selectedService}</span></p>}
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Contact Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Full Name *
                        </label>
                        <Input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          required
                          className="bg-background border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Email *
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your@email.com"
                          required
                          className="bg-background border-border"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 000-0000"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Project Details
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Estimated Budget
                      </label>
                      <select
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded text-foreground text-sm"
                      >
                        <option value="">Select an option</option>
                        <option value="working-budget">I have a working budget</option>
                        <option value="discuss-budget">I prefer to discuss budget</option>
                        <option value="not-sure">Not sure yet</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Project Timeline
                      </label>
                      <select
                        value={formData.timeline}
                        onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded text-foreground text-sm"
                      >
                        <option value="">When do you need this completed?</option>
                        <option value="asap">ASAP (0-3 months)</option>
                        <option value="3-6months">3-6 months</option>
                        <option value="6-12months">6-12 months</option>
                        <option value="flexible">Flexible timeline</option>
                      </select>
                    </div>
                  </div>

                  {/* Project Description */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Project Description
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Tell us about your vision *
                      </label>
                      <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your project in detail. Include details about your style preferences, space dimensions, existing décor, and any specific requirements..."
                        rows={6}
                        required
                        className="bg-background border-border resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Please include as many details as possible to help us understand your vision
                      </p>
                    </div>
                  </div>

                  {submitError && <p role="alert" className="rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{submitError}</p>}

                  {/* Submit */}
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.name || !formData.email || !formData.description}
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      {isSubmitting ? 'Sending…' : 'Submit Request'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="border-t border-border bg-card py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-4xl font-light text-foreground mb-16 text-center">
              Our Process
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-4 gap-8">
                {[
                  {
                    step: '01',
                    title: 'Consultation',
                    description: 'We meet to understand your vision, space, and requirements',
                  },
                  {
                    step: '02',
                    title: 'Design Proposal',
                    description: 'Our team creates detailed designs and presents options',
                  },
                  {
                    step: '03',
                    title: 'Refinement',
                    description: 'We refine the design based on your feedback',
                  },
                  {
                    step: '04',
                    title: 'Production',
                    description: 'Expert craftspeople bring your design to life',
                  },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="font-serif text-lg font-light text-accent">{item.step}</span>
                    </div>
                    <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

export default function CustomServicesPage() {
  return <Suspense fallback={<main className="min-h-screen bg-background" aria-busy="true" />}><CustomServicesForm /></Suspense>
}
