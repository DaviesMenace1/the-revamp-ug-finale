import { syncContactToBrevo } from '@/lib/brevo/sync';
import { db } from './client';
import { users, orders, consultations } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Sync user to Brevo when they sign up
 */
export async function syncNewUserToBrevo(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) return;

    await syncContactToBrevo({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      company: user.company,
      attributes: {
        clientType: user.clientType,
        leadSource: 'website_signup',
        dateJoined: new Date().toISOString(),
      },
      listIds: [2], // Prospective Clients
    });
  } catch (error) {
    console.error('[Brevo Sync] Error syncing new user:', error);
  }
}

/**
 * Sync consultation request to Brevo
 */
export async function syncConsultationToBrevo(consultationId: string) {
  try {
    const consultation = await db.query.consultations.findFirst({
      where: eq(consultations.id, consultationId),
    });

    if (!consultation) return;

    const user = await db.query.users.findFirst({
      where: eq(users.id, consultation.userId),
    });

    if (!user) return;

    await syncContactToBrevo({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      company: user.company,
      attributes: {
        serviceInterest: consultation.serviceType,
        projectType: consultation.projectType,
        budget: consultation.budget?.toString(),
        consultationDate: consultation.scheduledAt?.toISOString(),
        leadSource: 'consultation_request',
      },
      listIds: [6, 11], // Consultation Requests + Consultation Scheduled
    });
  } catch (error) {
    console.error('[Brevo Sync] Error syncing consultation:', error);
  }
}

/**
 * Sync order to Brevo
 */
export async function syncOrderToBrevo(orderId: string) {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) return;

    const user = await db.query.users.findFirst({
      where: eq(users.id, order.userId),
    });

    if (!user) return;

    // Determine which list based on order status
    const listIds: number[] = [];
    if (order.status === 'pending') {
      listIds.push(13); // Quote Notifications
    } else if (order.status === 'confirmed') {
      listIds.push(32); // Payment Notifications
    } else if (order.status === 'shipped') {
      listIds.push(34); // Shipping Notifications
    }

    await syncContactToBrevo({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      company: user.company,
      attributes: {
        orderStatus: order.status,
        orderTotal: order.totalAmount?.toString(),
        orderDate: order.createdAt?.toISOString(),
        lastInteraction: new Date().toISOString(),
      },
      listIds,
    });
  } catch (error) {
    console.error('[Brevo Sync] Error syncing order:', error);
  }
}

/**
 * Update Brevo contact to Active Client when they make a purchase
 */
export async function markAsActiveClientInBrevo(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) return;

    await syncContactToBrevo({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      company: user.company,
      attributes: {
        clientType: 'active',
        lastPurchase: new Date().toISOString(),
      },
      listIds: [9], // Active Clients
    });
  } catch (error) {
    console.error('[Brevo Sync] Error marking as active client:', error);
  }
}
