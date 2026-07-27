/**
 * Brevo Contact Sync Service
 * Handles syncing contacts from the application database to Brevo
 */

import { getBrevoClient } from './client';
import { getContactListByKey, BREVO_LISTS } from './config';

interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  city?: string;
  company?: string;
  clientType?: string;
  leadSource?: string;
  serviceInterest?: string[];
  projectType?: string;
  membershipLevel?: string;
  tradeStatus?: string;
  supplierStatus?: string;
  preferredCommunication?: string;
  preferredLanguage?: string;
  marketingConsent?: boolean;
  attributes?: Record<string, any>;
  listIds?: number[];
}

/**
 * Sync a single contact to Brevo
 */
export async function syncContactToBrevo(contact: ContactData): Promise<void> {
  const client = getBrevoClient();

  const attributes: Record<string, any> = {
    FIRSTNAME: contact.firstName || '',
    LASTNAME: contact.lastName || '',
    ...contact.attributes,
  };

  if (contact.phone) attributes.PHONE = contact.phone;
  if (contact.country) attributes.COUNTRY = contact.country;
  if (contact.city) attributes.CITY = contact.city;
  if (contact.company) attributes.COMPANY = contact.company;
  if (contact.clientType) attributes.CLIENT_TYPE = contact.clientType;
  if (contact.leadSource) attributes.LEAD_SOURCE = contact.leadSource;
  if (contact.serviceInterest) attributes.SERVICE_INTEREST = contact.serviceInterest.join(',');
  if (contact.projectType) attributes.PROJECT_TYPE = contact.projectType;
  if (contact.membershipLevel) attributes.MEMBERSHIP_LEVEL = contact.membershipLevel;
  if (contact.tradeStatus) attributes.TRADE_STATUS = contact.tradeStatus;
  if (contact.supplierStatus) attributes.SUPPLIER_STATUS = contact.supplierStatus;
  if (contact.preferredCommunication)
    attributes.PREFERRED_COMMUNICATION = contact.preferredCommunication;
  if (contact.preferredLanguage) attributes.PREFERRED_LANGUAGE = contact.preferredLanguage;

  try {
    await client.createOrUpdateContact({
      email: contact.email,
      attributes,
      emailBlacklisted: false,
      smsBlacklisted: false,
      listIds: contact.listIds,
    });

    console.log(`[Brevo] Synced contact: ${contact.email}`);
  } catch (error) {
    console.error(`[Brevo] Failed to sync contact ${contact.email}:`, error);
    throw error;
  }
}

/**
 * Add a contact to a specific list
 */
export async function addContactToList(
  email: string,
  listKey: keyof typeof BREVO_LISTS
): Promise<void> {
  const client = getBrevoClient();
  const list = getContactListByKey(listKey);

  if (!list) {
    throw new Error(`Contact list not found: ${listKey}`);
  }

  try {
    // For now, we'll store list IDs in a mapping
    // In production, retrieve from database
    const listId = await getListIdFromKey(listKey);
    await client.addContactToList(listId, email);
    console.log(`[Brevo] Added ${email} to list: ${list.name}`);
  } catch (error) {
    console.error(`[Brevo] Failed to add contact to list:`, error);
    throw error;
  }
}

/**
 * Get list ID from configuration key
 * In production, this should query your database/cache
 */
async function getListIdFromKey(listKey: keyof typeof BREVO_LISTS): Promise<number> {
  // TODO: Implement proper storage of list ID mappings
  // For now, retrieve all lists and find by name
  const client = getBrevoClient();
  const list = getContactListByKey(listKey);

  if (!list) {
    throw new Error(`List not found: ${listKey}`);
  }

  const allLists = await client.getLists();
  const foundList = allLists.lists.find((l) => l.name === list.name);

  if (!foundList) {
    throw new Error(`List not found in Brevo: ${list.name}`);
  }

  return foundList.id;
}

/**
 * Sync multiple contacts to Brevo (batch)
 */
export async function syncContactsToBrevo(contacts: ContactData[]): Promise<void> {
  for (const contact of contacts) {
    try {
      await syncContactToBrevo(contact);
    } catch (error) {
      console.error(`Failed to sync contact: ${contact.email}`, error);
      // Continue with next contact on error
    }
  }
}

/**
 * Remove a contact from Brevo
 */
export async function removeContactFromBrevo(email: string): Promise<void> {
  const client = getBrevoClient();

  try {
    await client.deleteContact(email);
    console.log(`[Brevo] Deleted contact: ${email}`);
  } catch (error) {
    console.error(`[Brevo] Failed to delete contact ${email}:`, error);
    throw error;
  }
}

/**
 * Update contact's marketing consent
 */
export async function updateContactConsent(
  email: string,
  marketingConsent: boolean
): Promise<void> {
  const client = getBrevoClient();

  try {
    await client.updateContact(email, {
      attributes: { MARKETING_CONSENT: marketingConsent ? 'yes' : 'no' },
    });
    console.log(`[Brevo] Updated consent for: ${email}`);
  } catch (error) {
    console.error(`[Brevo] Failed to update consent for ${email}:`, error);
    throw error;
  }
}

/**
 * Subscribe contact to newsletter
 */
export async function subscribeToNewsletter(
  email: string,
  firstName?: string,
  lastName?: string
): Promise<void> {
  try {
    await syncContactToBrevo({
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      marketingConsent: true,
      listIds: [await getListIdFromKey('NEWSLETTER_SUBSCRIBERS')],
    });
  } catch (error) {
    console.error(`[Brevo] Failed to subscribe to newsletter:`, error);
    throw error;
  }
}

/**
 * Unsubscribe contact from newsletter
 */
export async function unsubscribeFromNewsletter(email: string): Promise<void> {
  try {
    await updateContactConsent(email, false);
  } catch (error) {
    console.error(`[Brevo] Failed to unsubscribe from newsletter:`, error);
    throw error;
  }
}
