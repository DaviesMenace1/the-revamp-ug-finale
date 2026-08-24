'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'
import { sendClientMessage, markClientMessagesRead } from '@/lib/actions/messages'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Support', href: '/client/tickets' },
  { label: 'Documents', href: '/client/documents' },
]

type Message = {
  id: string
  senderType: string
  senderName: string | null
  body: string
  createdAt: string
}

export default function MessagesClient({
  initialMessages = [],
  loadError = null,
}: {
  initialConversationId: string | null
  initialMessages: Message[]
  loadError?: string | null
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [isPending, startTransition] = useTransition()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    markClientMessagesRead()
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function handleSend() {
    if (!draft.trim()) return
    const body = draft
    setDraft('')

    // Optimistic append
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      senderType: 'client',
      senderName: 'You',
      body,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    startTransition(async () => {
      const res = await sendClientMessage(body)
      if (!res.success) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
        alert(res.error || 'Failed to send message.')
      }
    })
  }

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="mx-auto max-w-3xl px-6 py-10 md:px-8">
        <h1 className="font-serif text-3xl font-light text-foreground">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send a message and our team will get back to you here.
        </p>

        {loadError && (
          <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <span>{loadError}</span>
            <button type="button" onClick={() => window.location.reload()} className="min-h-11 shrink-0 font-medium underline underline-offset-4">Retry</button>
          </div>
        )}

        <div className="mt-6 flex h-[60vh] flex-col rounded-lg border border-border/20">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground mt-10">
                No messages yet — say hello!
              </p>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderType === 'client' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
                    message.senderType === 'client'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {message.senderType !== 'client' && (
                    <p className="mb-0.5 text-xs font-medium opacity-70">
                      {message.senderName || 'Team'}
                    </p>
                  )}
                  <p>{message.body}</p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
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
              placeholder="Type a message..."
              className="rounded-none"
            />
            <Button onClick={handleSend} disabled={isPending || !draft.trim()} className="rounded-none">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
