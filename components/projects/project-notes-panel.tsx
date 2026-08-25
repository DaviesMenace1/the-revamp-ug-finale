'use client'

import { useState, useTransition } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { addProjectNote } from '@/lib/actions/project-assets'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type ProjectNote = {
  id: string
  body: string
  authorType: string
  createdAt: string
}

export default function ProjectNotesPanel({ projectId, initialNotes, available = true }: { projectId: string; initialNotes: ProjectNote[]; available?: boolean }) {
  const [notes, setNotes] = useState(initialNotes)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submitNote() {
    if (!body.trim()) {
      setError('Write a note before sending it.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await addProjectNote(projectId, body)
      if (!result.success || !result.note) {
        setError(result.error || 'The note could not be shared.')
        return
      }
      setNotes((current) => [result.note as ProjectNote, ...current])
      setBody('')
    })
  }

  return (
    <Card className="border-border/20 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageSquare className="size-5" aria-hidden="true" /></span>
        <div>
          <h2 className="font-serif text-2xl font-light text-foreground">Shared project notes</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Keep decisions, questions, measurements, and next steps in one place for the client and studio team.</p>
        </div>
      </div>

      {!available ? (
        <p className="mt-5 border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-100">Shared notes are waiting for the project collaboration migration to be applied. Existing project files remain unchanged.</p>
      ) : (
        <>
          <div className="mt-5 space-y-3">
            {notes.map((note) => (
              <article key={note.id} className="rounded-lg border border-border/50 bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <span>{note.authorType === 'admin' ? 'Studio team' : 'Client'}</span>
                  <time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleString('en-UG')}</time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{note.body}</p>
              </article>
            ))}
            {notes.length === 0 && <p className="rounded-lg border border-dashed border-border/60 px-4 py-5 text-sm text-muted-foreground">No shared notes yet. Add the first project update below.</p>}
          </div>
          <div className="mt-5 grid gap-3">
            <label htmlFor={`project-note-${projectId}`} className="text-sm font-medium text-foreground">Add an update</label>
            <textarea id={`project-note-${projectId}`} value={body} onChange={(event) => setBody(event.target.value)} rows={4} maxLength={4000} placeholder="Share a decision, question, measurement, or next step…" className="w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm leading-6 text-foreground outline-none ring-primary/30 transition focus:ring-2" />
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <Button type="button" onClick={submitNote} disabled={isPending} className="min-h-11 w-full gap-2 rounded-none sm:w-fit"> <Send className="size-4" aria-hidden="true" />{isPending ? 'Sharing…' : 'Share note'}</Button>
          </div>
        </>
      )}
    </Card>
  )
}
