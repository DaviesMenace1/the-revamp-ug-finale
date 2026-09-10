'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Check, CheckCheck, FileText, Link2, Loader2, MessageSquare, Paperclip, RefreshCw, Send, X } from '@/components/ui/luxury-icons'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getClientConversationMessages, markClientMessagesRead, prepareMessageAttachment, sendClientMessage } from '@/lib/actions/messages'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Support', href: '/client/tickets' },
  { label: 'Documents', href: '/client/documents' },
]

const QUICK_STARTERS = [
  'I would like an update on my project.',
  'I have a question about my order.',
  'I need help with my consultation.',
]

const MAX_MESSAGE_LENGTH = 2000
const MAX_ATTACHMENTS = 5

export type MessageAttachment = {
  kind: 'file' | 'link'
  key?: string
  filename?: string
  mimeType?: string
  size?: number
  label?: string
  href?: string
}

type Message = {
  id: string
  senderType: string
  senderName: string | null
  body: string
  attachments?: MessageAttachment[] | null
  deliveredAt?: string | null
  readAt?: string | null
  createdAt: string
  deliveryState?: 'sending' | 'sent'
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('en-UG', { weekday: 'short', month: 'short', day: 'numeric' })
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString('en-UG', { hour: 'numeric', minute: '2-digit' })
}

function sameDay(first: string, second: string) {
  return new Date(first).toLocaleDateString() === new Date(second).toLocaleDateString()
}

function attachmentHref(key: string) {
  return `/api/messages/attachments?key=${encodeURIComponent(key)}`
}

function deliveryLabel(message: Message) {
  if (message.deliveryState === 'sending') return 'Sending'
  if (message.readAt) return 'Seen'
  if (message.deliveredAt) return 'Delivered'
  return 'Sent'
}

export default function MessagesClient({
  initialConversationId,
  initialMessages = [],
  loadError = null,
}: {
  initialConversationId: string | null
  initialMessages: Message[]
  loadError?: string | null
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [attachments, setAttachments] = useState<MessageAttachment[]>([])
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(loadError || '')
  const [lastUpdated, setLastUpdated] = useState<string | null>(initialMessages.length ? new Date().toISOString() : null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const pendingCount = useMemo(() => messages.filter((message) => message.deliveryState === 'sending').length, [messages])

  async function refreshMessages(silent = false) {
    if (!silent) setRefreshing(true)
    const result = await getClientConversationMessages()
    if (result.success) {
      setMessages(result.messages as Message[])
      setLastUpdated(new Date().toISOString())
      setError('')
      await markClientMessagesRead()
    } else if (!silent) {
      setError(result.error || 'Messages are temporarily unavailable.')
    }
    if (!silent) setRefreshing(false)
  }

  useEffect(() => {
    markClientMessagesRead()
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshMessages(true)
    }, 15000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (attachments.length >= MAX_ATTACHMENTS) {
      setError(`You can attach up to ${MAX_ATTACHMENTS} files per message.`)
      return
    }
    setError('')
    setUploadingAttachment(true)
    try {
      const prepared = await prepareMessageAttachment(file.name, file.type)
      if (!prepared.success) throw new Error(prepared.error || 'The attachment could not be prepared.')
      if (!prepared.url || !prepared.key || file.size > prepared.maxBytes) throw new Error('The attachment could not be prepared correctly.')
      const response = await fetch(prepared.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
      if (!response.ok) throw new Error('The attachment could not be uploaded. Please try again.')
      setAttachments((current) => [...current, { kind: 'file', key: prepared.key, filename: file.name, mimeType: file.type, size: file.size }])
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'The attachment could not be uploaded.')
    } finally {
      setUploadingAttachment(false)
    }
  }

  function handleSend() {
    const body = draft.trim()
    if ((!body && attachments.length === 0) || isPending || uploadingAttachment || body.length > MAX_MESSAGE_LENGTH) return
    setDraft('')
    const sentAttachments = attachments
    setAttachments([])
    setError('')

    const optimisticId = `temp-${Date.now()}`
    const optimistic: Message = { id: optimisticId, senderType: 'client', senderName: 'You', body, attachments: sentAttachments, createdAt: new Date().toISOString(), deliveryState: 'sending' }
    setMessages((prev) => [...prev, optimistic])

    startTransition(async () => {
      const result = await sendClientMessage(body, sentAttachments)
      if (!result.success) {
        setMessages((prev) => prev.filter((message) => message.id !== optimisticId))
        setDraft(body)
        setAttachments(sentAttachments)
        setError(result.error || 'Failed to send message. Please try again.')
        return
      }
      setMessages((prev) => prev.map((message) => message.id === optimisticId ? { ...message, deliveryState: 'sent', id: result.message?.id || message.id } : message))
      setLastUpdated(new Date().toISOString())
    })
  }

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 md:px-8">
        <header className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Studio inbox</p><h1 className="mt-2 font-serif text-4xl font-light text-foreground">Messages</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Keep project, order, and consultation conversations together. New replies are checked while you are viewing the inbox.</p></div><Button type="button" variant="outline" onClick={() => void refreshMessages()} disabled={refreshing} className="min-h-11 rounded-none self-start sm:self-auto">{refreshing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}Refresh</Button></header>

        {(error || loadError) && <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><span>{error || loadError}</span><button type="button" onClick={() => void refreshMessages()} className="min-h-11 shrink-0 font-medium underline underline-offset-4">Retry</button></div>}

        <div className="mt-6 overflow-hidden rounded-xl border border-border/70 bg-card shadow-soft"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/20 px-4 py-3 text-xs text-muted-foreground sm:px-5"><span className="flex items-center gap-2"><MessageSquare className="size-4 text-primary" />{initialConversationId ? 'Conversation with The Revamp UG' : 'New conversation'}</span><span>{lastUpdated ? `Updated ${timeLabel(lastUpdated)}` : 'Ready when you are'}</span></div>

          <div className="flex min-h-[420px] max-h-[60vh] flex-col gap-4 overflow-y-auto p-4 sm:p-6">{messages.length === 0 && <div className="m-auto max-w-md text-center"><MessageSquare className="mx-auto size-9 text-gold" /><p className="mt-4 font-serif text-2xl text-foreground">Start the conversation</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Ask about a project, an order, or a consultation and the studio team will reply here.</p></div>}{messages.map((message, index) => { const previous = messages[index - 1]; const showDate = !previous || !sameDay(previous.createdAt, message.createdAt); const isClient = message.senderType === 'client'; return <div key={message.id}>{showDate && <p className="my-2 text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{dateLabel(message.createdAt)}</p>}<div className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] rounded-xl px-4 py-3 text-sm shadow-sm sm:max-w-[75%] ${isClient ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}><div className="flex items-center justify-between gap-4"><p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${isClient ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{isClient ? 'You' : message.senderName || 'Studio team'}</p><time dateTime={message.createdAt} className={`text-[10px] ${isClient ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{timeLabel(message.createdAt)}</time></div><p className="mt-2 whitespace-pre-wrap leading-6">{message.body}</p>{message.attachments && message.attachments.length > 0 && <div className="mt-3 space-y-2">{message.attachments.map((attachment, attachmentIndex) => attachment.kind === 'link' && attachment.href && attachment.label ? <Link key={`${message.id}-link-${attachmentIndex}`} href={attachment.href} className={`flex items-center gap-2 rounded border px-3 py-2 text-xs font-medium ${isClient ? 'border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10' : 'border-border text-foreground hover:bg-background'}`}><Link2 className="size-4 shrink-0" />{attachment.label}</Link> : attachment.kind === 'file' && attachment.key ? <a key={`${message.id}-file-${attachmentIndex}`} href={attachmentHref(attachment.key)} target="_blank" rel="noreferrer" className={`flex items-center gap-2 rounded border px-3 py-2 text-xs ${isClient ? 'border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10' : 'border-border text-foreground hover:bg-background'}`}><FileText className="size-4 shrink-0" /><span className="truncate">{attachment.filename || 'Attachment'}</span></a> : null)}</div>}{isClient && <span className="mt-2 flex items-center justify-end gap-1 text-[10px] text-primary-foreground/70">{deliveryLabel(message) === 'Sending' ? <Loader2 className="size-3 animate-spin" /> : deliveryLabel(message) === 'Seen' ? <CheckCheck className="size-3" /> : deliveryLabel(message) === 'Delivered' ? <CheckCheck className="size-3" /> : <Check className="size-3" />}{deliveryLabel(message)}</span>}</div></div></div>})}<div ref={endRef} /></div>

          <div className="border-t border-border/70 bg-muted/10 p-4 sm:p-5"><div className="mb-3 flex flex-wrap gap-2">{QUICK_STARTERS.map((starter) => <button key={starter} type="button" onClick={() => setDraft(starter)} className="min-h-9 rounded-full border border-border/70 px-3 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">{starter}</button>)}</div>{attachments.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{attachments.map((attachment, index) => <span key={`${attachment.key}-${index}`} className="flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs text-foreground"><FileText className="size-3.5 shrink-0 text-primary" /><span className="max-w-[180px] truncate">{attachment.filename}</span><button type="button" onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Remove ${attachment.filename}`}><X className="size-3.5" /></button></span>)}</div>}<div className="flex items-end gap-2"><input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.doc,.docx,.rtf" onChange={handleFileSelected} className="sr-only" /><Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingAttachment || attachments.length >= MAX_ATTACHMENTS} className="min-h-11 min-w-11 rounded-none px-3" aria-label="Attach a file">{uploadingAttachment ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}</Button><Textarea value={draft} onChange={(event) => setDraft(event.target.value.slice(0, MAX_MESSAGE_LENGTH))} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend() } }} placeholder="Write a message… (Enter to send, Shift + Enter for a new line)" rows={3} className="min-h-20 resize-none rounded-none bg-background" aria-label="Message" /><Button onClick={handleSend} disabled={isPending || uploadingAttachment || (!draft.trim() && attachments.length === 0)} className="min-h-11 rounded-none" aria-label="Send message"><Send className="size-4" /></Button></div><div className="mt-2 flex justify-between gap-3 text-[11px] text-muted-foreground"><span>{pendingCount > 0 ? 'Sending securely…' : 'Images and documents up to 15 MB can be attached.'}</span><span>{draft.length}/{MAX_MESSAGE_LENGTH}</span></div></div>
        </div>
      </div>
    </PortalLayout>
  )
}

