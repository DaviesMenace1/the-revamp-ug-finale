'use client'

import { SingleImageUpload } from '@/components/admin/single-image-upload'
import { useState, useTransition } from 'react'
import { Megaphone, Pencil, Plus, Trash2, X } from 'lucide-react'
import { createCommunityPost, deleteCommunityPost, updateCommunityPost } from '@/lib/actions/community'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type PostRecord = {
  id: string
  title: string
  body: string
  image: string | null
  category: string
  status: string
  createdAt: string
  updatedAt: string
}

type PostForm = { title: string; body: string; image: string; category: string; status: string }
const EMPTY_FORM: PostForm = { title: '', body: '', image: '', category: 'announcement', status: 'draft' }

export default function CommunityAdminClient({ posts: initialPosts }: { posts: PostRecord[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const [form, setForm] = useState<PostForm>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function reset() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  function save() {
    setError(null)
    setMessage(null)
    if (!form.title.trim() || !form.body.trim()) {
      setError('Add a title and body before saving the post.')
      return
    }
    startTransition(async () => {
      const result = editingId ? await updateCommunityPost(editingId, { ...form, image: form.image || null }) : await createCommunityPost({ ...form, image: form.image || null })
      if (!result.success || !result.post) {
        setError(result.error || 'The community post could not be saved.')
        return
      }
      const post = { ...result.post, createdAt: result.post.createdAt.toISOString(), updatedAt: result.post.updatedAt.toISOString() }
      setPosts((current) => editingId ? current.map((item) => item.id === editingId ? post : item) : [post, ...current])
      setMessage(editingId ? 'Community post updated.' : 'Community post created.')
      reset()
    })
  }

  function remove(id: string) {
    if (!window.confirm('Delete this community post?')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteCommunityPost(id)
      if (!result.success) {
        setError(result.error || 'The community post could not be deleted.')
        return
      }
      setPosts((current) => current.filter((post) => post.id !== id))
      if (editingId === id) reset()
      setMessage('Community post deleted.')
    })
  }

  return (
    <main className="min-w-0 space-y-8 p-5 sm:p-8">
      <header className="flex flex-col gap-4 border-b border-border/70 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Member communications</p><h1 className="mt-2 font-serif text-4xl font-light text-foreground sm:text-5xl">Community</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Publish studio announcements, education, and member updates to the community feed. Drafts stay private.</p></div><Megaphone className="size-7 text-primary" aria-hidden="true" /></header>
      {(error || message) && <div className={`border px-4 py-3 text-sm ${error ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-emerald-300/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100'}`} role={error ? 'alert' : 'status'}>{error || message}</div>}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card className="border-border/20 p-5 sm:p-7"><div className="flex items-center justify-between gap-3"><div><h2 className="font-serif text-2xl font-light text-foreground">{editingId ? 'Edit update' : 'Write an update'}</h2><p className="mt-1 text-sm text-muted-foreground">Only published posts appear to members.</p></div>{editingId ? <button type="button" onClick={reset} className="flex size-11 items-center justify-center text-muted-foreground" aria-label="Cancel editing"><X className="size-5" /></button> : <Plus className="size-5 text-primary" aria-hidden="true" />}</div><div className="mt-6 grid gap-4"><Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="Welcome to the new season" /><label className="grid gap-2 text-sm font-medium text-foreground"><span>Body</span><textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} rows={7} maxLength={8000} placeholder="Write the update for the community…" className="w-full resize-y border border-input bg-background px-3 py-3 text-sm font-normal leading-6 outline-none focus:ring-2 focus:ring-primary/30" /></label><div className="grid gap-4 sm:grid-cols-2"><Field label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} placeholder="announcement" /><div><label className="mb-2 block text-sm font-medium text-foreground">Image (optional)</label><SingleImageUpload value={form.image} onChange={(image) => setForm({ ...form, image })} label="Upload update image" /></div></div><label className="grid gap-2 text-sm font-medium text-foreground"><span>Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="min-h-11 border border-input bg-background px-3 text-sm font-normal"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><Button type="button" onClick={save} disabled={isPending} className="min-h-11 w-full rounded-none sm:w-fit">{isPending ? 'Saving…' : editingId ? 'Save changes' : 'Save update'}</Button></div></Card>
        <section className="space-y-4"><div className="flex items-center justify-between"><h2 className="font-serif text-2xl font-light text-foreground">All updates</h2><span className="text-xs text-muted-foreground">{posts.length} total</span></div>{posts.map((post) => <article key={post.id} className="border border-border/50 bg-card p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-xl text-foreground">{post.title}</h3><span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{post.status}</span></div><p className="mt-1 text-xs uppercase tracking-[0.12em] text-primary">{post.category}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{post.body}</p></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => { setEditingId(post.id); setForm({ title: post.title, body: post.body, image: post.image || '', category: post.category, status: post.status }); setError(null); setMessage(null) }} className="flex min-h-11 items-center gap-2 border border-border px-3 text-xs font-semibold uppercase tracking-[0.12em] text-foreground" aria-label={`Edit ${post.title}`}><Pencil className="size-3.5" />Edit</button><button type="button" onClick={() => remove(post.id)} className="flex min-h-11 items-center justify-center border border-destructive/30 px-3 text-destructive" aria-label={`Delete ${post.title}`}><Trash2 className="size-4" /></button></div></div></article>)}{posts.length === 0 && <div className="border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">No community updates yet.</div>}</section>
      </section>
    </main>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="grid gap-2 text-sm font-medium text-foreground"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 w-full border border-input bg-background px-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-primary/30" /></label>
}
