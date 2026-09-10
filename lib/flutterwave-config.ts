import 'server-only'

import { createCipheriv, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'

export type FlutterwaveMode = 'sandbox' | 'live'

export type FlutterwaveConfig =
  | {
      ok: true
      mode: FlutterwaveMode
      clientId: string
      clientSecret: string
      encryptionKey: string | null
      baseUrl: string
    }
  | { ok: false; mode: FlutterwaveMode; reason: 'missing_client_credentials' | 'missing_encryption_key' | 'invalid_base_url' }

type FlutterwaveResponse<T> = {
  status?: string
  message?: string
  data?: T
  error?: { message?: string; type?: string; code?: string; validation_errors?: Array<{ field_name?: string; message?: string }> }
}

export type FlutterwaveAuthorizationType = 'pin' | 'otp' | 'redirect_url' | 'payment_instruction' | 'requires_additional_fields'

export type FlutterwaveRefund = {
  id?: string
  amount_refunded?: number | string
  charge_id?: string
  reason?: string
  status?: string
  created_datetime?: string
}

type FlutterwaveCharge = {
  id?: string
  amount?: number | string
  currency?: string
  reference?: string
  tx_ref?: string
  status?: string
  next_action?: {
    type?: string
    authorization?: { type?: string }
    redirect_url?: { url?: string }
    payment_instruction?: { note?: string }
    requires_additional_fields?: { fields?: string[] }
  }
  payment_method_details?: { type?: string }
  payment_method?: { type?: string }
}

export type FlutterwavePaymentMethod =
  | {
      type: 'mobile_money'
      mobile_money: { country_code: string; network: string; phone_number: string }
    }
  | {
      type: 'card'
      card: {
        nonce: string
        encrypted_card_number: string
        encrypted_expiry_month: string
        encrypted_expiry_year: string
        encrypted_cvv: string
      }
    }

const TOKEN_URL = 'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token'
const SANDBOX_BASE_URL = 'https://developersandbox-api.flutterwave.com'
const LIVE_BASE_URL = 'https://f4bexperience.flutterwave.com'

let cachedAccessToken: { value: string; expiresAt: number } | null = null

function configuredMode(): FlutterwaveMode {
  return process.env.FLUTTERWAVE_MODE?.trim().toLowerCase() === 'live' ? 'live' : 'sandbox'
}

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, '') || ''
}

export function getFlutterwaveConfig(): FlutterwaveConfig {
  const mode = configuredMode()
  const clientId = clean(process.env.FLUTTERWAVE_CLIENT_ID)
  const clientSecret = clean(process.env.FLUTTERWAVE_CLIENT_SECRET)
  const encryptionKey = clean(process.env.FLUTTERWAVE_ENCRYPTION_KEY) || null
  if (!clientId || !clientSecret) return { ok: false, mode, reason: 'missing_client_credentials' }

  const baseUrl = mode === 'sandbox' ? SANDBOX_BASE_URL : clean(process.env.FLUTTERWAVE_V4_BASE_URL) || LIVE_BASE_URL
  if (!baseUrl || !/^https:\/\//i.test(baseUrl)) return { ok: false, mode, reason: 'invalid_base_url' }
  return { ok: true, mode, clientId, clientSecret, encryptionKey, baseUrl: baseUrl.replace(/\/$/, '') }
}

export function flutterwaveConfigurationMessage(config: Extract<FlutterwaveConfig, { ok: false }>) {
  if (config.reason === 'missing_client_credentials') return 'Consultation payment is not configured yet. Add FLUTTERWAVE_CLIENT_ID and FLUTTERWAVE_CLIENT_SECRET in Vercel, then redeploy.'
  if (config.reason === 'missing_encryption_key') return 'Card payment is not configured yet. Add FLUTTERWAVE_ENCRYPTION_KEY in Vercel, then redeploy.'
  return 'Flutterwave v4 has no valid HTTPS API base URL configured for this environment.'
}

function traceId() {
  return randomUUID()
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 15_000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal, cache: 'no-store' })
  } finally {
    clearTimeout(timer)
  }
}

async function getAccessToken(config: Extract<FlutterwaveConfig, { ok: true }>, forceRefresh = false) {
  if (!forceRefresh && cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30_000) return cachedAccessToken.value
  const response = await fetchWithTimeout(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, grant_type: 'client_credentials' }),
  })
  const payload = await response.json().catch(() => ({})) as { access_token?: string; expires_in?: number; error_description?: string }
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || 'Flutterwave OAuth authentication failed.')
  const expiresIn = Math.max(60, Number(payload.expires_in) || 600)
  cachedAccessToken = { value: payload.access_token, expiresAt: Date.now() + expiresIn * 1000 }
  return payload.access_token
}

async function flutterwaveRequest<T>(path: string, init: RequestInit = {}) {
  const config = getFlutterwaveConfig()
  if (!config.ok) return { config, response: null, payload: null as FlutterwaveResponse<T> | null }
  let token: string
  try {
    token = await getAccessToken(config)
  } catch {
    return { config, response: new Response(null, { status: 401 }), payload: { status: 'failed', message: 'Flutterwave OAuth authentication failed.' } as FlutterwaveResponse<T> }
  }
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', 'application/json')
  headers.set('Accept', 'application/json')
  headers.set('X-Trace-Id', traceId())
  let response: Response
  try {
    response = await fetchWithTimeout(`${config.baseUrl}${path}`, { ...init, headers })
  } catch (error) {
    console.error('[flutterwave] request failed', { path, error })
    return { config, response: new Response(null, { status: 503 }), payload: { status: 'failed', message: 'Flutterwave could not be reached. Check the payment provider configuration and try again.' } as FlutterwaveResponse<T> }
  }
  if (response.status === 401) {
    try {
      token = await getAccessToken(config, true)
      headers.set('Authorization', `Bearer ${token}`)
      try {
        response = await fetchWithTimeout(`${config.baseUrl}${path}`, { ...init, headers })
      } catch (error) {
        console.error('[flutterwave] retry request failed', { path, error })
        return { config, response: new Response(null, { status: 503 }), payload: { status: 'failed', message: 'Flutterwave could not be reached. Check the payment provider configuration and try again.' } as FlutterwaveResponse<T> }
      }
    } catch {
      return { config, response, payload: { status: 'failed', message: 'Flutterwave OAuth authentication failed.' } as FlutterwaveResponse<T> }
    }
  }
  const payload = await response.json().catch(() => ({})) as FlutterwaveResponse<T>
  return { config, response, payload }
}

export async function encryptFlutterwaveCardField(value: string, nonce: string) {
  const config = getFlutterwaveConfig()
  if (!config.ok) throw new Error(flutterwaveConfigurationMessage(config))
  if (!config.encryptionKey) throw new Error(flutterwaveConfigurationMessage({ ...config, ok: false, reason: 'missing_encryption_key' }))
  if (!/^[A-Za-z0-9]{12}$/.test(nonce)) throw new Error('Flutterwave card encryption nonce must be 12 characters.')
  const key = Buffer.from(config.encryptionKey, 'base64')
  if (key.length !== 32) throw new Error('Flutterwave encryption key is invalid. Please copy the v4 Encryption Key exactly.')
  const cipher = createCipheriv('aes-256-gcm', key, Buffer.from(nonce, 'utf8'))
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final(), cipher.getAuthTag()])
  return encrypted.toString('base64')
}

export async function encryptFlutterwaveCard(card: { number: string; expiryMonth: string; expiryYear: string; cvv: string }) {
  const nonce = randomBytes(9).toString('base64url').replace(/[^A-Za-z0-9]/g, 'A').slice(0, 12)
  return {
    nonce,
    encrypted_card_number: await encryptFlutterwaveCardField(card.number, nonce),
    encrypted_expiry_month: await encryptFlutterwaveCardField(card.expiryMonth, nonce),
    encrypted_expiry_year: await encryptFlutterwaveCardField(card.expiryYear, nonce),
    encrypted_cvv: await encryptFlutterwaveCardField(card.cvv, nonce),
  }
}

export async function createFlutterwaveCharge(input: {
  reference: string
  amount: number
  currency: string
  redirectUrl: string
  customer: Record<string, unknown>
  paymentMethod: FlutterwavePaymentMethod
  idempotencyKey: string
  meta?: Record<string, string>
}) {
  const headers: Record<string, string> = { 'X-Idempotency-Key': input.idempotencyKey }
  const config = getFlutterwaveConfig()
  if (config.ok && config.mode === 'sandbox' && input.paymentMethod.type === 'mobile_money' && clean(process.env.FLUTTERWAVE_SANDBOX_MOBILE_MONEY_FLOW).toLowerCase() !== 'instruction') {
    headers['X-Scenario-Key'] = 'scenario:auth_redirect'
  }
  const result = await flutterwaveRequest<FlutterwaveCharge>('/orchestration/direct-charges', {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount: input.amount, currency: input.currency, reference: input.reference, redirect_url: input.redirectUrl, customer: input.customer, payment_method: input.paymentMethod, meta: input.meta || {} }),
  })
  return result
}

export async function retrieveFlutterwaveCharge(chargeId: string) {
  return flutterwaveRequest<FlutterwaveCharge>(`/charges/${encodeURIComponent(chargeId)}`, { method: 'GET' })
}

export async function createFlutterwaveRefund(input: { chargeId: string; amount: number; reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'expired_uncaptured_charge'; idempotencyKey: string; meta?: Record<string, string> }) {
  return flutterwaveRequest<FlutterwaveRefund>('/refunds', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({ amount: input.amount, charge_id: input.chargeId, reason: input.reason, meta: input.meta || {} }),
  })
}

export async function retrieveFlutterwaveRefund(refundId: string) {
  return flutterwaveRequest<FlutterwaveRefund>(`/refunds/${encodeURIComponent(refundId)}`, { method: 'GET' })
}

export function getFlutterwaveAuthorizationType(charge: FlutterwaveCharge | undefined): FlutterwaveAuthorizationType | null {
  const nextAction = String(charge?.next_action?.type || '').toLowerCase()
  const authorization = String(charge?.next_action?.authorization?.type || '').toLowerCase()
  if (nextAction === 'redirect_url') return 'redirect_url'
  if (nextAction === 'payment_instruction' || nextAction === 'payment_instructions') return 'payment_instruction'
  if (authorization === 'pin' || nextAction === 'requires_pin' || nextAction === 'authorize_pin') return 'pin'
  if (authorization === 'otp' || nextAction === 'requires_otp' || nextAction === 'authorize_otp') return 'otp'
  if (nextAction === 'requires_additional_fields') return 'requires_additional_fields'
  return null
}

export async function updateFlutterwaveCharge(chargeId: string, authorization: Record<string, unknown>, idempotencyKey?: string) {
  return flutterwaveRequest<FlutterwaveCharge>(`/charges/${encodeURIComponent(chargeId)}`, { method: 'PUT', headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify({ authorization }) })
}

export async function encryptFlutterwavePin(pin: string) {
  const nonce = randomBytes(9).toString('base64url').replace(/[^A-Za-z0-9]/g, 'A').slice(0, 12)
  return { nonce, encrypted_pin: await encryptFlutterwaveCardField(pin, nonce) }
}

export function isValidFlutterwaveWebhookSignature(rawBody: string, signature: string | null, secretHash: string | undefined) {
  const secret = clean(secretHash)
  if (!secret || !signature) return false
  const expected = createHmacSignature(rawBody, secret)
  const left = Buffer.from(expected)
  const right = Buffer.from(signature)
  return left.length === right.length && timingSafeEqual(left, right)
}

function createHmacSignature(rawBody: string, secretHash: string) {
  return createHmac('sha256', secretHash).update(rawBody).digest('base64')
}

export type { FlutterwaveCharge, FlutterwaveResponse }

export function normalizeUgandaPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  const local = digits.startsWith('256') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits
  if (!/^\d{9}$/.test(local)) return null
  return { countryCode: '256', number: local }
}

export async function buildFlutterwavePaymentMethod(input: {
  method?: unknown
  phoneNumber?: unknown
  mobileMoneyNetwork?: unknown
  cardNumber?: unknown
  cardExpiryMonth?: unknown
  cardExpiryYear?: unknown
  cardCvv?: unknown
}) {
  const method = input.method === 'card' ? 'card' : 'mobile_money'
  if (method === 'mobile_money') {
    const phone = normalizeUgandaPhone(typeof input.phoneNumber === 'string' ? input.phoneNumber : '')
    const network = typeof input.mobileMoneyNetwork === 'string' ? input.mobileMoneyNetwork.trim().toUpperCase() : ''
    if (!phone) throw new Error('Enter a valid Ugandan mobile-money number, for example 0772 000 000.')
    if (!['MTN', 'AIRTEL'].includes(network)) throw new Error('Choose MTN or Airtel Mobile Money.')
    return { type: 'mobile_money' as const, mobile_money: { country_code: phone.countryCode, network, phone_number: phone.number } }
  }

  const cardNumber = typeof input.cardNumber === 'string' ? input.cardNumber.replace(/\s+/g, '') : ''
  const expiryMonth = typeof input.cardExpiryMonth === 'string' ? input.cardExpiryMonth.trim() : ''
  const expiryYear = typeof input.cardExpiryYear === 'string' ? input.cardExpiryYear.trim() : ''
  const cvv = typeof input.cardCvv === 'string' ? input.cardCvv.trim() : ''
  if (!/^\d{12,19}$/.test(cardNumber) || !/^\d{1,2}$/.test(expiryMonth) || !/^\d{2,4}$/.test(expiryYear) || !/^\d{3,4}$/.test(cvv)) {
    throw new Error('Enter valid card details before continuing.')
  }
  const card = await encryptFlutterwaveCard({ number: cardNumber, expiryMonth: expiryMonth.padStart(2, '0'), expiryYear: expiryYear.length === 4 ? expiryYear.slice(-2) : expiryYear, cvv })
  return { type: 'card' as const, card }
}

export function flutterwaveErrorMessage(payload: FlutterwaveResponse<unknown>, status: number) {
  if (status === 401) return 'Flutterwave rejected the v4 credentials. Confirm the Client ID and Client Secret belong to the same Sandbox account.'
  if (status === 403) return 'Flutterwave does not allow this payment operation for the current Sandbox account.'
  const validation = payload.error?.validation_errors?.map((item) => item.field_name && item.message ? `${item.field_name}: ${item.message}` : item.field_name || item.message).filter(Boolean).join('; ')
  return validation || payload.error?.message || payload.message || 'Flutterwave could not initialize this payment.'
}
