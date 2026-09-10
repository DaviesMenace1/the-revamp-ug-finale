'use client'
import { Plus, Trash2 } from '@/components/ui/luxury-icons'
import { SingleImageUpload } from '@/components/admin/single-image-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type EditorKind = 'story' | 'process' | 'faq' | 'highlight'
type Item = Record<string, string>

const defaults: Record<EditorKind, Item> = {
  story: { eyebrow: '', title: '', body: '', image: '' },
  process: { title: '', description: '' },
  faq: { question: '', answer: '' },
  highlight: { label: '', value: '' },
}

const labels: Record<EditorKind, { title: string; description: string; add: string }> = {
  story: { title: 'Story sections', description: 'Build the editorial blocks visitors will read on the detail page.', add: 'Add story section' },
  process: { title: 'Process steps', description: 'Explain the journey in clear, numbered steps.', add: 'Add process step' },
  faq: { title: 'Frequently asked questions', description: 'Answer the questions clients typically ask before enquiring.', add: 'Add FAQ' },
  highlight: { title: 'Project highlights', description: 'Add compact facts such as scope, location, year, or materials.', add: 'Add highlight' },
}

export function StructuredListEditor({ kind, value, onChange }: { kind: EditorKind; value: unknown[]; onChange: (value: Item[]) => void }) {
  const items = Array.isArray(value) ? value as Item[] : []
  const update = (index: number, key: string, next: string) => onChange(items.map((item, i) => i === index ? { ...item, [key]: next } : item))
  const add = () => onChange([...items, { ...defaults[kind] }])
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index))
  const copy = labels[kind]

  return (
    <div className="space-y-3 rounded border border-border/60 bg-muted/10 p-3 md:col-span-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div><h4 className="text-sm font-semibold text-foreground">{copy.title}</h4><p className="text-xs leading-5 text-muted-foreground">{copy.description}</p></div>
        <Button type="button" variant="outline" size="sm" onClick={add} className="shrink-0 rounded-none"><Plus className="mr-1.5 size-3.5" />{copy.add}</Button>
      </div>
      {items.length === 0 && <p className="border border-dashed border-border/70 p-4 text-xs text-muted-foreground">Nothing added yet. Click “{copy.add}” to create the first item.</p>}
      {items.map((item, index) => (
        <div key={index} className="space-y-2 border border-border/60 bg-background p-3">
          <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{copy.title} {index + 1}</span><button type="button" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive" aria-label={`Delete ${copy.title} ${index + 1}`}><Trash2 className="size-4" /></button></div>
          {kind === 'story' && <><Input placeholder="Eyebrow, e.g. Our approach" value={item.eyebrow || ''} onChange={(e) => update(index, 'eyebrow', e.target.value)} /><Input placeholder="Section title" value={item.title || ''} onChange={(e) => update(index, 'title', e.target.value)} /><Textarea placeholder="Section text" rows={4} value={item.body || ''} onChange={(e) => update(index, 'body', e.target.value)} /><SingleImageUpload value={item.image || ''} onChange={(image) => update(index, 'image', image)} label="Upload supporting image (optional)" /></>}
          {kind === 'process' && <><Input placeholder="Step title" value={item.title || ''} onChange={(e) => update(index, 'title', e.target.value)} /><Textarea placeholder="What happens in this step" rows={3} value={item.description || ''} onChange={(e) => update(index, 'description', e.target.value)} /></>}
          {kind === 'faq' && <><Input placeholder="Question" value={item.question || ''} onChange={(e) => update(index, 'question', e.target.value)} /><Textarea placeholder="Answer" rows={3} value={item.answer || ''} onChange={(e) => update(index, 'answer', e.target.value)} /></>}
          {kind === 'highlight' && <div className="grid gap-2 sm:grid-cols-2"><Input placeholder="Label, e.g. Location" value={item.label || ''} onChange={(e) => update(index, 'label', e.target.value)} /><Input placeholder="Value, e.g. Dubai, UAE" value={item.value || ''} onChange={(e) => update(index, 'value', e.target.value)} /></div>}
        </div>
      ))}
    </div>
  )
}
