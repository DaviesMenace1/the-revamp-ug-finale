import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { conversations, conversationMessages } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import MessagesClient from './messages-client'

export const dynamic = 'force-dynamic'

export default async function ClientMessagesPage() {
  const user = await getOrCreateCurrentUser()
  if (!user) redirect('/sign-in?redirect_url=/client/messages')

  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.userId, user.id),
  })

  const messages = conversation
    ? await db
        .select()
        .from(conversationMessages)
        .where(eq(conversationMessages.conversationId, conversation.id))
        .orderBy(asc(conversationMessages.createdAt))
    : []

  const formattedMessages = messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }))

  return (
    <MessagesClient
      initialConversationId={conversation?.id ?? null}
      initialMessages={formattedMessages}
    />
  )
}

