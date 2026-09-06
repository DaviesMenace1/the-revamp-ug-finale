import 'server-only'

const SANDBOX_BASE_URL = 'https://cybqa.pesapal.com/pesapalv3/api'
const PRODUCTION_BASE_URL = 'https://pay.pesapal.com/v3/api'
const TOKEN_TTL_MS = 4 * 60 * 1000

let cachedToken: { value: string; expiresAt: number; baseUrl: string } | null = null

type PesapalEnvelope = {
  status?: string | number
  message?: string
  error?: { error_type?: string | null; code?: string | null; message?: string | null } | null
}

export type PesapalTransactionStatus = PesapalEnvelope & {
  payment_method?: string
  amount?: number | string
  created_date?: string
  confirmation_code?: string
  payment_status_description?: string
  description?: string
  payment_account?: string
  merchant_reference?: string
  currency?: string
  status_code?: number | string
}

export type PesapalSubmitOrderInput = {
  id: string
  amount: number
  currency: string
  description: string
  callbackUrl: string
  cancellationUrl?: string
  billingAddress: {
    emailAddress?: string
    phoneNumber?: string
    countryCode?: string
    firstName?: string
    middleName?: string
    lastName?: string
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    zipCode?: string
  }
}

export type PesapalSubmitOrderResponse = PesapalEnvelope & {
  order_tracking_id?: string
  merchant_reference?: string
  redirect_url?: string
}

function env(name: string) {
  return process.env[name]?.trim() || ''
}

export function getPesapalBaseUrl() {
  const explicit = env('PESAPAL_API_BASE_URL')
  if (explicit) return explicit.replace(/\/$/, '')
  return env('PESAPAL_ENV').toLowerCase() === 'production' || env('PESAPAL_ENV').toLowerCase() === 'live'
    ? PRODUCTION_BASE_URL
    : SANDBOX_BASE_URL
}

export function getPesapalConfig() {
  const consumerKey = env('PESAPAL_CONSUMER_KEY')
  const consumerSecret = env('PESAPAL_CONSUMER_SECRET')
  const ipnId = env('PESAPAL_IPN_ID')
  if (!consumerKey || !consumerSecret || !ipnId) {
    return { ok: false as const, error: 'Pesapal is not configured. Add PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET, and PESAPAL_IPN_ID.' }
  }
  return { ok: true as const, consumerKey, consumerSecret, ipnId, baseUrl: getPesapalBaseUrl() }
}

function responseMessage(payload: PesapalEnvelope | null, fallback: string) {
  return payload?.error?.message || payload?.message || fallback
}

async function getToken() {
  const config = getPesapalConfig()
  if (!config.ok) throw new Error(config.error)
  if (cachedToken && cachedToken.baseUrl === config.baseUrl && cachedToken.expiresAt > Date.now()) return cachedToken.value

  const response = await fetch(`${config.baseUrl}/Auth/RequestToken`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ consumer_key: config.consumerKey, consumer_secret: config.consumerSecret }),
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => null) as (PesapalEnvelope & { token?: string }) | null
  if (!response.ok || !payload?.token) throw new Error(responseMessage(payload, 'Pesapal authentication failed.'))

  cachedToken = { value: payload.token, expiresAt: Date.now() + TOKEN_TTL_MS, baseUrl: config.baseUrl }
  return payload.token
}

async function pesapalRequest<T>(path: string, init: RequestInit = {}) {
  const token = await getToken()
  const response = await fetch(`${getPesapalBaseUrl()}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers || {}) },
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => null) as T & PesapalEnvelope
  if (!response.ok) throw new Error(responseMessage(payload, `Pesapal request failed with status ${response.status}.`))
  return payload
}

export async function submitPesapalOrder(input: PesapalSubmitOrderInput) {
  const config = getPesapalConfig()
  if (!config.ok) throw new Error(config.error)
  return pesapalRequest<PesapalSubmitOrderResponse>('/Transactions/SubmitOrderRequest', {
    method: 'POST',
    body: JSON.stringify({
      id: input.id.slice(0, 50),
      currency: input.currency.toUpperCase(),
      amount: Number(input.amount.toFixed(2)),
      description: input.description.slice(0, 100),
      callback_url: input.callbackUrl,
      cancellation_url: input.cancellationUrl,
      notification_id: config.ipnId,
      redirect_mode: 'TOP_WINDOW',
      billing_address: {
        email_address: input.billingAddress.emailAddress,
        phone_number: input.billingAddress.phoneNumber,
        country_code: input.billingAddress.countryCode,
        first_name: input.billingAddress.firstName,
        middle_name: input.billingAddress.middleName,
        last_name: input.billingAddress.lastName,
        line_1: input.billingAddress.line1,
        line_2: input.billingAddress.line2,
        city: input.billingAddress.city,
        state: input.billingAddress.state,
        postal_code: input.billingAddress.postalCode,
        zip_code: input.billingAddress.zipCode,
      },
    }),
  })
}

export async function getPesapalTransactionStatus(orderTrackingId: string) {
  const trackingId = orderTrackingId.trim()
  if (!trackingId) throw new Error('Pesapal order tracking ID is required.')
  return pesapalRequest<PesapalTransactionStatus>(`/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(trackingId)}`)
}

export async function registerPesapalIpnUrl(url: string, method: 'GET' | 'POST' = 'POST') {
  return pesapalRequest<{ ipn_id?: string; url?: string; status?: string }>('/URLSetup/RegisterIPN', {
    method: 'POST',
    body: JSON.stringify({ url, ipn_notification_type: method }),
  })
}

export async function refundPesapalPayment(input: { confirmationCode: string; amount: number; username: string; remarks: string }) {
  if (!input.confirmationCode.trim()) throw new Error('Pesapal confirmation code is required for a refund.')
  return pesapalRequest<{ status?: string | number; message?: string }>('/Transactions/RefundRequest', {
    method: 'POST',
    body: JSON.stringify({ confirmation_code: input.confirmationCode.trim(), amount: Number(input.amount.toFixed(2)), username: input.username.slice(0, 120), remarks: input.remarks.slice(0, 255) }),
  })
}

export function pesapalStatus(status: PesapalTransactionStatus) {
  const code = Number(status.status_code)
  const description = String(status.payment_status_description || '').toUpperCase()
  if (code === 1 || description === 'COMPLETED') return 'completed' as const
  if (code === 2 || description === 'FAILED') return 'failed' as const
  if (code === 3 || description === 'REVERSED') return 'reversed' as const
  if (code === 0 || description === 'INVALID') return 'invalid' as const
  return 'pending' as const
}
