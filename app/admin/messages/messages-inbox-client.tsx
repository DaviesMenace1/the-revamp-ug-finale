'use client'

import { useState, useTransition } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, MessageSquare } from 'lucide-react'
import {
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
}

export default function MessagesInboxClient({
  initialConversations = [],
}: {
  initialConversations: ConversationSummary[]
}) {
  const [conversationsList, setConversationsList] = useState(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function openConversation(id: string) {
    setSelectedId(id)
    setLoadingMessages(true)
    const res = await getConversationMessages(id)
    setMessages(res.messages as Message[])
    setLoadingMessages(false)

    setConversationsList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, adminUnreadCount: 0 } : c)),
    )
    markAdminMessagesRead(id)
  }

  function handleSend() {
    if (!selectedId || !draft.trim()) return
    const body = draft
    setDraft('')

    startTransition(async () => {
      const res = await sendAdminReply(selectedId, body)
      if (res.success && res.message) {
        setMessages((prev) => [
          ...prev,
          { ...res.message, createdAt: new Date().toISOString() } as Message,
        ])
      }
    })
  }

  function handleStatusChange(status: string) {
    if (!selectedId) return
    startTransition(async () => {
      const res = await updateConversationStatus(selectedId, status)
      if (res.success) {
        setConversationsList((prev) =>
          prev.map((c) => (c.id === selectedId ? { ...c, status } : c)),
        )
      }
    })
  }

  const selected = conversationsList.find((c) => c.id === selectedId)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-serif text-4xl font-light text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-2">Conversations from client portal users</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="max-h-[70vh] overflow-y-auto p-0">
          {conversationsList.map((c) => (
            <button
              key={c.id}
              onClick={() => openConversation(c.id)}
              className={`flex w-full items-start justify-between gap-2 border-b border-border/20 p-4 text-left hover:bg-muted/50 ${
                selectedId === c.id ? 'bg-muted/60' : ''
              }`}
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {[c.clientFirstName, c.clientLastName].filter(Boolean).join(' ') || c.clientEmail}
                </p>
                <p className="text-xs text-muted-foreground">{c.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(c.lastMessageAt).toLocaleString()}
                </p>
              </div>
              {c.adminUnreadCount > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  {c.adminUnreadCount}
                </span>
              )}
            </button>
          ))}

          {conversationsList.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</p>
          )}
        </Card>

        <Card className="flex h-[70vh] flex-col p-0">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="mb-2 h-8 w-8" />
              <p className="text-sm">Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border/20 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {[selected.clientFirstName, selected.clientLastName].filter(Boolean).join(' ') ||
                      selected.clientEmail}
                  </p>
                  <p className="text-xs text-muted-foreground">{selected.clientEmail}</p>
                </div>
                <select
                  value={selected.status ?? 'open'}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="rounded border border-muted bg-transparent px-2 py-1 text-xs"
                >
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {loadingMessages && (
                  <p className="text-center text-sm text-muted-foreground">Loading…</p>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
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
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Type a reply..."
                  className="rounded-none"
                />
                <Button onClick={handleSend} disabled={isPending || !draft.trim()} className="rounded-none">
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
