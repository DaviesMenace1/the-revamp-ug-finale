import 'server-only'

import { JWT } from 'google-auth-library'

const MERCHANT_API_BASE = 'https://merchantapi.googleapis.com/products/v1'
const CONTENT_SCOPE = 'https://www.googleapis.com/auth/content'

export class GoogleMerchantConfigError extends Error {}
export class GoogleMerchantApiError extends Error {
  status: number
  body: unknown
  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

function env(name: string) {
  return process.env[name]?.trim() || ''
}

function required(name: string) {
  const value = env(name)
  if (!value) throw new GoogleMerchantConfigError(`Missing required environment variable: ${name}. Google Merchant API sync is not configured.`)
  return value
}

function privateKey() {
  return required('GOOGLE_MERCHANT_PRIVATE_KEY').replace(/\\n/g, '\n')
}

function accountId() {
  return required('GOOGLE_MERCHANT_ID')
}

function dataSource() {
  const value = required('GOOGLE_MERCHANT_DATA_SOURCE')
  const expectedPrefix = `accounts/${accountId()}/dataSources/`
  if (!value.startsWith(expectedPrefix)) {
    throw new GoogleMerchantConfigError(`GOOGLE_MERCHANT_DATA_SOURCE must use the full resource name ${expectedPrefix}{dataSourceId}.`)
  }
  return value
}

async function getAccessToken() {
  const auth = new JWT({ email: required('GOOGLE_MERCHANT_CLIENT_EMAIL'), key: privateKey(), scopes: [CONTENT_SCOPE] })
  const token = await auth.getAccessToken()
  if (!token.token) throw new GoogleMerchantApiError('Google Merchant API authorization did not return an access token.', 401, null)
  return token.token
}

async function request(path: string, init: RequestInit = {}) {
  const token = await getAccessToken()
  const response = await fetch(`${MERCHANT_API_BASE}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  })
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json') ? await response.json() : await response.text()
  if (!response.ok) {
    const message = body && typeof body === 'object' && (body as { error?: { message?: string } }).error?.message
      ? (body as { error: { message: string } }).error.message
      : response.statusText
    throw new GoogleMerchantApiError(message, response.status, body)
  }
  return body
}

export async function upsertMerchantProduct(productInput: Record<string, unknown>) {
  const parent = `accounts/${accountId()}`
  const query = new URLSearchParams({ dataSource: dataSource() })
  return request(`${parent}/productInputs:insert?${query.toString()}`, { method: 'POST', body: JSON.stringify(productInput) }) as Promise<Record<string, unknown>>
}

export async function deleteMerchantProduct(productInputName: string) {
  return request(`${productInputName.replace(/^\//, '')}`, { method: 'DELETE' })
}

export async function getMerchantProduct(productName: string) {
  return request(`${productName.replace(/^\//, '')}`)
}

export function isGoogleMerchantConfigured() {
  return Boolean(env('GOOGLE_MERCHANT_ID') && env('GOOGLE_MERCHANT_CLIENT_EMAIL') && env('GOOGLE_MERCHANT_PRIVATE_KEY') && env('GOOGLE_MERCHANT_DATA_SOURCE'))
}
