'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { CheckCheck, Inbox, Loader2, MessageSquare, RefreshCw, Search, Send } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  getAdminConversationSummaries,
  getConversationMessages,
  sendAdminReply,
  markAdminMessagesRead,
  updateConversationStatus,
} from '@/lib/actions/messages'

type ConversationSummary = {
  id: string
  subject: string | null
  status: string | null
  lastMessageAt: string
  adminUnreadCount: number
  clientEmail: string | null
  clientFirstName: string | null
  clientLastName: string | null
}

type Message = {
  id: string
  senderType: string
  senderName: string | null
  body: string
  createdAt: string
  deliveryState?: 'sending' | 'sent'
}

const QUICK_REPLIES = [
  'Thanks for reaching out. We are reviewing this and will update you shortly.',
  'Could you share a little more detail so we can assist you accurately?',
  'Your message has been received. We will follow up with the next steps.',
]

function personName(conversation: ConversationSummary) {
  return [conversation.clientFirstName, conversation.clientLastName].filter(Boolean).join(' ') || conversation.clientEmail || 'Client'
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' })
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('en-UG', { weekday: 'short', month: 'short', day: 'numeric' })
}

function sameDay(first: string, second: string) {
  return new Date(first).toLocaleDateString() === new Date(second).toLocaleDateString()
}

export default function MessagesInboxClient({ initialConversations = [] }: { initialConversations: ConversationSummary[] }) {
  const [conversationsList, setConversationsList] = useState(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved' | 'archived'>('all')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const endRef = useRef<HTMLDivElement>(null)

  const filteredConversations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return conversationsList.filter((conversation) => {
      const matchesStatus = statusFilter === 'all' || (conversation.status || 'open') === statusFilter
      const searchable = `${personName(conversation)} ${conversation.subject || ''} ${conversation.clientEmail || ''}`.toLowerCase()
      return matchesStatus && (!query || searchable.includes(query))
    })
  }, [conversationsList, searchTerm, statusFilter])

  const unreadCount = useMemo(() => conversationsList.reduce((total, conversation) => total + conversation.adminUnreadCount, 0), [conversationsList])
  const selected = conversationsList.find((conversation) => conversation.id === selectedId)

  async function refreshConversations(silent = false) {
    if (!silent) setRefreshing(true)
    const result = await getAdminConversationSummaries()
    if (result.success) {
      setConversationsList(result.conversations as ConversationSummary[])
      setLastUpdated(new Date().toISOString())
      setError('')
    } else if (!silent) {
      setError(result.error || 'Failed to refresh conversations.')
    }
    if (!silent) setRefreshing(false)
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshConversations(true)
    }, 20000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, selectedId])

  async function openConversation(id: string) {
    setSelectedId(id)
    setLoadingMessages(true)
    setError('')
    const result = await getConversationMessages(id)
    if (result.success) {
      setMessages(result.messages as Message[])
      setConversationsList((prev) => prev.map((conversation) => conversation.id === id ? { ...conversation, adminUnreadCount: 0 } : conversation))
      await markAdminMessagesRead(id)
    } else {
      setMessages([])
      setError(result.error || 'Failed to load messages.')
    }
    setLoadingMessages(false)
  }

  function handleSend() {
    if (!selectedId || !draft.trim() || isPending) return
    const body = draft.trim()
    setDraft('')
    setError('')

    startTransition(async () => {
      const result = await sendAdminReply(selectedId, body)
      if (result.success && result.message) {
        setMessages((prev) => [...prev, { ...result.message, createdAt: new Date().toISOString(), deliveryState: 'sent' } as Message])
        setConversationsList((prev) => prev.map((conversation) => conversation.id === selectedId ? { ...conversation, lastMessageAt: new Date().toISOString() } : conversation))
      } else {
        setDraft(body)
        setError(result.error || 'Failed to send reply. Please try again.')
      }
    })
  }

  function handleStatusChange(status: string) {
    if (!selectedId) return
    startTransition(async () => {
      const result = await updateConversationStatus(selectedId, status)
      if (result.success) {
        setConversationsList((prev) => prev.map((conversation) => conversation.id === selectedId ? { ...conversation, status } : conversation))
      } else {
        setError(result.error || 'Failed to update status.')
      }
    })
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Studio communications</p><h1 className="mt-2 font-serif text-4xl font-light text-foreground">Messages</h1><p className="mt-2 text-sm text-muted-foreground">Reply to clients, keep conversations organized, and stay on top of unread requests.</p></div>
        <Button type="button" variant="outline" onClick={() => void refreshConversations()} disabled={refreshing} className="min-h-11 rounded-none self-start sm:self-auto">{refreshing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}Refresh inbox</Button>
      </header>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"><span>{error}</span><button type="button" onClick={() => void refreshConversations()} className="font-medium underline underline-offset-4">Retry</button></div>}

      <section className="grid gap-3 sm:grid-cols-3"><Card className="border-border/70 p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Conversations</p><p className="mt-2 font-serif text-3xl text-foreground">{conversationsList.length}</p></Card><Card className="border-border/70 p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Unread messages</p><p className="mt-2 font-serif text-3xl text-foreground">{unreadCount}</p></Card><Card className="border-border/70 p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Open conversations</p><p className="mt-2 font-serif text-3xl text-foreground">{conversationsList.filter((conversation) => (conversation.status || 'open') === 'open').length}</p></Card></section>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="overflow-hidden p-0">
          <div className="space-y-3 border-b border-border/70 bg-muted/10 p-4"><div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Search conversations" placeholder="Search clients or subjects…" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="min-h-11 rounded-none pl-10" /></div><select aria-label="Filter conversations by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="min-h-11 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground"><option value="all">All statuses</option><option value="open">Open</option><option value="resolved">Resolved</option><option value="archived">Archived</option></select></div>
          <div className="max-h-[58vh] overflow-y-auto">{filteredConversations.map((conversation) => <button key={conversation.id} type="button" onClick={() => void openConversation(conversation.id)} className={`flex min-h-[88px] w-full items-start justify-between gap-3 border-b border-border/20 p-4 text-left transition-colors hover:bg-muted/50 ${selectedId === conversation.id ? 'bg-primary/5' : ''}`}><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-medium text-foreground">{personName(conversation)}</p>{conversation.adminUnreadCount > 0 && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}</div><p className="mt-1 truncate text-xs text-muted-foreground">{conversation.subject || 'General conversation'}</p><p className="mt-2 text-[11px] text-muted-foreground">{timeLabel(conversation.lastMessageAt)}</p></div>{conversation.adminUnreadCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">{conversation.adminUnreadCount}</span>}</button>)}{filteredConversations.length === 0 && <div className="p-8 text-center"><Inbox className="mx-auto size-7 text-gold" /><p className="mt-3 text-sm text-muted-foreground">No matching conversations.</p></div>}</div>
        </Card>

        <Card className="flex min-h-[620px] flex-col overflow-hidden p-0">
          {!selected ? <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-muted-foreground"><MessageSquare className="size-9 text-gold" /><p className="mt-4 font-serif text-2xl text-foreground">Select a conversation</p><p className="mt-2 max-w-sm text-sm leading-6">Choose a client message from the inbox to read and reply.</p></div> : <><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 p-4 sm:p-5"><div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{personName(selected)}</p><p className="mt-1 truncate text-xs text-muted-foreground">{selected.clientEmail || 'No email available'} · {selected.subject || 'General conversation'}</p>{lastUpdated && <p className="mt-1 text-[10px] text-muted-foreground">Inbox refreshed {timeLabel(lastUpdated)}</p>}</div><select aria-label="Conversation status" value={selected.status ?? 'open'} onChange={(event) => handleStatusChange(event.target.value)} disabled={isPending} className="min-h-10 rounded border border-muted bg-transparent px-2 py-1 text-xs text-foreground"><option value="open">Open</option><option value="resolved">Resolved</option><option value="archived">Archived</option></select></div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">{loadingMessages && <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading conversation…</div>}{!loadingMessages && messages.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No messages in this conversation yet.</p>}{messages.map((message, index) => { const previous = messages[index - 1]; const showDate = !previous || !sameDay(previous.createdAt, message.createdAt); const isAdmin = message.senderType === 'admin'; return <div key={message.id}>{showDate && <p className="my-2 text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{dateLabel(message.createdAt)}</p>}<div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] rounded-xl px-4 py-3 text-sm sm:max-w-[75%] ${isAdmin ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}><div className="flex items-center justify-between gap-4"><p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${isAdmin ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{isAdmin ? 'You' : message.senderName || 'Client'}</p><time dateTime={message.createdAt} className={`text-[10px] ${isAdmin ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{timeLabel(message.createdAt)}</time></div><p className="mt-2 whitespace-pre-wrap leading-6">{message.body}</p>{isAdmin && <span className="mt-2 flex items-center justify-end gap-1 text-[10px] text-primary-foreground/70"><CheckCheck className="size-3" />Sent</span>}</div></div></div>})}<div ref={endRef} /></div>

          <div className="border-t border-border/70 bg-muted/10 p-4 sm:p-5"><div className="mb-3 flex flex-wrap gap-2">{QUICK_REPLIES.map((reply) => <button key={reply} type="button" onClick={() => setDraft(reply)} className="min-h-9 rounded-full border border-border/70 px-3 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">{reply}</button>)}</div><div className="flex items-end gap-2"><Textarea value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 2000))} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend() } }} placeholder="Write a reply… (Enter to send)" rows={3} className="min-h-20 resize-none rounded-none bg-background" aria-label="Reply message" /><Button onClick={handleSend} disabled={isPending || !draft.trim()} className="min-h-11 rounded-none" aria-label="Send reply">{isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</Button></div><p className="mt-2 text-right text-[11px] text-muted-foreground">{draft.length}/2000 · Shift + Enter for a new line</p></div></>}
        </Card>
      </div>
    </div>
  )
}

