'use client'

import { useState, useTransition, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Send, LifeBuoy } from 'lucide-react'
import {
  getTicketMessages,
  replyToTicketAsAdmin,
  updateTicketStatus,
  updateTicketPriority,
} from '@/lib/actions/tickets'

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-muted text-muted-foreground',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-muted-foreground',
  normal: 'text-foreground',
  high: 'text-amber-700',
  urgent: 'text-rose-700 font-semibold',
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
  clientEmail: string | null
  clientFirstName: string | null
  clientLastName: string | null
}

type TicketMessage = {
  id: string
  senderType: string
  senderName: string | null
  body: string
  createdAt: string
}

export default function TicketsAdminClient({ initialTickets = [] }: { initialTickets: Ticket[] }) {
  const [tickets, setTickets] = useState(initialTickets)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [reply, setReply] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    let list = tickets
    if (statusFilter !== 'all') list = list.filter((t) => t.status === statusFilter)
    const term = searchTerm.trim().toLowerCase()
    if (term) {
      list = list.filter((t) =>
        [t.subject, t.ticketNumber, t.clientEmail].filter(Boolean).some((f) => f!.toLowerCase().includes(term)),
      )
    }
    return list
  }, [tickets, statusFilter, searchTerm])

  const selected = tickets.find((t) => t.id === selectedId)

  async function openTicket(id: string) {
    setSelectedId(id)
    const res = await getTicketMessages(id)
    setMessages(res.messages as TicketMessage[])
  }

  function handleStatusChange(status: string) {
    if (!selectedId) return
    startTransition(async () => {
      const res = await updateTicketStatus(selectedId, status)
      if (res.success) {
        setTickets((prev) => prev.map((t) => (t.id === selectedId ? { ...t, status } : t)))
      }
    })
  }

  function handlePriorityChange(priority: string) {
    if (!selectedId) return
    startTransition(async () => {
      const res = await updateTicketPriority(selectedId, priority)
      if (res.success) {
        setTickets((prev) => prev.map((t) => (t.id === selectedId ? { ...t, priority } : t)))
      }
    })
  }

  function handleReply() {
    if (!selectedId || !reply.trim()) return
    const body = reply
    setReply('')
    startTransition(async () => {
      const res = await replyToTicketAsAdmin(selectedId, body)
      if (res.success && res.message) {
        setMessages((prev) => [...prev, { ...res.message, createdAt: new Date().toISOString() } as TicketMessage])
        setTickets((prev) => prev.map((t) => (t.id === selectedId ? { ...t, status: 'in_progress' } : t)))
      }
    })
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-serif text-4xl font-light text-foreground">Support Tickets</h1>
        <p className="text-muted-foreground mt-2">{tickets.length} total tickets</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            className="pl-10 rounded-none border-muted"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-muted bg-transparent px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="max-h-[70vh] overflow-y-auto p-0">
          {filtered.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => openTicket(ticket.id)}
              className={`flex w-full items-start justify-between gap-2 border-b border-border/20 p-4 text-left hover:bg-muted/50 ${
                selectedId === ticket.id ? 'bg-muted/60' : ''
              }`}
            >
              <div>
                <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {ticket.ticketNumber} ·{' '}
                  {[ticket.clientFirstName, ticket.clientLastName].filter(Boolean).join(' ') || ticket.clientEmail}
                </p>
                <p className={`text-xs mt-1 ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority} priority</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                {ticket.status.replace('_', ' ')}
              </span>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center p-10 text-center">
              <LifeBuoy className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No tickets found.</p>
            </div>
          )}
        </Card>

        <Card className="flex h-[70vh] flex-col p-0">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
              <LifeBuoy className="mb-2 h-8 w-8" />
              <p className="text-sm">Select a ticket</p>
            </div>
          ) : (
            <>
              <div className="border-b border-border/20 p-4">
                <p className="text-sm font-medium text-foreground">{selected.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {[selected.clientFirstName, selected.clientLastName].filter(Boolean).join(' ')} ·{' '}
                  {selected.clientEmail}
                </p>
                <div className="mt-2 flex gap-2">
                  <select
                    value={selected.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="rounded border border-muted bg-transparent px-2 py-1 text-xs"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select
                    value={selected.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className="rounded border border-muted bg-transparent px-2 py-1 text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
                        message.senderType === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p>{message.body}</p>
                    </div>
                  </div>
                ))}
              </div>

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
                  placeholder="Reply to client..."
                  className="rounded-none"
                />
                <Button onClick={handleReply} disabled={isPending || !reply.trim()} className="rounded-none">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
