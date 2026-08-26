import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { conversations, conversationMessages } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import MessagesClient, { type MessageAttachment } from './messages-client'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function ClientMessagesPage() {
  const user = await getOrCreateCurrentUser()
  if (!user) redirect('/sign-in?redirect_url=/client/messages')

  const conversationResult = await safeQuery(
    db.query.conversations.findFirst({
      where: eq(conversations.userId, user.id),
    }),
    'client conversation',
    null,
  )
  const conversation = conversationResult.data
  const messagesResult = await safeQuery(
    conversation
      ? db
          .select()
          .from(conversationMessages)
          .where(eq(conversationMessages.conversationId, conversation.id))
          .orderBy(asc(conversationMessages.createdAt))
      : Promise.resolve([]),
    'client messages',
    [],
  )

  const formattedMessages = messagesResult.data.map((m) => ({
    ...m,
    attachments: (Array.isArray(m.attachments) ? m.attachments : []) as MessageAttachment[],
    deliveredAt: m.deliveredAt?.toISOString() ?? null,
    readAt: m.readAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  }))

  return (
    <MessagesClient
      initialConversationId={conversation?.id ?? null}
      initialMessages={formattedMessages}
      loadError={conversationResult.error || messagesResult.error ? 'Messages are temporarily unavailable. You can retry the page.' : null}
    />
  )
}

