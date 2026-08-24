import { NextRequest, NextResponse } from 'next/server'
import { or, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { clientDocuments, financialDocuments, invoices, quotes } from '@/lib/db/schema'
import { getCurrentUserWithRole } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

function safeFileName(value: string) {
  const cleaned = value.replace(/[\\/:*?"<>|\r\n]+/g, '-').trim()
  return cleaned || 'revamp-document'
}

function absoluteUrl(value: string, request: NextRequest) {
  try {
    return new URL(value, request.url).toString()
  } catch {
    return value
  }
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url')?.trim()
  if (!rawUrl) return NextResponse.json({ success: false, error: 'A document URL is required.' }, { status: 400 })

  const authorization = await getCurrentUserWithRole()
  if (authorization.reason === 'error') return NextResponse.json({ success: false, error: 'Your account could not be confirmed.' }, { status: 503 })
  if (!authorization.authorized || !authorization.user) return NextResponse.json({ success: false, error: 'Sign in to download this document.' }, { status: 401 })

  const requestedUrl = absoluteUrl(rawUrl, request)
  const isAdmin = authorization.user.role === 'admin'
  let fileUrl: string | null = null
  let fileName = 'revamp-document'
  let ownerId: string | null = null

  const clientDocument = await db.select({ userId: clientDocuments.userId, name: clientDocuments.name, fileUrl: clientDocuments.fileUrl }).from(clientDocuments).where(or(eq(clientDocuments.fileUrl, rawUrl), eq(clientDocuments.fileUrl, requestedUrl))).limit(1)
  if (clientDocument[0]) {
    ownerId = clientDocument[0].userId
    fileUrl = clientDocument[0].fileUrl
    fileName = clientDocument[0].name
  }

  if (!fileUrl) {
    const financialDocument = await db.select({ userId: financialDocuments.userId, fileName: financialDocuments.fileName, fileUrl: financialDocuments.fileUrl }).from(financialDocuments).where(or(eq(financialDocuments.fileUrl, rawUrl), eq(financialDocuments.fileUrl, requestedUrl))).limit(1)
    if (financialDocument[0]?.fileUrl) {
      ownerId = financialDocument[0].userId
      fileUrl = financialDocument[0].fileUrl
      fileName = financialDocument[0].fileName || fileName
    }
  }

  if (!fileUrl) {
    const quote = await db.select({ userId: quotes.userId, quoteNumber: quotes.quoteNumber, pdfUrl: quotes.pdfUrl }).from(quotes).where(or(eq(quotes.pdfUrl, rawUrl), eq(quotes.pdfUrl, requestedUrl))).limit(1)
    if (quote[0]?.pdfUrl) {
      ownerId = quote[0].userId
      fileUrl = quote[0].pdfUrl
      fileName = `${quote[0].quoteNumber}.pdf`
    }
  }

  if (!fileUrl) {
    const invoice = await db.select({ userId: invoices.userId, invoiceNumber: invoices.invoiceNumber, pdfUrl: invoices.pdfUrl, receiptUrl: invoices.receiptUrl }).from(invoices).where(or(eq(invoices.pdfUrl, rawUrl), eq(invoices.pdfUrl, requestedUrl), eq(invoices.receiptUrl, rawUrl), eq(invoices.receiptUrl, requestedUrl))).limit(1)
    if (invoice[0]) {
      const isReceipt = invoice[0].receiptUrl === rawUrl || invoice[0].receiptUrl === requestedUrl
      const matchedUrl = isReceipt ? invoice[0].receiptUrl : invoice[0].pdfUrl
      if (matchedUrl) {
        ownerId = invoice[0].userId
        fileUrl = matchedUrl
        fileName = `${invoice[0].invoiceNumber}${isReceipt ? '-receipt' : ''}.pdf`
      }
    }
  }

  if (!fileUrl || (!isAdmin && ownerId !== authorization.user.id)) return NextResponse.json({ success: false, error: 'This document is not available to your account.' }, { status: 404 })

  try {
    const upstream = await fetch(fileUrl, { cache: 'no-store', redirect: 'follow' })
    if (!upstream.ok || !upstream.body) return NextResponse.json({ success: false, error: 'The stored document is unavailable.' }, { status: 502 })

    const headers = new Headers()
    headers.set('content-type', upstream.headers.get('content-type') || 'application/octet-stream')
    headers.set('content-disposition', `attachment; filename="${safeFileName(fileName)}"`)
    const length = upstream.headers.get('content-length')
    if (length) headers.set('content-length', length)
    return new Response(upstream.body, { status: 200, headers })
  } catch (error) {
    console.error('[documents/download] stored file fetch failed:', error)
    return NextResponse.json({ success: false, error: 'The stored document could not be downloaded.' }, { status: 502 })
  }
}
