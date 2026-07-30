'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Search, X } from 'lucide-react'

interface Blog {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  author: string
  status: 'draft' | 'published'
  publishedAt: string
  createdAt: string
}

const SEED_BLOGS: Blog[] = [
  {
    id: '1',
    title: 'The Art of Modern Interior Design in East Africa',
    slug: 'art-modern-interior-design-east-africa',
    excerpt: 'Exploring how contemporary design principles blend with East African heritage to create timeless interiors.',
    content: 'Modern interior design in East Africa represents a unique convergence of global contemporary trends and rich cultural heritage. By incorporating traditional patterns, natural materials, and craftsmanship alongside minimalist aesthetics, designers create spaces that honor the past while embracing the future. This approach has become increasingly popular among progressive homeowners seeking authentic yet sophisticated living environments.',
    category: 'Design Inspiration',
    author: 'Faridah Nakayiwa',
    status: 'published',
    publishedAt: new Date().toLocaleDateString(),
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: '2',
    title: 'Sustainable Luxury: Ethical Sourcing in High-End Furniture',
    slug: 'sustainable-luxury-ethical-sourcing',
    excerpt: 'How luxury brands are redefining sustainability through responsible sourcing and eco-conscious production.',
    content: 'The luxury furniture market is undergoing a profound transformation. Today\'s discerning clients demand not just beautiful pieces, but also assurance that their investments align with their values. Sustainable luxury means sourcing materials responsibly, supporting ethical labor practices, and creating timeless pieces designed to last generations. This shift is not just beneficial for the environment—it elevates the entire design experience.',
    category: 'Sustainability',
    author: 'Davis Musinguzi',
    status: 'published',
    publishedAt: new Date().toLocaleDateString(),
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: '3',
    title: 'Creating Spaces That Reflect Your Story',
    slug: 'creating-spaces-reflect-your-story',
    excerpt: 'A guide to designing personalized interiors that tell the unique narrative of your life and values.',
    content: 'Your home should be more than a place to live—it should be a reflection of who you are. The most compelling interiors are those that weave together personal history, cultural identity, and aspirations into a cohesive design narrative. Whether through carefully curated artwork, family heirlooms displayed alongside contemporary pieces, or spaces dedicated to your passions, intentional design creates homes that feel authentically lived-in and deeply meaningful.',
    category: 'Design Philosophy',
    author: 'Faridah Nakayiwa',
    status: 'published',
    publishedAt: new Date().toLocaleDateString(),
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: '4',
    title: 'The Future of Interior Architecture: Emerging Trends in 2026',
    slug: 'future-interior-architecture-trends-2026',
    excerpt: 'Exploring the cutting-edge design movements and technologies reshaping how we envision modern living spaces.',
    content: 'As we look toward 2026, several powerful trends are emerging in interior architecture. Biophilic design continues to gain momentum, with natural elements and living systems becoming integral to healthy spaces. Meanwhile, technological integration—from smart lighting to adaptive furniture—creates homes that respond to our needs. The shift toward adaptable, multi-functional spaces reflects changing work and lifestyle patterns. These trends converge in a design philosophy that prioritizes wellness, flexibility, and environmental consciousness.',
    category: 'Trends',
    author: 'Davis Musinguzi',
    status: 'draft',
    publishedAt: '',
    createdAt: new Date().toLocaleDateString(),
  },
]

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState<Blog[]>(SEED_BLOGS)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    author: '',
    status: 'draft' as const,
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleAddBlog = () => {
    if (!formData.title || !formData.content) {
      alert('Please fill in required fields')
      return
    }

    const slug = formData.slug || generateSlug(formData.title)

    if (editingId) {
      setBlogs(blogs.map(b =>
        b.id === editingId
          ? { ...b, ...formData, slug, status: formData.status as 'draft' | 'published' }
          : b
      ))
      setEditingId(null)
    } else {
      const newBlog: Blog = {
        id: Date.now().toString(),
        title: formData.title,
        slug,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        author: formData.author,
        status: formData.status as 'draft' | 'published',
        publishedAt: formData.status === 'published' ? new Date().toLocaleDateString() : '',
        createdAt: new Date().toLocaleDateString(),
      }
      setBlogs([newBlog, ...blogs])
    }

    setFormData({ title: '', slug: '', excerpt: '', content: '', category: '', author: '', status: 'draft' })
    setIsFormOpen(false)
  }

  const handleEdit = (blog: Blog) => {
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      category: blog.category,
      author: blog.author,
      status: blog.status,
    })
    setEditingId(blog.id)
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this blog post?')) {
      setBlogs(blogs.filter(b => b.id !== id))
    }
  }

  const filteredBlogs = blogs.filter(b =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-light text-foreground">Journal & Blog</h1>
        <p className="text-muted-foreground mt-2">Create and manage articles and lifestyle content</p>
      </div>

      {/* Add/Edit Form */}
      {isFormOpen && (
        <Card className="p-8 border-border/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-light text-foreground">
              {editingId ? 'Edit Article' : 'New Article'}
            </h2>
            <button
              onClick={() => {
                setIsFormOpen(false)
                setEditingId(null)
                setFormData({ title: '', slug: '', excerpt: '', content: '', category: '', author: '', status: 'draft' })
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Article Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value })
                  if (!formData.slug) {
                    setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))
                  }
                }}
                placeholder="e.g., The Art of Minimalist Interior Design"
                className="rounded-none border-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">URL Slug</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="auto-generated from title"
                className="rounded-none border-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Author</label>
              <Input
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="e.g., Faridah Ssekandi"
                className="rounded-none border-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Design Trends"
                className="rounded-none border-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                className="w-full px-4 py-2 border border-muted rounded-none bg-background text-foreground"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Excerpt</label>
              <Input
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Short summary for preview..."
                className="rounded-none border-muted"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Article Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your article content here..."
                rows={8}
                className="w-full px-4 py-2 border border-muted rounded-none bg-background text-foreground font-light resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAddBlog}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
            >
              {editingId ? 'Update Article' : 'Publish Article'}
            </Button>
            <Button
              onClick={() => {
                setIsFormOpen(false)
                setEditingId(null)
                setFormData({ title: '', slug: '', excerpt: '', content: '', category: '', author: '', status: 'draft' })
              }}
              variant="outline"
              className="rounded-none"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Search & Add Button */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search articles..."
            className="pl-10 rounded-none border-muted"
          />
        </div>
        {!isFormOpen && (
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        )}
      </div>

      {/* Blogs List */}
      <div className="space-y-3">
        {filteredBlogs.length === 0 ? (
          <Card className="p-12 border-border/20 border-dashed text-center">
            <p className="text-muted-foreground mb-2">No articles yet</p>
            <p className="text-sm text-muted-foreground/70">Click "New Article" to create your first blog post.</p>
          </Card>
        ) : (
          filteredBlogs.map(blog => (
            <Card key={blog.id} className="p-6 border-border/20 hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-medium text-foreground text-lg">{blog.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded uppercase font-medium ${
                      blog.status === 'published'
                        ? 'bg-green-100/20 text-green-700'
                        : 'bg-yellow-100/20 text-yellow-700'
                    }`}>
                      {blog.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-6 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Author</p>
                      <p className="text-foreground">{blog.author || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Category</p>
                      <p className="text-foreground">{blog.category || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Created</p>
                      <p className="text-foreground">{blog.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">URL</p>
                      <p className="text-foreground text-xs truncate">/{blog.slug}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Word Count</p>
                      <p className="text-foreground">{blog.content.split(/\s+/).length}</p>
                    </div>
                  </div>
                  {blog.excerpt && (
                    <p className="text-sm text-muted-foreground/80 line-clamp-2">{blog.excerpt}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(blog)}
                    className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(blog.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      {blogs.length > 0 && (
        <div className="grid md:grid-cols-4 gap-6 pt-8 border-t border-border/20">
          <Card className="p-6 border-border/20">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Total Articles</p>
            <p className="font-serif text-4xl font-light text-foreground">{blogs.length}</p>
          </Card>
          <Card className="p-6 border-border/20">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Published</p>
            <p className="font-serif text-4xl font-light text-foreground">{blogs.filter(b => b.status === 'published').length}</p>
          </Card>
          <Card className="p-6 border-border/20">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Drafts</p>
            <p className="font-serif text-4xl font-light text-foreground">{blogs.filter(b => b.status === 'draft').length}</p>
          </Card>
          <Card className="p-6 border-border/20">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Total Words</p>
            <p className="font-serif text-4xl font-light text-foreground">{blogs.reduce((sum, b) => sum + b.content.split(/\s+/).length, 0).toLocaleString()}</p>
          </Card>
        </div>
      )}
    </div>
  )
}
