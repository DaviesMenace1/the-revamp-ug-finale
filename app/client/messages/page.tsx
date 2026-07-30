'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send } from 'lucide-react'
import { useState } from 'react'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Documents', href: '/client/documents' },
]

export default function ClientMessages() {
  const [selectedChat, setSelectedChat] = useState('team')
  const [message, setMessage] = useState('')

  const conversations = [
    {
      id: 'team',
      name: 'Design Team',
      lastMessage: 'Design concepts are ready for review',
      timestamp: '2 hours ago',
      unread: 0,
    },
    {
      id: 'sales',
      name: 'Sales Support',
      lastMessage: 'Your order has been confirmed',
      timestamp: '5 hours ago',
      unread: 0,
    },
    {
      id: 'installation',
      name: 'Installation Team',
      lastMessage: 'We&apos;re ready to schedule installation',
      timestamp: '1 day ago',
      unread: 1,
    },
  ]

  const messages = {
    team: [
      { id: 1, sender: 'Design Team', text: 'Hi! We&apos;ve completed the initial design concepts.', timestamp: '3 hours ago', isUser: false },
      { id: 2, sender: 'You', text: 'Great! When can I see them?', timestamp: '2 hours 45 min ago', isUser: true },
      { id: 3, sender: 'Design Team', text: 'Design concepts are ready for review', timestamp: '2 hours ago', isUser: false },
    ],
    sales: [
      { id: 1, sender: 'Sales Support', text: 'Thank you for your order!', timestamp: '5 hours ago', isUser: false },
      { id: 2, sender: 'Sales Support', text: 'Your order has been confirmed', timestamp: '5 hours ago', isUser: false },
    ],
    installation: [
      { id: 1, sender: 'Installation Team', text: 'We&apos;re ready to schedule installation', timestamp: '1 day ago', isUser: false },
    ],
  }

  return (
    <PortalLayout
      portalName="Client Portal"
      portalSlug="client"
      navItems={clientNavItems}
    >
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">
            Messages
          </h1>
          <p className="text-muted-foreground">
            Communicate directly with our team about your projects and orders.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 h-[500px]">
          {/* Conversations List */}
          <div className="border border-border/20 rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border/20">
              <p className="font-medium text-foreground text-sm">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedChat(conv.id)}
                  className={`w-full p-4 text-left border-b border-border/10 hover:bg-muted/50 transition-colors ${
                    selectedChat === conv.id ? 'bg-primary/5 border-b border-primary/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{conv.name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
                    </div>
                    {conv.unread > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full flex-shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 border border-border/20 rounded-lg overflow-hidden flex flex-col bg-muted/20">
            {/* Chat Header */}
            <div className="p-4 border-b border-border/20 bg-background">
              <h3 className="font-medium text-foreground">
                {conversations.find(c => c.id === selectedChat)?.name}
              </h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages[selectedChat as keyof typeof messages]?.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border border-border/20'
                    }`}
                  >
                    {!msg.isUser && <p className="text-xs font-medium mb-1 opacity-70">{msg.sender}</p>}
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs opacity-60 mt-1">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border/20 bg-background space-y-3">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="rounded-none border-border/20"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      setMessage('')
                    }
                  }}
                />
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Press Enter to send</p>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
