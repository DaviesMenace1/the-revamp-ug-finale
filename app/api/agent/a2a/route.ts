import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/redis'
import { getPublicAgentMarkdown, searchPublicAgentContent } from '@/lib/agent-public'

const A2A_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'A2A-Version': '1.0',
}

function a2aResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: A2A_HEADERS })
}

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
    messageId: randomUUID(),
    role: 'ROLE_AGENT',
    parts: [{ text, mediaType: 'text/plain' }],
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
    return a2aResponse({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Invalid JSON payload.' } }, 400)
  }

  const method = typeof body.method === 'string' ? body.method : 'SendMessage'
  const supportedMethods = new Set(['SendMessage', 'message/send', 'message:send', 'tasks/send'])
  if (!supportedMethods.has(method)) {
    return a2aResponse({
      jsonrpc: '2.0',
      id: body.id ?? null,
      error: { code: -32004, message: 'This read-only agent supports public-information message requests only.' },
    }, 400)
  }

  const query = messageText(body)
  if (!query) {
    return a2aResponse({
      jsonrpc: '2.0',
      id: body.id ?? null,
      error: { code: -32602, message: 'Include a text message in the request.' },
    }, 400)
  }

  try {
    const lower = query.toLowerCase()
    const requestsLiveSearch = /\b(find|search|show me|which|published)\b/.test(lower)
    const text = requestsLiveSearch
      ? JSON.stringify(await searchPublicAgentContent(query, 10))
      : await getPublicAgentMarkdown('/')

    return a2aResponse({
      jsonrpc: '2.0',
      id: body.id ?? null,
      result: { message: responseMessage(text) },
    })
  } catch (error) {
    console.error('[public-a2a] request failed:', error)
    return a2aResponse({
      jsonrpc: '2.0',
      id: body.id ?? null,
      error: { code: -32603, message: 'The public information service is temporarily unavailable.' },
    }, 503)
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...A2A_HEADERS,
      Allow: 'POST, OPTIONS',
    },
  })
}
