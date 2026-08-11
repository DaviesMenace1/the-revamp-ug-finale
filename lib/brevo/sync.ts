export interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
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
    'accept': 'application/json',
    'content-type': 'application/json',
    'api-key': apiKey,
  };
}

/**
 * Sync a single contact to Brevo using direct REST API
 */
export async function syncContactToBrevo(contact: ContactData): Promise<void> {
  const attributes: Record<string, any> = {
    FIRSTNAME: contact.firstName || '',
    LASTNAME: contact.lastName || '',
    ...contact.attributes,
  };

  if (contact.phone) attributes.PHONE = contact.phone;

  const listIds = contact.listIds || [];
  if (process.env.BREVO_NEWSLETTER_LIST_ID) {
    const defaultListId = Number(process.env.BREVO_NEWSLETTER_LIST_ID);
    if (!isNaN(defaultListId) && !listIds.includes(defaultListId)) {
      listIds.push(defaultListId);
    }
  }

  const payload = {
    email: contact.email,
    attributes,
    updateEnabled: true,
    ...(listIds.length > 0 ? { listIds } : {}),
  };

  const response = await fetch(`${BREVO_API_URL}/contacts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Brevo API error (${response.status}): ${errorData.message || response.statusText}`
    );
  }

  console.log(`[Brevo] Successfully synced contact: ${contact.email}`);
}

/**
 * Subscribe contact to newsletter
 */
export async function subscribeToNewsletter(
  email: string,
  firstName?: string,
  lastName?: string
): Promise<void> {
  const listId = process.env.BREVO_NEWSLETTER_LIST_ID
    ? Number(process.env.BREVO_NEWSLETTER_LIST_ID)
    : undefined;

  await syncContactToBrevo({
    email,
    firstName: firstName || '',
    lastName: lastName || '',
    listIds: listId ? [listId] : [],
  });
}
