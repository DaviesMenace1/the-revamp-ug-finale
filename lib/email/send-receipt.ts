type SendReceiptOptions = {
  toEmail: string
  orderNumber: string
  amount: string
  currency?: string
  customerName?: string
  paymentMode?: string | null
  paymentMethod?: string | null
  deliveryAddress?: unknown
  items?: unknown
  orderId?: string | null
  trackingCode?: string | null
}

function escapeEmailHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character)
}

function detailLabel(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
  const item = value as Record<string, unknown>
  return String(item.label || item.name || item.value || '').trim()
}

function deliveryLabel(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Delivery details recorded at checkout.'
  const address = value as Record<string, unknown>
  if (address.deliveryMethod === 'pickup_station' && address.pickupStation && typeof address.pickupStation === 'object') {
    const station = address.pickupStation as Record<string, unknown>
    return `Pickup station: ${String(station.name || 'Selected station')}, ${String(station.address || '')}`
  }
  return `Door delivery: ${String(address.address || '')}, ${String(address.city || '')}`
}

function itemRows(value: unknown) {
  if (!Array.isArray(value)) return ''
  return value.slice(0, 18).map((item) => {
    const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    const options = [['Colour', detailLabel(row.color)], ['Fabric', detailLabel(row.fabric)], ['Material', detailLabel(row.material)], ['Variant', detailLabel(row.variant)]]
      .filter(([, option]) => option)
      .map(([key, option]) => `${key}: ${option}`)
      .join(' · ')
    const name = escapeEmailHtml(String(row.name || row.title || 'Product'))
    const description = options ? `<div style="margin-top:4px;color:#756f66;font-size:12px;line-height:1.5">${escapeEmailHtml(options)}</div>` : ''
    return `<div style="padding:14px 0;border-bottom:1px solid #ebe7df"><div style="font-size:14px;font-weight:600;color:#231f1b">${name}</div>${description}<div style="margin-top:5px;color:#756f66;font-size:12px">Quantity: ${Math.max(1, Number(row.quantity) || 1)}</div></div>`
  }).join('')
}

export async function sendOrderVerificationEmail({
  toEmail,
  orderNumber,
  amount,
  currency = 'UGX',
  customerName = 'Valued Customer',
  paymentMode = 'pay_now',
  paymentMethod = null,
  deliveryAddress,
  items,
  orderId = null,
  trackingCode = null,
}: SendReceiptOptions) {
  const apiKey = process.env.BREVO_API_KEY?.trim()
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || process.env.SENDER_EMAIL?.trim() || 'info@therevampug.com'
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || process.env.SENDER_NAME?.trim() || 'The Revamp UG'
  const safeCustomerName = escapeEmailHtml(customerName)
  const safeOrderNumber = escapeEmailHtml(orderNumber)
  const safeAmount = escapeEmailHtml(amount)
  const safeCurrency = escapeEmailHtml(currency)
  const safeSenderName = escapeEmailHtml(senderName)
  const isPayOnDelivery = paymentMode === 'pay_on_delivery'
  const paymentLabel = isPayOnDelivery ? 'Pay on delivery' : `Pay now via ${paymentMethod === 'mobile_money' ? 'mobile money' : paymentMethod === 'card' ? 'card' : 'Flutterwave'}`
  const safePaymentLabel = escapeEmailHtml(paymentLabel)
  const safeDeliveryLabel = escapeEmailHtml(deliveryLabel(deliveryAddress))
  const safeTrackingCode = trackingCode ? escapeEmailHtml(trackingCode) : ''
  const itemsMarkup = itemRows(items)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://therevampug.com'
  const actionUrl = orderId ? `${siteUrl}/client/orders?order=${encodeURIComponent(orderId)}` : null

  if (!apiKey) {
    console.error('BREVO_API_KEY is not configured in environment variables.')
    return { success: false, error: 'Missing API Key' }
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#f4f1eb; margin:0; padding:28px 14px; color:#231f1b; }
          .container { max-width:620px; margin:0 auto; background:#ffffff; border:1px solid #e5dfd5; }
          .header { padding:34px 30px 28px; background:#231f1b; color:#fffaf2; }
          .brand { color:#d2ab72; font-size:11px; letter-spacing:3px; text-transform:uppercase; }
          .badge { display:inline-block; margin-top:26px; border:1px solid #d2ab72; color:#f4d49d; font-size:10px; font-weight:700; padding:7px 11px; text-transform:uppercase; letter-spacing:1.5px; }
          h1 { font-family: Georgia, 'Times New Roman', serif; font-size:32px; font-weight:400; line-height:1.15; margin:16px 0 10px; }
          .intro { color:#e1d9cd; font-size:14px; line-height:1.7; margin:0; }
          .content { padding:28px 30px 34px; }
          .summary { border:1px solid #e5dfd5; background:#fbfaf7; }
          .summary-row { padding:14px 16px; border-bottom:1px solid #ebe7df; }
          .summary-row:last-child { border-bottom:0; }
          .label { color:#827a70; font-size:10px; letter-spacing:1.3px; text-transform:uppercase; }
          .value { color:#231f1b; font-size:14px; line-height:1.5; margin-top:4px; }
          .section-title { color:#231f1b; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; margin:28px 0 4px; }
          .total { display:flex; justify-content:space-between; gap:16px; border-top:1px solid #231f1b; margin-top:18px; padding-top:16px; font-size:16px; font-weight:700; }
          .button { display:inline-block; background:#231f1b; color:#fffaf2 !important; text-decoration:none; padding:14px 18px; font-size:11px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; }
          .note { color:#756f66; font-size:13px; line-height:1.7; }
          .footer { border-top:1px solid #ebe7df; color:#91887d; font-size:11px; line-height:1.6; margin-top:30px; padding-top:20px; text-align:center; }
          @media (max-width:520px) { body { padding:0; } .header, .content { padding-left:20px; padding-right:20px; } h1 { font-size:28px; } }
        </style>
      </head>
      <body>
        <main class="container">
          <header class="header">
            <div class="brand">The Revamp UG</div>
            <div class="badge">${isPayOnDelivery ? 'Order confirmed' : 'Payment verified'}</div>
            <h1>${isPayOnDelivery ? 'Your order is confirmed' : 'Thank you for your order'}</h1>
            <p class="intro">Hi ${safeCustomerName}, ${isPayOnDelivery ? 'your order is now reserved for fulfilment. Payment is due when it is delivered or collected.' : 'your payment has been verified and your order is now moving into fulfilment.'}</p>
          </header>
          <section class="content">
            <div class="summary">
              <div class="summary-row"><div class="label">Order reference</div><div class="value">${safeOrderNumber}</div></div>
              <div class="summary-row"><div class="label">Payment</div><div class="value">${safePaymentLabel}</div></div>
              <div class="summary-row"><div class="label">Fulfilment</div><div class="value">${safeDeliveryLabel}</div></div>
              ${safeTrackingCode ? `<div class="summary-row"><div class="label">Tracking code</div><div class="value">${safeTrackingCode}</div></div>` : ''}
            </div>
            ${itemsMarkup ? `<h2 class="section-title">Your selection</h2><div>${itemsMarkup}</div>` : ''}
            <div class="total"><span>Total ${isPayOnDelivery ? 'due' : 'paid'}</span><span>${safeCurrency} ${safeAmount}</span></div>
            <p class="note">Keep this email for your records. You can follow the order, review its delivery details, and contact the studio from your client portal.</p>
            ${actionUrl ? `<p style="margin:24px 0 0"><a class="button" href="${escapeEmailHtml(actionUrl)}">View order status</a></p>` : ''}
            <div class="footer">Need help? Contact The Revamp UG through your client portal or email support@therevampug.com.<br>&copy; ${new Date().getFullYear()} ${safeSenderName}. All rights reserved.</div>
          </section>
        </main>
      </body>
    </html>
  `

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail.trim(), name: customerName }],
        subject: `${isPayOnDelivery ? 'Order confirmed' : 'Order verified'} #${orderNumber}`,
        htmlContent,
      }),
    })

    const data = await response.json().catch(() => ({})) as { messageId?: string; message?: string }
    if (!response.ok) {
      console.error('[brevo] verified order email rejected:', { status: response.status, message: data.message || 'Unknown Brevo error', senderEmail, recipient: toEmail.trim() })
      return { success: false, error: data.message || 'Failed to send email' }
    }

    return { success: true, messageId: data.messageId }
  } catch (error) {
    console.error('[brevo] verified order email request failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Server error' }
  }
}

/**
 * Backward-compatible alias for existing receipt email callers.
 * New payment settlement code should use the verified-order name.
 */
export async function sendOrderReceiptEmail(options: SendReceiptOptions) {
  return sendOrderVerificationEmail(options)
}
