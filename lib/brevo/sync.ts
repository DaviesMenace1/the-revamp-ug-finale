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
 * Send the optional first-party welcome note. This is deliberately opt-in so
 * an existing Brevo automation does not send a duplicate message.
 */
export async function sendNewsletterWelcomeEmail(email: string): Promise<void> {
  if (process.env.BREVO_WELCOME_EMAIL_ENABLED !== 'true') return;

  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!senderEmail) throw new Error('BREVO_SENDER_EMAIL is required when the welcome email is enabled.');

  const senderName = process.env.BREVO_SENDER_NAME || 'The Revamp UG';
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://therevampug.com').replace(/\/$/, '');
  const subject = 'A note from The Revamp UG';
  const textContent = `Welcome to The Revamp UG.\n\nYou will receive occasional notes from our studio about new arrivals, considered spaces, sourcing stories, and invitations worth opening.\n\nExplore the studio: ${siteUrl}\n\nYou can unsubscribe whenever you like.`;
  const htmlContent = `<!doctype html><html lang="en"><body style="margin:0;background:#f5f3ee;color:#1d1c1a;font-family:Arial,sans-serif"><div style="max-width:620px;margin:0 auto;padding:28px 18px"><div style="background:#1d1c1a;color:#f5f3ee;padding:34px 30px"><p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c5a66e">The Revamp UG</p><h1 style="margin:52px 0 14px;font-family:Georgia,serif;font-size:42px;line-height:1.03;font-weight:400">A quieter way to stay close.</h1><p style="margin:0;max-width:430px;font-size:16px;line-height:1.7;color:#ddd8cf">Welcome to the studio letter. We will share new arrivals, room ideas, sourcing stories, and invitations worth opening.</p><a href="${siteUrl}" style="display:inline-block;margin-top:30px;padding:14px 20px;background:#f5f3ee;color:#1d1c1a;text-decoration:none;font-size:11px;letter-spacing:1.5px;text-transform:uppercase">Visit the studio</a></div><div style="padding:24px 8px;color:#6d6962;font-size:12px;line-height:1.7"><p style="margin:0">You are receiving this because you subscribed on the Revamp UG website.</p><p style="margin:8px 0 0">You can unsubscribe whenever you like.</p></div></div></body></html>`;

  const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email }],
      subject,
      textContent,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Brevo welcome email error (${response.status}): ${errorData.message || response.statusText}`);
  }
}
