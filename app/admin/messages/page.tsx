import { db } from '@/lib/db/client'
import { conversations, users } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { safeQuery } from '@/lib/server/safe-query'
import MessagesInboxClient from './messages-inbox-client'

export const dynamic = 'force-dynamic'

export default async function AdminMessagesPage() {
  const result = await safeQuery(
    db
      .select({
        id: conversations.id,
        subject: conversations.subject,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        adminUnreadCount: conversations.adminUnreadCount,
        clientEmail: users.email,
        clientFirstName: users.firstName,
        clientLastName: users.lastName,
      })
      .from(conversations)
      .leftJoin(users, eq(conversations.userId, users.id))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(100),
    'admin conversations',
    [],
  )

  const formatted = result.data.map((row) => ({
    ...row,
    lastMessageAt: row.lastMessageAt.toISOString(),
  }))

  return <MessagesInboxClient
    initialConversations={formatted}
    initialLoadError={result.error ? 'The latest conversations could not be loaded. You can retry from the inbox.' : null}
  />
}
