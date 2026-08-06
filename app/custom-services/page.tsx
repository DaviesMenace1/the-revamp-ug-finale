'use client'

import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Check, Armchair, Sofa, Home, Lightbulb, Palette, FileText } from 'lucide-react'

const serviceTypes = [
  { id: 'custom-furniture', label: 'Custom Furniture', icon: Armchair, description: 'Bespoke pieces tailored to your space' },
  { id: 'upholstery', label: 'Custom Upholstery', icon: Sofa, description: 'Premium fabric and material selection' },
  { id: 'cabinetry', label: 'Custom Cabinetry', icon: Home, description: 'Built-in storage solutions' },
  { id: 'lighting', label: 'Custom Lighting', icon: Lightbulb, description: 'Bespoke lighting designs' },
  { id: 'styling', label: 'Interior Styling', icon: Palette, description: 'Complete space design package' },
  { id: 'other', label: 'Other', icon: FileText, description: 'Tell us what you need' },
]

export default function CustomServicesPage() {
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

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId)
    setFormData({ ...formData, serviceType: serviceId })
    setStep(2)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would send the form data to your backend
    console.log('Custom service request:', formData)
    setSubmitted(true)
    // Reset after 3 seconds
    setTimeout(() => {
      setStep(1)
      setSelectedService(null)
      setFormData({
        name: '',
        email: '',
        phone: '',
        serviceType: '',
        budget: '',
        timeline: '',
        description: '',
      })
      setSubmitted(false)
    }, 3000)
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="border-b border-border py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="font-serif text-5xl lg:text-6xl font-light text-foreground mb-6">
                Custom Services
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                At The Revamp UG, we specialize in creating bespoke solutions tailored to your unique vision. From custom furniture to complete interior styling packages, our team of designers and craftspeople work with you to bring your dream spaces to life.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-accent">
                <Check className="w-5 h-5" />
                <span>Premium Quality • Expert Consultation • Personalized Design</span>
              </div>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-20 lg:py-32">
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
                    Thank you for submitting your custom service request. Our team will review your requirements and contact you within 48 hours to discuss your project in detail.
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
                          className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 text-left transition-all hover:border-accent hover:shadow-lg"
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
                        <option value="">Select your budget range</option>
                        <option value="under-5k">Under $5,000</option>
                        <option value="5k-10k">$5,000 - $10,000</option>
                        <option value="10k-25k">$10,000 - $25,000</option>
                        <option value="25k-50k">$25,000 - $50,000</option>
                        <option value="50k+">$50,000+</option>
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
                      disabled={!formData.name || !formData.email || !formData.description}
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      Submit Request
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
