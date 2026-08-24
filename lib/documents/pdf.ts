import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { CompanyProfile } from './company-profile'

export type FinancialDocumentLine = {
  description: string
  quantity: number
  unitPrice: number
}

export type FinancialDocumentInput = {
  documentType: string
  documentNumber: string
  issueDate: Date
  dueDate?: Date | null
  validUntil?: Date | null
  clientName: string
  clientEmail: string
  projectName?: string | null
  currency: string
  items: FinancialDocumentLine[]
  taxRate?: number
  discount?: number
  notes?: string | null
  terms?: string | null
  paymentMethod?: string | null
}

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 56
const GOLD = rgb(0.62, 0.48, 0.16)
const OLIVE = rgb(0.33, 0.36, 0.23)
const INK = rgb(0.12, 0.12, 0.1)
const MUTED = rgb(0.4, 0.4, 0.36)
const PAPER = rgb(0.96, 0.95, 0.91)

function formatMoney(amount: number, currency: string) {
  return `${new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(Math.max(0, amount))} ${currency}`
}

function titleForType(type: string) {
  return type
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function drawText(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color = INK) {
  page.drawText(text.slice(0, 105), { x, y, size, font, color })
}

function drawMultiline(page: PDFPage, text: string, x: number, y: number, width: number, font: PDFFont, size: number, color = INK) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) > width && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  lines.slice(0, 7).forEach((row, index) => drawText(page, row, x, y - index * (size + 3), font, size, color))
  return y - Math.min(lines.length, 7) * (size + 3)
}

function drawRule(page: PDFPage, y: number, color = rgb(0.82, 0.8, 0.72)) {
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.7, color })
}

export async function renderFinancialDocument(input: FinancialDocumentInput, profile: CompanyProfile): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const serif = await pdf.embedFont(StandardFonts.TimesRoman)
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])

  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: rgb(1, 1, 1) })
  page.drawRectangle({ x: PAGE_WIDTH - 4, y: 0, width: 4, height: PAGE_HEIGHT, color: GOLD })

  const logoPath = path.join(process.cwd(), 'public', 'brand', 'revamp-logo.png')
  try {
    const logo = await pdf.embedPng(await readFile(logoPath))
    const logoScale = Math.min(120 / logo.width, 48 / logo.height)
    page.drawImage(logo, {
      x: MARGIN,
      y: PAGE_HEIGHT - MARGIN - logo.height * logoScale,
      width: logo.width * logoScale,
      height: logo.height * logoScale,
    })
  } catch {
    drawText(page, profile.name.toUpperCase(), MARGIN, PAGE_HEIGHT - MARGIN - 25, bold, 13, OLIVE)
  }

  const headerX = 350
  drawText(page, titleForType(input.documentType).toUpperCase(), headerX, PAGE_HEIGHT - MARGIN - 4, bold, 13, OLIVE)
  drawText(page, input.documentNumber, headerX, PAGE_HEIGHT - MARGIN - 24, regular, 8.5, MUTED)
  drawText(page, `Issued ${input.issueDate.toLocaleDateString('en-UG')}`, headerX, PAGE_HEIGHT - MARGIN - 39, regular, 8.5, MUTED)

  let y = PAGE_HEIGHT - 145
  drawRule(page, y, GOLD)
  y -= 26

  drawText(page, profile.name.toUpperCase(), MARGIN, y, bold, 9, OLIVE)
  drawText(page, profile.address, MARGIN, y - 15, regular, 8.5, MUTED)
  drawText(page, profile.phone, MARGIN, y - 30, regular, 8.5, MUTED)
  drawText(page, profile.primaryEmail, MARGIN, y - 45, regular, 8.5, MUTED)

  drawText(page, 'BILL TO', 350, y, bold, 9, OLIVE)
  drawText(page, input.clientName || 'Client', 350, y - 15, regular, 9, INK)
  drawText(page, input.clientEmail, 350, y - 30, regular, 8.5, MUTED)
  if (input.projectName) drawText(page, input.projectName, 350, y - 45, regular, 8.5, MUTED)

  y -= 86
  page.drawRectangle({ x: MARGIN, y: y - 24, width: PAGE_WIDTH - 2 * MARGIN, height: 28, color: PAPER })
  drawText(page, 'DESCRIPTION', MARGIN + 12, y - 14, bold, 7.5, OLIVE)
  drawText(page, 'QTY', 365, y - 14, bold, 7.5, OLIVE)
  drawText(page, 'RATE (UGX)', 414, y - 14, bold, 7.5, OLIVE)
  drawText(page, 'SUBTOTAL', 493, y - 14, bold, 7.5, OLIVE)
  y -= 45

  const items = input.items.length > 0 ? input.items : [{ description: 'Professional design service', quantity: 1, unitPrice: 0 }]
  let subtotal = 0
  for (const item of items.slice(0, 18)) {
    const lineSubtotal = Math.max(0, item.quantity) * Math.max(0, item.unitPrice)
    subtotal += lineSubtotal
    drawMultiline(page, item.description || 'Item', MARGIN + 12, y, 265, regular, 8.5, INK)
    drawText(page, String(item.quantity), 368, y, regular, 8.5, INK)
    drawText(page, formatMoney(item.unitPrice, input.currency), 414, y, regular, 8.5, INK)
    drawText(page, formatMoney(lineSubtotal, input.currency), 493, y, regular, 8.5, INK)
    y -= 25
  }

  const discount = Math.max(0, input.discount || 0)
  const taxable = Math.max(0, subtotal - discount)
  const tax = taxable * Math.max(0, input.taxRate || 0) / 100
  const total = taxable + tax
  y -= 4
  drawRule(page, y)
  y -= 22
  drawText(page, 'Subtotal', 390, y, regular, 8.5, MUTED)
  drawText(page, formatMoney(subtotal, input.currency), 493, y, regular, 8.5, INK)
  if (discount > 0) {
    y -= 16
    drawText(page, 'Discount', 390, y, regular, 8.5, MUTED)
    drawText(page, `-${formatMoney(discount, input.currency)}`, 493, y, regular, 8.5, INK)
  }
  if (input.taxRate && input.taxRate > 0) {
    y -= 16
    drawText(page, `Tax (${input.taxRate}%)`, 390, y, regular, 8.5, MUTED)
    drawText(page, formatMoney(tax, input.currency), 493, y, regular, 8.5, INK)
  }
  y -= 22
  page.drawRectangle({ x: 350, y: y - 10, width: 190, height: 30, color: PAPER })
  drawText(page, 'TOTAL PAYABLE', 362, y + 2, bold, 8, OLIVE)
  drawText(page, formatMoney(total, input.currency), 455, y + 2, bold, 8.5, INK)

  y -= 58
  drawText(page, 'TERMS AND CONDITIONS', MARGIN, y, bold, 8, OLIVE)
  drawMultiline(
    page,
    input.terms || 'This document is prepared for the named client and project. Please confirm any changes in writing before work begins.',
    MARGIN,
    y - 18,
    PAGE_WIDTH - 2 * MARGIN,
    regular,
    8,
    MUTED,
  )

  y -= 73
  drawText(page, 'PAYMENT INFORMATION', MARGIN, y, bold, 8, OLIVE)
  const paymentLines = [
    profile.bankName,
    profile.bankAccount,
    `MTN Mobile Money: ${profile.mtnMobileMoney}`,
    `Airtel Money: ${profile.airtelMoney}`,
    profile.taxId ? `${profile.taxLabel}: ${profile.taxId}` : profile.taxLabel,
  ]
  paymentLines.forEach((line, index) => drawText(page, line, MARGIN, y - 16 - index * 13, regular, 8, index === paymentLines.length - 1 ? MUTED : INK))
  if (input.paymentMethod) drawText(page, `Preferred method: ${input.paymentMethod}`, 350, y - 16, regular, 8, MUTED)
  if (input.dueDate) drawText(page, `Due ${input.dueDate.toLocaleDateString('en-UG')}`, 350, y - 31, regular, 8, MUTED)
  if (input.validUntil) drawText(page, `Valid until ${input.validUntil.toLocaleDateString('en-UG')}`, 350, y - 46, regular, 8, MUTED)

  if (input.notes) {
    drawText(page, 'NOTES', 350, y - 72, bold, 8, OLIVE)
    drawMultiline(page, input.notes, 350, y - 89, 185, regular, 8, MUTED)
  }

  drawRule(page, 76, GOLD)
  drawText(page, profile.footer, MARGIN, 58, serif, 9, OLIVE)
  drawText(page, `${profile.supportEmail} · ${profile.salesEmail}`, MARGIN, 43, regular, 7.5, MUTED)

  return Buffer.from(await pdf.save())
}
