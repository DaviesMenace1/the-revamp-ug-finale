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
export async function sendNewsletterWelcomeEmail(email: string): Promise<void> {
  if (process.env.BREVO_WELCOME_EMAIL_ENABLED !== 'true') return;

  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!senderEmail) throw new Error('BREVO_SENDER_EMAIL is required when the welcome email is enabled.');

  const senderName = process.env.BREVO_SENDER_NAME || 'The Revamp UG';
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://therevampug.com').replace(/\/$/, '');
  const subject = 'Welcome to The Revamp UG';
  const previewText = 'A world of refined living, thoughtfully curated.';
  const textContent = `Welcome to The Revamp UG.\n\nA world of refined living, thoughtfully curated.\n\nThank you for joining The Revamp UG. You are now part of a growing community of people who appreciate considered spaces, exceptional materials, and the quiet beauty of things made well.\n\nThrough our journal and newsletter, we will share inspiration, new collections, design perspectives, curated discoveries, and stories from the world of interiors and architecture.\n\nA gift from The Revamp UG\nYour promised guide will be shared with you separately once it is available.\n\nConsider this the beginning of your journey with us. There is much more to come.\n\nWith warmth,\nThe Revamp UG\n\nKyanja | Kampala, Uganda\n\nYou received this because you subscribed to our newsletter.`;
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
  <body style="margin:0;background:#e9dfd3;color:#292521;font-family:Arial,Helvetica,sans-serif">
    <div style="width:100%;background:#e9dfd3;padding:28px 12px">
      <div style="max-width:620px;margin:0 auto;background:#e9dfd3">
        <div style="background:#0f0e0d;padding:44px 30px;text-align:center">
          <img src="${logoUrl}" alt="The Revamp UG" width="260" style="display:block;width:260px;max-width:100%;height:auto;margin:0 auto">
        </div>
        <div style="padding:68px 44px 36px;background:#e9dfd3">
          <p style="margin:0;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#8c795a">Welcome to The Revamp UG</p>
          <h1 style="margin:24px 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:42px;line-height:1.04;font-weight:400;color:#292521">A world of refined living,<br>thoughtfully curated.</h1>
          <div style="width:38px;height:1px;background:#8c795a;margin:0 0 25px"></div>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.8;color:#514a42">Thank you for joining The Revamp UG.</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.8;color:#514a42">You are now part of a growing community of people who appreciate considered spaces, exceptional materials, and the quiet beauty of things made well.</p>
          <p style="margin:0;font-size:14px;line-height:1.8;color:#514a42">Through our journal and newsletter, we will share inspiration, new collections, design perspectives, curated discoveries, and stories from the world of interiors and architecture.</p>
          <div style="margin:38px 0 30px;border:1px solid #d0c4b6;padding:25px 24px;background:#eee6dc">
            <p style="margin:0 0 12px;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#8c795a">A gift from The Revamp UG</p>
            <h2 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.2;font-weight:400;color:#292521">Your promised guide is on its way.</h2>
            <p style="margin:0;font-size:12px;line-height:1.7;color:#514a42">We will share your complimentary guide as soon as it is connected to the welcome email. We hope it gives you a little inspiration for the spaces you are creating, refining, or dreaming about.</p>
          </div>
          <p style="margin:0 0 30px;font-size:14px;line-height:1.8;color:#514a42">Consider this the beginning of your journey with us. There is much more to come.</p>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#292521">With warmth,</p>
          <p style="margin:7px 0 0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8c795a">The Revamp UG</p>
        </div>
        <div style="padding:30px 24px 36px;background:#e9dfd3;text-align:center;border-top:1px solid #d0c4b6">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#292521">The Revamp UG</p>
          <p style="margin:7px 0 25px;font-size:12px;color:#6c6258">Kyanja | Kampala, Uganda</p>
          <p style="margin:0;font-size:11px;line-height:1.7;color:#6c6258">You received this because you subscribed to our newsletter.</p>
          <p style="margin:10px 0 0;font-size:11px;color:#6c6258">You can unsubscribe by replying to this email.</p>
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
      replyTo: { email: process.env.BREVO_REPLY_TO_EMAIL || 'support@therevampug.com', name: senderName },
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
