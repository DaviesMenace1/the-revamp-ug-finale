'use client'

import { useState, useTransition } from 'react'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X, Send, LifeBuoy } from '@/components/ui/luxury-icons'
import { createTicket, replyToTicketAsClient, getTicketMessages } from '@/lib/actions/tickets'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Support', href: '/client/tickets' },
  { label: 'Documents', href: '/client/documents' },
]

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-muted text-muted-foreground',
}

type Ticket = {
  id: string
  ticketNumber: string
  subject: string
  description: string | null
  category: string | null
  priority: string
  status: string
  createdAt: string
}

type TicketMessage = {
  id: string
  senderType: string
  senderName: string | null
  body: string
  createdAt: string
}

export default function TicketsClient({ initialTickets = [], loadError = null }: { initialTickets: Ticket[]; loadError?: string | null }) {
  const [tickets, setTickets] = useState(initialTickets)
  const [showNewForm, setShowNewForm] = useState(false)
  const [form, setForm] = useState({ subject: '', description: '', category: '', priority: 'normal' })
  const [isPending, startTransition] = useTransition()

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [reply, setReply] = useState('')

  async function openTicket(ticket: Ticket) {
    setSelectedTicket(ticket)
    const res = await getTicketMessages(ticket.id)
    setMessages(res.messages as TicketMessage[])
  }

  function handleCreate() {
    if (!form.subject.trim()) return
    startTransition(async () => {
      const res = await createTicket(form)
      if (res.success && res.ticket) {
        setTickets((prev) => [
          { ...res.ticket, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), resolvedAt: null } as Ticket,
          ...prev,
        ])
        setForm({ subject: '', description: '', category: '', priority: 'normal' })
        setShowNewForm(false)
      }
    })
  }

  function handleReply() {
    if (!selectedTicket || !reply.trim()) return
    const body = reply
    setReply('')
    startTransition(async () => {
      const res = await replyToTicketAsClient(selectedTicket.id, body)
      if (res.success && res.message) {
        setMessages((prev) => [...prev, { ...res.message, createdAt: new Date().toISOString() } as TicketMessage])
      }
    })
  }

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="mx-auto max-w-3xl px-6 py-10 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-light text-foreground">Support Tickets</h1>
            <p className="mt-1 text-sm text-muted-foreground">Get help with an order, project, or anything else.</p>
          </div>
          <Button onClick={() => setShowNewForm(true)} className="rounded-none">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => openTicket(ticket)}
              className="flex w-full items-center justify-between rounded-lg border border-border/20 p-4 text-left hover:bg-muted/50"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {ticket.ticketNumber} · {new Date(ticket.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                {ticket.status.replace('_', ' ')}
              </span>
            </button>
          ))}

          {tickets.length === 0 && (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-border/40 p-10 text-center">
              <LifeBuoy className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No support tickets yet.</p>
            </div>
          )}
        </div>
              </div>

        {loadError && (
          <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <span>{loadError}</span>
            <button type="button" onClick={() => window.location.reload()} className="min-h-11 shrink-0 font-medium underline underline-offset-4">Retry</button>
          </div>
        )}

        {showNewForm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">New Ticket</h2>
              <button onClick={() => setShowNewForm(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <Input
                placeholder="Subject"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              />
              <Textarea
                placeholder="Describe your issue..."
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full rounded border border-muted bg-transparent p-2.5 text-sm"
              >
                <option value="low">Low priority</option>
                <option value="normal">Normal priority</option>
                <option value="high">High priority</option>
                <option value="urgent">Urgent</option>
              </select>
              <Button disabled={isPending} onClick={handleCreate} className="w-full rounded-none">
                Submit Ticket
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex h-[70vh] w-full max-w-lg flex-col rounded-lg bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border/20 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">{selectedTicket.subject}</p>
                <p className="text-xs text-muted-foreground">{selectedTicket.ticketNumber}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.senderType === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
                      message.senderType === 'client'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {message.senderType !== 'client' && (
                      <p className="mb-0.5 text-xs font-medium opacity-70">{message.senderName || 'Support'}</p>
                    )}
                    <p>{message.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedTicket.status !== 'closed' && (
              <div className="flex items-center gap-2 border-t border-border/20 p-3">
                <Input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleReply()
                    }
                  }}
                  placeholder="Reply..."
                  className="rounded-none"
                />
                <Button onClick={handleReply} disabled={isPending || !reply.trim()} className="rounded-none">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </PortalLayout>
  )
}
