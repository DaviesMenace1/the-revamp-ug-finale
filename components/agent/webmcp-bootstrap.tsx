'use client'

import { useEffect } from 'react'

type ModelContextTool = {
  name: string
  title?: string
  description: string
  inputSchema: Record<string, unknown>
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }
  execute: (input: Record<string, unknown>, context: { signal: AbortSignal }) => Promise<string>
}

type ModelContext = {
  registerTool: (tool: ModelContextTool, options?: { signal?: AbortSignal }) => Promise<void>
}

type WebMcpDocument = Document & { modelContext?: ModelContext }
type WebMcpNavigator = Navigator & { modelContext?: ModelContext }

export default function WebMcpBootstrap() {
  useEffect(() => {
    const modelContext = (document as WebMcpDocument).modelContext || (navigator as WebMcpNavigator).modelContext
    if (!modelContext?.registerTool) return
    const controller = new AbortController()
    const publicPage = async (input: Record<string, unknown>, context: { signal: AbortSignal }) => {
      const path = typeof input.path === 'string' && input.path.startsWith('/') ? input.path : '/'
      const response = await fetch(`/api/agent/markdown?path=${encodeURIComponent(path)}`, { signal: context.signal, headers: { Accept: 'text/markdown' } })
      if (!response.ok) throw new Error('The public information service is temporarily unavailable.')
      return response.text()
    }
    const search = async (input: Record<string, unknown>, context: { signal: AbortSignal }) => {
      const query = typeof input.query === 'string' ? input.query.trim() : ''
      if (!query) throw new Error('A search query is required.')
      const response = await fetch('/api/agent/search', { method: 'POST', signal: context.signal, headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ query, limit: 10 }) })
      if (!response.ok) throw new Error('The public search service is temporarily unavailable.')
      return JSON.stringify(await response.json())
    }
    void modelContext.registerTool({ name: 'read_public_page', title: 'Read public page', description: 'Read a safe public page from The Revamp UG as concise Markdown.', inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'Public path such as /services or /portfolio' } }, required: ['path'] }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: publicPage }, { signal: controller.signal })
    void modelContext.registerTool({ name: 'search_public_content', title: 'Search public content', description: 'Search current published products, services, projects, and journal articles.', inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Search terms' } }, required: ['query'] }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: search }, { signal: controller.signal })
    return () => controller.abort()
  }, [])

  return null
}
