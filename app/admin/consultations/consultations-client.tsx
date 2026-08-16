'use client'

import { useState, useTransition, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Trash2, Calendar, X } from 'lucide-react'
import {
  updateConsultationStatus,
  updateConsultationNotes,
  deleteConsultation,
} from '@/lib/actions/consultations'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-muted text-muted-foreground',
}

type Consultation = {
  id: string
  title: string
  description: string | null
  serviceType: string | null
  budget: string | null
  preferredDate: string | null
  status: string | null
  notes: string | null
  createdAt: string
  clientEmail: string | null
  clientFirstName: string | null
  clientLastName: string | null
  clientPhone: string | null
}

export default function ConsultationsClient({
  initialConsultations = [],
}: {
  initialConsultations: Consultation[]
}) {
  const [list, setList] = useState(initialConsultations)
  const [searchTerm, setSearchTerm] = useState('')
  const [selected, setSelected] = useState<Consultation | null>(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return list
    return list.filter((c) =>
      [c.title, c.clientEmail, c.clientFirstName, c.clientLastName, c.serviceType]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term)),
    )
  }, [list, searchTerm])

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      const res = await updateConsultationStatus(id, status)
      if (res.success) {
        setList((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
        setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev))
      }
    })
  }

  function handleSaveNotes() {
    if (!selected) return
    startTransition(async () => {
      const res = await updateConsultationNotes(selected.id, notesDraft)
      if (res.success) {
        setList((prev) =>
          prev.map((c) => (c.id === selected.id ? { ...c, notes: notesDraft } : c)),
        )
        setSelected((prev) => (prev ? { ...prev, notes: notesDraft } : prev))
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this consultation request?')) return
    startTransition(async () => {
      const res = await deleteConsultation(id)
      if (res.success) {
        setList((prev) => prev.filter((c) => c.id !== id))
        if (selected?.id === id) setSelected(null)
      }
    })
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="font-serif text-4xl font-light text-foreground">Consultations</h1>
        <p className="text-muted-foreground mt-2">Manage client consultation requests</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Requests</CardTitle>
              <CardDescription>{list.length} total consultations</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search consultations..."
                className="pl-10 rounded-none border-muted"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/20">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Service</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Preferred Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/20 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 text-sm">
                      <div className="font-medium text-foreground">
                        {[c.clientFirstName, c.clientLastName].filter(Boolean).join(' ') || '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">{c.clientEmail}</div>
                    </td>
                    <td className="py-4 px-4 text-sm text-foreground">
                      <button className="hover:underline" onClick={() => { setSelected(c); setNotesDraft(c.notes || '') }}>
                        {c.title}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{c.serviceType || '—'}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {c.preferredDate ? new Date(c.preferredDate).toLocaleString() : '—'}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <select
                        value={c.status ?? 'pending'}
                        disabled={isPending}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border-0 ${STATUS_COLORS[c.status ?? 'pending']}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <button
                        disabled={isPending}
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 hover:bg-muted rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No consultations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-medium text-foreground">{selected.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {[selected.clientFirstName, selected.clientLastName].filter(Boolean).join(' ')} ·{' '}
                  {selected.clientEmail}
                </p>
              </div>
              <button onClick={() => setSelected(null)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {selected.description && (
              <p className="mt-4 text-sm text-muted-foreground">{selected.description}</p>
            )}

            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              {selected.budget && <p>Budget: {selected.budget}</p>}
              {selected.clientPhone && <p>Phone: {selected.clientPhone}</p>}
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-foreground">Internal notes</label>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={4}
                className="mt-1.5 w-full rounded-lg border border-muted bg-transparent p-2.5 text-sm"
              />
              <Button
                size="sm"
                className="mt-2 rounded-none"
                disabled={isPending}
                onClick={handleSaveNotes}
              >
                Save Notes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
