'use client'

import { useState, useTransition, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Search, X } from 'lucide-react'
import { ImageUpload } from '@/components/admin/image-upload'
import { createArticle, getArticleForAdmin, updateArticle, deleteArticle } from '@/lib/actions/articles'
import { StructuredListEditor } from '@/components/admin/structured-list-editor'

type Article = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content?: string | null
  author: string | null
  category: string | null
  featuredImage: string | null
  gallery?: string[] | null
  storySections?: unknown[] | null
  status: string | null
  createdAt: string
}

type ArticleForm = { title: string; excerpt: string; content: string; author: string; category: string; featuredImage: string; gallery: string[]; storySections: unknown[]; status: string }

const emptyForm: ArticleForm = {
  title: '',
  excerpt: '',
  content: '',
  author: '',
  category: '',
  featuredImage: '',
  gallery: [],
  storySections: [],
  status: 'published',
}

export default function BlogsClient({ initialArticles = [], loadError = null }: { initialArticles: Article[]; loadError?: string | null }) {
  const [list, setList] = useState(initialArticles)
  const [searchTerm, setSearchTerm] = useState('')
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState<ArticleForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return list
    return list.filter((a) => a.title.toLowerCase().includes(term))
  }, [list, searchTerm])

  function openNew() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(article: Article) {
    startTransition(async () => {
      const result = await getArticleForAdmin(article.id)
      if (!result.success || !result.article) return
      const detail = result.article
      setForm({
        title: detail.title,
        excerpt: detail.excerpt ?? '',
        content: detail.content ?? '',
        author: detail.author ?? '',
        category: detail.category ?? '',
        featuredImage: detail.featuredImage ?? '',
        gallery: Array.isArray(detail.gallery) ? detail.gallery as string[] : [],
        storySections: Array.isArray(detail.storySections) ? detail.storySections : [],
        status: detail.status ?? 'draft',
      })
      setEditingId(detail.id)
      setShowForm(true)
    })
  }

  function handleSave() {
    if (!form.title.trim()) return

    startTransition(async () => {
      if (editingId) {
        const res = await updateArticle(editingId, form)
        if (res.success) {
          setList((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...form } : a)))
          setShowForm(false)
        }
      } else {
        const res = await createArticle(form)
        if (res.success && res.article) {
          const article: Article = {
            id: res.article.id,
            title: res.article.title,
            slug: res.article.slug,
            excerpt: res.article.excerpt,
            content: res.article.content,
            author: res.article.author,
            category: res.article.category,
            featuredImage: res.article.featuredImage,
            gallery: res.article.gallery ?? [],
            storySections: res.article.storySections ?? [],
            status: res.article.status,
            createdAt: new Date(res.article.createdAt).toISOString(),
          }
          setList((prev) => [article, ...prev])
          setShowForm(false)
        }
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this article?')) return
    startTransition(async () => {
      const res = await deleteArticle(id)
      if (res.success) {
        setList((prev) => prev.filter((a) => a.id !== id))
      }
    })
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground">Journal</h1>
          <p className="text-muted-foreground mt-2">Manage articles and journal entries</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none" onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Article
        </Button>
      </div>

      {loadError && (
        <div role="status" className="flex items-center justify-between gap-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <span>{loadError}</span>
          <button type="button" onClick={() => window.location.reload()} className="font-medium underline underline-offset-4">Retry</button>
        </div>
      )}

      <div className="relative w-64">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          className="pl-10 rounded-none border-muted"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((article) => (
          <Card key={article.id} className="overflow-hidden">
            {article.featuredImage && (
              <img src={article.featuredImage} alt="" className="h-36 w-full object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    article.status === 'published'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {article.status}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(article)}>
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(article.id)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <h3 className="mt-2 font-medium text-foreground">{article.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No articles yet.</p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-lg bg-background p-6 shadow-xl my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">
                {editingId ? 'Edit Article' : 'New Article'}
              </h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Author"
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                />
                <Input
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>

              <Textarea
                placeholder="Excerpt"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              />

              <Textarea
                placeholder="Full content"
                rows={8}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />

              <div>
                <label className="text-sm font-medium text-foreground">Featured image</label>
                <div className="mt-2">
                  <ImageUpload
                    value={form.featuredImage ? [form.featuredImage] : []}
                    onChange={(urls) => setForm((f) => ({ ...f, featuredImage: urls[0] || '' }))}
                    maxImages={1}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Article gallery</label>
                <ImageUpload value={form.gallery} onChange={(gallery) => setForm((f) => ({ ...f, gallery }))} maxImages={12} />
              </div>
              <StructuredListEditor kind="story" value={form.storySections} onChange={(storySections) => setForm((f) => ({ ...f, storySections }))} />
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded border border-muted bg-transparent p-2.5 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>

              <Button disabled={isPending} onClick={handleSave} className="rounded-none w-full">
                {editingId ? 'Save Changes' : 'Create Article'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
