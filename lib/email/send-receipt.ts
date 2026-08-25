interface SendReceiptOptions {
  toEmail: string
  orderNumber: string
  amount: string
  currency?: string
  customerName?: string
}

function escapeEmailHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character)
}

export async function sendOrderVerificationEmail({
  toEmail,
  orderNumber,
  amount,
  currency = 'UGX',
  customerName = 'Valued Customer',
}: SendReceiptOptions) {
  const apiKey = process.env.BREVO_API_KEY?.trim()
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || process.env.SENDER_EMAIL?.trim() || 'info@therevampug.com'
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || process.env.SENDER_NAME?.trim() || 'The Revamp UG'
  const safeCustomerName = escapeEmailHtml(customerName)
  const safeOrderNumber = escapeEmailHtml(orderNumber)
  const safeAmount = escapeEmailHtml(amount)
  const safeCurrency = escapeEmailHtml(currency)
  const safeSenderName = escapeEmailHtml(senderName)

  if (!apiKey) {
    console.error('BREVO_API_KEY is not configured in environment variables.')
    return { success: false, error: 'Missing API Key' }
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 40px 20px; color: #111111; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; padding: 40px; }
          .header { border-bottom: 1px solid #eeeeee; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
          .badge { display: inline-block; background-color: #10b981; color: #ffffff; font-size: 10px; font-weight: bold; padding: 4px 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
          h1 { font-size: 24px; font-weight: 300; margin: 0 0 10px; letter-spacing: -0.5px; }
          .details { background-color: #f8f8f8; border: 1px solid #eeeeee; padding: 20px; margin: 25px 0; font-size: 14px; }
          .total { font-weight: bold; font-size: 16px; color: #000; padding-top: 10px; border-top: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #777777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">Payment Verified</span>
            <h1>Thank You for Your Order</h1>
            <p style="color: #666; font-size: 14px;">Hi ${safeCustomerName}, your payment has been verified and your order is now being processed.</p>
          </div>

          <div class="details">
            <div style="margin-bottom: 10px;"><strong>Order Ref:</strong> ${safeOrderNumber}</div>
            <div style="margin-bottom: 10px;"><strong>Payment Method:</strong> Flutterwave</div>
            <div class="total">Total Paid: ${safeCurrency} ${safeAmount}</div>
          </div>

          <p style="font-size: 13px; color: #555; line-height: 1.6;">
            Keep this email for your records. If you have questions about your order, contact our customer support team.
          </p>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${safeSenderName}. All rights reserved.</p>
          </div>
        </div>
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
        subject: `Order verified #${orderNumber}`,
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
