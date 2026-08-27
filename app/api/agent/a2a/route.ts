import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/redis'
import { getPublicAgentMarkdown, searchPublicAgentContent } from '@/lib/agent-public'

function textFromParts(value: unknown) {
  if (!Array.isArray(value)) return ''
  return value.map((part) => {
    if (!part || typeof part !== 'object') return ''
    const item = part as Record<string, unknown>
    return typeof item.text === 'string' ? item.text : ''
  }).filter(Boolean).join('\n').trim()
}

function messageText(body: Record<string, unknown>) {
  const message = body.message && typeof body.message === 'object' ? body.message as Record<string, unknown> : null
  const params = body.params && typeof body.params === 'object' ? body.params as Record<string, unknown> : null
  const nestedMessage = params?.message && typeof params.message === 'object' ? params.message as Record<string, unknown> : null
  return textFromParts(message?.parts || nestedMessage?.parts) || (typeof body.text === 'string' ? body.text.trim() : '')
}

function responseMessage(text: string) {
  return {
    kind: 'message',
    messageId: randomUUID(),
    role: 'ROLE_AGENT',
    parts: [{ kind: 'text', text }],
  }
}

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 'api')
  if (limited) return limited
  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return Response.json({ error: { code: 'INVALID_ARGUMENT', message: 'The A2A request must be valid JSON.' } }, { status: 400 })
  }
  const method = typeof body.method === 'string' ? body.method : 'message/send'
  if (!['message/send', 'tasks/send'].includes(method)) return Response.json({ error: { code: 'UNSUPPORTED_OPERATION', message: 'This read-only agent supports public-information message requests only.' } }, { status: 400 })
  const query = messageText(body)
  if (!query) return Response.json({ error: { code: 'INVALID_ARGUMENT', message: 'Include a text message in the request.' } }, { status: 400 })
  try {
    const lower = query.toLowerCase()
    const requestsLiveSearch = /\b(find|search|show me|which|published)\b/.test(lower)
    const text = requestsLiveSearch
      ? JSON.stringify(await searchPublicAgentContent(query, 10))
      : await getPublicAgentMarkdown('/')
    return Response.json({ jsonrpc: '2.0', id: body.id ?? null, result: responseMessage(text) }, { headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' } })
  } catch (error) {
    console.error('[public-a2a] request failed:', error)
    return Response.json({ error: { code: 'INTERNAL', message: 'The public information service is temporarily unavailable.' } }, { status: 503 })
  }
}
