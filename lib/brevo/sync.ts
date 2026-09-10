export interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  attributes?: Record<string, any>;
  listIds?: number[];
}

const BREVO_API_URL = 'https://api.brevo.com/v3';

function getHeaders() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY environment variable is not set.');
  }

  return {
    accept: 'application/json',
    'content-type': 'application/json',
    'api-key': apiKey,
  };
}

/**
 * Sync a single contact to Brevo using direct REST API.
 */
export async function syncContactToBrevo(contact: ContactData): Promise<void> {
  const attributes: Record<string, any> = {
    FIRSTNAME: contact.firstName || '',
    LASTNAME: contact.lastName || '',
    ...(contact.company ? { COMPANY: contact.company } : {}),
    ...contact.attributes,
  };

  if (contact.phone) attributes.PHONE = contact.phone;

  const listIds = [...(contact.listIds || [])];
  if (process.env.BREVO_NEWSLETTER_LIST_ID) {
    const defaultListId = Number(process.env.BREVO_NEWSLETTER_LIST_ID);
    if (!Number.isNaN(defaultListId) && !listIds.includes(defaultListId)) {
      listIds.push(defaultListId);
    }
  }

  const response = await fetch(`${BREVO_API_URL}/contacts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      email: contact.email,
      attributes,
      updateEnabled: true,
      ...(listIds.length > 0 ? { listIds } : {}),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Brevo API error (${response.status}): ${errorData.message || response.statusText}`);
  }

  console.log(`[Brevo] Successfully synced contact: ${contact.email}`);
}

/**
 * Subscribe contact to the configured newsletter list.
 */
export async function subscribeToNewsletter(email: string, firstName?: string, lastName?: string): Promise<void> {
  const listId = process.env.BREVO_NEWSLETTER_LIST_ID ? Number(process.env.BREVO_NEWSLETTER_LIST_ID) : undefined;
  await syncContactToBrevo({
    email,
    firstName: firstName || '',
    lastName: lastName || '',
    listIds: listId ? [listId] : [],
  });
}

/**
 * Send the single first-party welcome note. This remains opt-in so deployments
 * can keep an existing Brevo automation disabled until the direct email is ready.
 */
export async function sendNewsletterWelcomeEmail(email: string, firstName?: string): Promise<void> {
  if (process.env.BREVO_WELCOME_EMAIL_ENABLED !== 'true') return;

  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!senderEmail) throw new Error('BREVO_SENDER_EMAIL is required when the welcome email is enabled.');

  const senderName = process.env.BREVO_SENDER_NAME || 'The Revamp UG';
  const replyToEmail = process.env.BREVO_REPLY_TO_EMAIL || 'support@therevampug.com';
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://therevampug.com').replace(/\/$/, '');
  const recipientName = firstName?.trim() || 'there';
  const subject = 'Welcome to The Revamp UG';
  const textContent = `Hello ${recipientName},\n\nThank you for joining The Revamp UG. Your subscription is confirmed.\n\nA world of refined living, thoughtfully curated.\n\nWe are glad to have you with us. When we write, we will keep it considered and useful, with occasional notes from the studio and ideas for creating spaces that feel like your own.\n\nVisit The Revamp UG: ${siteUrl}\n\nWith warmth,\nThe Revamp UG\nKyanja | Kampala, Uganda\n\nYou received this confirmation because you subscribed on our website. To stop receiving these notes, reply to this email with unsubscribe.`;
  const logoUrl = `${siteUrl}/brand/revamp-logo.png`;
  const guideUrl = process.env.BREVO_WELCOME_GUIDE_URL?.trim();
  const attachment = guideUrl ? [{ url: guideUrl, name: 'MountViewSample-Model.pdf' }] : undefined;
  const htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
  </head>
  <body style="margin:0;background:#f7f4ef;color:#292521;font-family:Arial,Helvetica,sans-serif">
    <div style="width:100%;background:#f7f4ef;padding:30px 14px">
      <div style="max-width:590px;margin:0 auto;background:#f7f4ef">
        <div style="padding:18px 0 28px;border-bottom:1px solid #d8d0c7;text-align:center">
          <img src="${logoUrl}" alt="The Revamp UG" width="180" style="display:block;width:180px;max-width:72%;height:auto;margin:0 auto">
        </div>
        <div style="padding:48px 28px 34px">
          <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8c795a">Welcome to The Revamp UG</p>
          <h1 style="margin:22px 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1.08;font-weight:400;color:#292521">A world of refined living,<br>thoughtfully curated.</h1>
          <div style="width:34px;height:1px;background:#8c795a;margin:0 0 28px"></div>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#514a42">Hello ${recipientName},</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#514a42">Thank you for joining The Revamp UG. Your subscription is confirmed.</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#514a42">We are glad to have you with us. When we write, we will keep it considered and useful, with occasional notes from the studio and ideas for creating spaces that feel like your own.</p>
          <a href="${siteUrl}" style="display:inline-block;margin:8px 0 34px;padding:14px 19px;background:#292521;color:#f7f4ef;text-decoration:none;font-size:10px;letter-spacing:1.8px;text-transform:uppercase">Visit The Revamp UG</a>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#292521">With warmth,</p>
          <p style="margin:8px 0 0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8c795a">The Revamp UG</p>
        </div>
        <div style="padding:26px 28px 34px;border-top:1px solid #d8d0c7;text-align:center">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#292521">Kyanja | Kampala, Uganda</p>
          <p style="margin:12px 0 0;font-size:11px;line-height:1.7;color:#6c6258">You received this confirmation because you subscribed on our website.</p>
          <p style="margin:8px 0 0;font-size:11px;line-height:1.7;color:#6c6258">To stop receiving these notes, reply to this email with unsubscribe.</p>
        </div>
      </div>
    </div>
  </body>
</html>`;

  const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      replyTo: { email: replyToEmail, name: senderName },
      to: [{ email }],
      subject,
      textContent,
      htmlContent,
      ...(attachment ? { attachment } : {}),
      headers: {
        'X-Entity-Ref-ID': `newsletter-welcome-${Date.now()}`,
      },
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Brevo welcome email error (${response.status}): ${errorData.message || response.statusText}`);
  }
}
