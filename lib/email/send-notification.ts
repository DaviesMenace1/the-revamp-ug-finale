type NotificationEmailOptions = {
  toEmail: string
  toName?: string | null
  subject: string
  htmlContent: string
}

export type EmailDeliveryResult = {
  status: 'sent' | 'failed' | 'skipped'
  providerMessageId: string | null
  error: string | null
}

function getSender() {
  const email = process.env.SENDER_EMAIL?.trim() || 'info@therevampug.com'
  const name = process.env.SENDER_NAME?.trim() || 'The Revamp UG'
  return { email, name }
}

export function escapeEmailHtml(value: string | null | undefined) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function sendBrevoNotificationEmail(options: NotificationEmailOptions): Promise<EmailDeliveryResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim()
  const sender = getSender()
  if (!apiKey) {
    return {
      status: 'skipped',
      providerMessageId: null,
      error: 'BREVO_API_KEY is not configured.',
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7_000)
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender,
        to: [{ email: options.toEmail, ...(options.toName ? { name: options.toName } : {}) }],
        subject: options.subject,
        htmlContent: options.htmlContent,
      }),
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => ({})) as { messageId?: string; message?: string }
    if (!response.ok) {
      return {
        status: 'failed',
        providerMessageId: null,
        error: payload.message || `Brevo returned HTTP ${response.status}.`,
      }
    }
    return {
      status: 'sent',
      providerMessageId: payload.messageId || null,
      error: null,
    }
  } catch (error) {
    return {
      status: 'failed',
      providerMessageId: null,
      error: error instanceof Error ? error.message : 'Brevo email request failed.',
    }
  } finally {
    clearTimeout(timeout)
  }
}
