import { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/redis'
import { getPublicAgentMarkdown, searchPublicAgentContent } from '@/lib/agent-public'

const SERVER_INFO = { name: 'the-revamp-ug-public-information', version: '1.0.0' }
const PROTOCOL_VERSION = '2025-06-18'

function rpcResult(id: unknown, result: unknown) {
  return Response.json({ jsonrpc: '2.0', id, result }, { headers: { 'MCP-Protocol-Version': PROTOCOL_VERSION } })
}

function rpcError(id: unknown, code: number, message: string) {
  return Response.json({ jsonrpc: '2.0', id, error: { code, message } }, { status: 400, headers: { 'MCP-Protocol-Version': PROTOCOL_VERSION } })
}

function argumentString(argumentsValue: unknown, key: string) {
  if (!argumentsValue || typeof argumentsValue !== 'object' || Array.isArray(argumentsValue)) return ''
  const value = (argumentsValue as Record<string, unknown>)[key]
  return typeof value === 'string' ? value.trim() : ''
}

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const limited = await checkRateLimit(request, 'api')
  if (limited) return limited
  let body: { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown }
  try {
    body = await request.json() as typeof body
  } catch {
    return rpcError(null, -32700, 'The MCP request must be valid JSON.')
  }
  const id = body.id ?? null
  const method = typeof body.method === 'string' ? body.method : ''
  if (body.jsonrpc !== '2.0' || !method) return rpcError(id, -32600, 'The MCP request must use JSON-RPC 2.0.')
  if (method === 'notifications/initialized') return new Response(null, { status: 202, headers: { 'MCP-Protocol-Version': PROTOCOL_VERSION } })
  if (method === 'ping') return rpcResult(id, {})
  if (method === 'initialize') return rpcResult(id, { protocolVersion: PROTOCOL_VERSION, capabilities: { tools: {} }, serverInfo: SERVER_INFO })
  if (method === 'tools/list') {
    return rpcResult(id, {
      tools: [
        { name: 'search_public_content', title: 'Search public content', description: 'Search current published products, portfolio projects, services, and journal articles.', inputSchema: { type: 'object', properties: { query: { type: 'string', minLength: 1 }, limit: { type: 'integer', minimum: 1, maximum: 20 } }, required: ['query'] } },
        { name: 'read_public_page', title: 'Read a public page', description: 'Read the public website information for a safe public path as Markdown.', inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'A public site path such as /services or /portfolio' } }, required: ['path'] } },
      ],
    })
  }
  if (method !== 'tools/call') return rpcError(id, -32601, 'This MCP server does not support that method.')
  const params = body.params && typeof body.params === 'object' ? body.params as Record<string, unknown> : {}
  const name = typeof params.name === 'string' ? params.name : ''
  try {
    if (name === 'search_public_content') {
      const query = argumentString(params.arguments, 'query')
      if (!query) return rpcError(id, -32602, 'The query argument is required.')
      const limitValue = argumentString(params.arguments, 'limit')
      const limit = limitValue ? Number(limitValue) : 10
      const results = await searchPublicAgentContent(query, Number.isFinite(limit) ? limit : 10)
      return rpcResult(id, { content: [{ type: 'text', text: JSON.stringify(results) }], isError: false })
    }
    if (name === 'read_public_page') {
      const path = argumentString(params.arguments, 'path')
      if (!path) return rpcError(id, -32602, 'The path argument is required.')
      const markdown = await getPublicAgentMarkdown(path)
      return rpcResult(id, { content: [{ type: 'text', text: markdown }], isError: false })
    }
    return rpcError(id, -32602, 'That public tool is not available.')
  } catch (error) {
    console.error('[public-mcp] tool failed:', error)
    return rpcResult(id, { content: [{ type: 'text', text: 'The public information service is temporarily unavailable.' }], isError: true })
  }
}

export function GET() {
  return new Response('This MCP endpoint accepts POST requests for JSON-RPC tool calls.', { status: 405, headers: { Allow: 'POST', 'Content-Type': 'text/plain; charset=utf-8', 'MCP-Protocol-Version': PROTOCOL_VERSION } })
}
