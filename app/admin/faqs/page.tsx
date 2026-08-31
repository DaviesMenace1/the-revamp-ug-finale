'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Search, X, ChevronDown, Loader2 } from '@/components/ui/luxury-icons'
import { cn } from '@/lib/utils'

const FAQ_CATEGORIES = [
  'General',
  'Interior Design',
  'Architecture',
  'Global Sourcing',
  'Products & Collections',
  'Orders & Payments',
  'Shipping & Installation',
  'Trade Program',
  'Membership & Loyalty',
  'Returns & Warranties',
  'Contact & Support',
  'Consulting',
]

interface FAQ {
  id: string
  category: string
  question: string
  answer: string
  order?: number
  views: number
  helpful: number
  notHelpful: number
  status: 'draft' | 'published'
  createdAt: string
}

interface FormData {
  category: string
  question: string
  answer: string
  status: 'draft' | 'published'
}

export default function AdminFAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormData>({
    category: '',
    question: '',
    answer: '',
    status: 'published',
  })

  // Fetch FAQs from API
  const fetchFAQs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/faqs')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setFaqs(json.data)
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFAQs()
  }, [])

  const handleAddOrUpdateFAQ = async () => {
    if (!formData.category || !formData.question || !formData.answer) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/faqs/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const json = await res.json()
        if (json.success) {
          setFaqs(faqs.map((f) => (f.id === editingId ? json.data : f)))
          resetForm()
        }
      } else {
        const res = await fetch('/api/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const json = await res.json()
        if (json.success) {
          setFaqs([json.data, ...faqs])
          resetForm()
        }
      }
    } catch (err) {
      console.error('Failed to save FAQ:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditFAQ = (faq: FAQ) => {
    setFormData({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      status: faq.status,
    })
    setEditingId(faq.id)
    setIsFormOpen(true)
  }

  const handleDeleteFAQ = async (id: string) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      try {
        const res = await fetch(`/api/faqs/${id}`, { method: 'DELETE' })
        const json = await res.json()
        if (json.success) {
          setFaqs(faqs.filter((f) => f.id !== id))
        }
      } catch (err) {
        console.error('Failed to delete FAQ:', err)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      category: '',
      question: '',
      answer: '',
      status: 'published',
    })
    setEditingId(null)
    setIsFormOpen(false)
  }

  const categoriesWithCounts = useMemo(() => {
    return FAQ_CATEGORIES.map((cat) => ({
      name: cat,
      count: faqs.filter((f) => f.category === cat).length,
    }))
  }, [faqs])

  const stats = {
    totalFAQs: faqs.length,
    published: faqs.filter((f) => f.status === 'published').length,
    draft: faqs.filter((f) => f.status === 'draft').length,
    categories: FAQ_CATEGORIES.length,
  }

  const totalViews = faqs.reduce((sum, f) => sum + (f.views || 0), 0)

  return (
    <div className="w-full space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">FAQ Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage frequently asked questions across the studio</p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)} className="gap-2 bg-gold hover:bg-gold/90 text-black">
          <Plus size={16} /> Add FAQ
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total FAQs', value: stats.totalFAQs },
          { label: 'Published', value: stats.published },
          { label: 'Drafts', value: stats.draft },
          { label: 'Categories', value: stats.categories },
          { label: 'Total Views', value: totalViews },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 bg-card border-border/60">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-light mt-2 text-foreground">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Form Modal / Drawer */}
      {isFormOpen && (
        <Card className="p-6 bg-card border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-light">{editingId ? 'Edit FAQ' : 'Add New FAQ'}</h2>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded bg-background text-foreground text-sm focus:border-gold outline-none"
                >
                  <option value="">Select category</option>
                  {FAQ_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded bg-background text-foreground text-sm focus:border-gold outline-none"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Question *</label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="e.g. What is the process for bespoke furniture customization?"
                className="mt-1 focus:border-gold"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Answer *</label>
              <Textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Provide a comprehensive answer..."
                className="mt-1 min-h-32 focus:border-gold"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleAddOrUpdateFAQ} disabled={submitting} className="bg-gold hover:bg-gold/90 text-black">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} /> Saving...
                  </span>
                ) : editingId ? (
                  'Update FAQ'
                ) : (
                  'Add FAQ'
                )}
              </Button>
              <Button onClick={resetForm} variant="outline" className="border-border">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-border rounded bg-background text-foreground text-sm"
        >
          <option value="all">All Categories</option>
          {FAQ_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-12 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={20} /> Loading FAQs...
        </div>
      ) : (
        /* FAQs List by Category */
        <div className="space-y-4">
          {categoriesWithCounts.map((categoryData) => {
            const categoryFAQs = faqs.filter((f) => f.category === categoryData.name)
            const isExpanded = expandedCategory === categoryData.name
            const showCategory = selectedCategory === 'all' || selectedCategory === categoryData.name

            if (!showCategory) return null

            return (
              <Card key={categoryData.name} className="bg-card border border-border/50 overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : categoryData.name)}
                  className="w-full p-4 flex items-center justify-between hover:bg-background/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-foreground">{categoryData.name}</h3>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                      {categoryData.count} FAQs
                    </span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={cn('text-muted-foreground transition-transform', isExpanded && 'rotate-180')}
                  />
                </button>

                {isExpanded && (
                  <div className="border-t border-border/50">
                    {categoryFAQs.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No FAQs in this category</div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {categoryFAQs
                          .filter(
                            (f) =>
                              f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              f.answer.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((faq) => (
                            <div key={faq.id} className="p-4 space-y-2 hover:bg-background/30 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-foreground">{faq.question}</h4>
                                    <span
                                      className={cn(
                                        'text-xs px-2 py-1 rounded capitalize',
                                        faq.status === 'published'
                                          ? 'bg-emerald-500/10 text-emerald-600'
                                          : 'bg-amber-500/10 text-amber-600'
                                      )}
                                    >
                                      {faq.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{faq.answer}</p>
                                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>Views: {faq.views || 0}</span>
                                    <span>Helpful: {faq.helpful || 0}</span>
                                    <span>Not Helpful: {faq.notHelpful || 0}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                  <button
                                    onClick={() => handleEditFAQ(faq)}
                                    className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                                    title="Edit FAQ"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFAQ(faq.id)}
                                    className="p-1.5 hover:bg-red-500/10 rounded transition-colors text-muted-foreground hover:text-red-600"
                                    title="Delete FAQ"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
