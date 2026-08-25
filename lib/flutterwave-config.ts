import 'server-only'

export type FlutterwaveMode = 'sandbox' | 'live'

export type FlutterwaveConfig =
  | { ok: true; mode: FlutterwaveMode; secretKey: string; baseUrl: string }
  | { ok: false; mode: FlutterwaveMode; reason: 'missing' | 'sandbox_key_required' | 'live_key_required' }

const FLUTTERWAVE_V3_BASE_URL = 'https://api.flutterwave.com/v3'

function configuredMode(): FlutterwaveMode {
  return process.env.FLUTTERWAVE_MODE?.trim().toLowerCase() === 'live' ? 'live' : 'sandbox'
}

export function getFlutterwaveConfig(): FlutterwaveConfig {
  const mode = configuredMode()
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY?.trim().replace(/^["']|["']$/g, '') || ''
  if (!secretKey) return { ok: false, mode, reason: 'missing' }

  const isSandboxKey = secretKey.startsWith('FLWSECK_TEST-')
  const isLiveKey = secretKey.startsWith('FLWSECK-') && !isSandboxKey
  if (mode === 'sandbox' && !isSandboxKey) return { ok: false, mode, reason: 'sandbox_key_required' }
  if (mode === 'live' && !isLiveKey) return { ok: false, mode, reason: 'live_key_required' }

  return { ok: true, mode, secretKey, baseUrl: FLUTTERWAVE_V3_BASE_URL }
}

export function flutterwaveConfigurationMessage(config: Extract<FlutterwaveConfig, { ok: false }>) {
  if (config.reason === 'missing') return 'Consultation payment is not configured yet. Add FLUTTERWAVE_SECRET_KEY in Vercel Production and redeploy.'
  if (config.reason === 'sandbox_key_required') return 'Flutterwave is in sandbox mode, but the configured server key is not a sandbox secret key. Use the Flutterwave secret key beginning FLWSECK_TEST-.'
  return 'Flutterwave is in live mode, but the configured server key is not a live secret key. Change the mode or use the matching live key.'
}
