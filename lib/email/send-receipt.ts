interface SendReceiptOptions {
  toEmail: string
  orderNumber: string
  amount: string
  currency?: string
  customerName?: string
}

export async function sendOrderReceiptEmail({
  toEmail,
  orderNumber,
  amount,
  currency = 'USD',
  customerName = 'Valued Customer',
}: SendReceiptOptions) {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.SENDER_EMAIL || 'orders@yourdomain.com'
  const senderName = process.env.SENDER_NAME || 'Store Admin'

  if (!apiKey) {
    console.error('BREVO_API_KEY is not configured in environment variables.')
    return { success: false, error: 'Missing API Key' }
  }

  // HTML Email Body
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
          .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px border-dash #e5e5e5; }
          .total { font-weight: bold; font-size: 16px; color: #000; padding-top: 10px; border-top: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #777777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">Payment Confirmed</span>
            <h1>Thank You for Your Order</h1>
            <p style="color: #666; font-size: 14px;">Hi ${customerName}, your order has been received and is now being processed.</p>
          </div>

          <div class="details">
            <div style="margin-bottom: 10px;"><strong>Order Ref:</strong> ${orderNumber}</div>
            <div style="margin-bottom: 10px;"><strong>Payment Method:</strong> Flutterwave</div>
            <div class="total">Total Paid: ${currency} $${amount}</div>
          </div>

          <p style="font-size: 13px; color: #555; line-height: 1.6;">
            If you have any questions about your package, reply directly to this email or reach out to our customer support.
          </p>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${senderName}. All rights reserved.</p>
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
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: toEmail,
            name: customerName,
          },
        ],
        subject: `Order Confirmation #${orderNumber}`,
        htmlContent: htmlContent,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Brevo API error:', data)
      return { success: false, error: data.message || 'Failed to send email' }
    }

    return { success: true, messageId: data.messageId }
  } catch (error: any) {
    console.error('Failed to trigger Brevo email:', error)
    return { success: false, error: error.message || 'Server error' }
  }
}
