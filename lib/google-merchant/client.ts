// Minimal Google Merchant Content API (v2.1) client.
//
// Deliberately dependency-free: signs its own service-account JWT with
// Node's built-in `crypto` instead of pulling in `googleapis`/`google-auth-library`.
//
// Required environment variables:
//   GOOGLE_MERCHANT_ID                 — numeric Merchant Center account id
//   GOOGLE_MERCHANT_CLIENT_EMAIL       — service account email
//   GOOGLE_MERCHANT_PRIVATE_KEY        — service account private key (PEM,
//                                        with literal \n escapes if set via
//                                        a single-line env var)
//
// The service account must be added as a user on the Merchant Center
// account (Settings → Account access) with Admin or Standard access.

import crypto from "crypto"

const TOKEN_URL = "https://oauth2.googleapis.com/token"
const CONTENT_API_BASE = "https://shoppingcontent.googleapis.com/content/v2.1"
const SCOPE = "https://www.googleapis.com/auth/content"

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

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new GoogleMerchantConfigError(
      `Missing required environment variable: ${name}. Google Merchant sync is not configured.`,
    )
  }
  return value
}

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token
  }

  const clientEmail = getEnv("GOOGLE_MERCHANT_CLIENT_EMAIL")
  const privateKeyRaw = getEnv("GOOGLE_MERCHANT_PRIVATE_KEY")
  const privateKey = privateKeyRaw.includes("\\n")
    ? privateKeyRaw.replace(/\\n/g, "\n")
    : privateKeyRaw

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: "RS256", typ: "JWT" }
  const claimSet = {
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(claimSet),
  )}`

  const signer = crypto.createSign("RSA-SHA256")
  signer.update(unsigned)
  signer.end()
  const signature = base64url(signer.sign(privateKey))

  const assertion = `${unsigned}.${signature}`

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new GoogleMerchantApiError(
      `Failed to obtain Google access token: ${data?.error_description || data?.error || response.statusText}`,
      response.status,
      data,
    )
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return cachedToken.token
}

function getMerchantId(): string {
  return getEnv("GOOGLE_MERCHANT_ID")
}

async function request(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
) {
  const token = await getAccessToken()
  const merchantId = getMerchantId()

  const response = await fetch(
    `${CONTENT_API_BASE}/${merchantId}/${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  )

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json")
  const data = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && (data as any).error?.message) ||
      response.statusText
    throw new GoogleMerchantApiError(message, response.status, data)
  }

  return data
}

/** Insert or fully replace a product in Merchant Center. Returns the API's product resource. */
export async function upsertMerchantProduct(product: Record<string, unknown>) {
  // The Content API's `products.insert` is idempotent per offerId/channel/
  // contentLanguage/targetCountry — calling it again updates the existing product.
  return request("POST", "products", product)
}

export async function deleteMerchantProduct(merchantProductId: string) {
  return request(
    "DELETE",
    `products/${encodeURIComponent(merchantProductId)}`,
  )
}

export async function getMerchantProduct(merchantProductId: string) {
  return request("GET", `products/${encodeURIComponent(merchantProductId)}`)
}

export function isGoogleMerchantConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_MERCHANT_ID &&
      process.env.GOOGLE_MERCHANT_CLIENT_EMAIL &&
      process.env.GOOGLE_MERCHANT_PRIVATE_KEY,
  )
}
