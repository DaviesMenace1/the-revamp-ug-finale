import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Returns true only for a canonical RFC 4122 UUID string. */
export function isUuid(value: string) {
  return UUID_PATTERN.test(value)
}

export function normalizeCurrency(value: unknown, fallback = 'UGX') {
  const candidate = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return /^[A-Z]{3}$/.test(candidate) ? candidate : fallback
}

/** Format an amount without silently converting between currencies. */
export function formatMoney(value: unknown, currency = 'UGX') {
  const safeCurrency = normalizeCurrency(currency)
  const amount = Number(value)
  const safeAmount = Number.isFinite(amount) ? amount : 0
  const fractionDigits = safeCurrency === 'UGX' ? 0 : 2

  try {
    return new Intl.NumberFormat(safeCurrency === 'UGX' ? 'en-UG' : 'en-US', {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(safeAmount)
  } catch {
    return `${safeCurrency} ${safeAmount.toLocaleString('en-US', { maximumFractionDigits: fractionDigits })}`
  }
}
