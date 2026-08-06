# Brevo Integration Setup Guide

This document outlines how to set up and configure Brevo for The Revamp UG email marketing platform.

## Overview

Brevo is used as the **communication platform only**. The source of truth for all customer, supplier, project, order, and membership data remains in the PostgreSQL database. Contacts are automatically synchronized from the application into Brevo.

## Quick Start

### 1. Set Environment Variable

Add your Brevo API key to `.env.local`:

```bash
BREVO_API_KEY=your_brevo_api_key_here
```

Get your API key from [Brevo Account Settings](https://app.brevo.com/settings/account).

### 2. Run Setup Script

```bash
pnpm tsx scripts/brevo-setup.ts
```

This will:
- Create all 12 contact folders
- Create all 50+ contact lists
- Display the list ID mappings for reference

### 3. Create Email Template Folders

In Brevo UI (app.brevo.com):
1. Go to **Templates** → **Folders**
2. Create the following folders:
   - Authentication
   - Welcome Emails
   - Consultation
   - Quotations
   - Projects
   - Procurement
   - Orders
   - Payments
   - Installations
   - Newsletter
   - Journal
   - Trade Programme
   - Membership
   - Supplier Portal
   - AI Concierge
   - Marketing
   - Internal Notifications

### 4. Create Email Templates

Create templates in each folder as needed (optional for MVP):
- Welcome emails
- Newsletter templates
- Transactional emails

### 5. Set Up Automations

Create automation workflows in Brevo UI:
- New user welcome sequence
- Newsletter confirmation flow
- Project milestone notifications

## Folder Structure

### Default Enabled Folders (MVP)

1. **Website Leads** - All inbound inquiries from the website
   - General Enquiries
   - Consultation Requests
   - Quote Requests
   - Product Enquiries
   - Source With Revamp Enquiries
   - Contact Form Leads

2. **Clients** - Client lifecycle management
   - Prospective Clients
   - Active Clients
   - Previous Clients
   - VIP Clients
   - Hospitality Clients
   - Commercial Clients
   - Residential Clients

3. **Newsletter** - Content marketing
   - Newsletter Subscribers
   - Design Guide Downloads
   - Journal Subscribers
   - Weekly Digest
   - Monthly Editorial

4. **Products & Collections** - Future eCommerce
   - Furniture Interest
   - Decor Interest
   - Lighting Interest
   - Art Interest
   - Textiles Interest
   - Limited Edition Interest

5. **Procurement & Sourcing** - Sourcing communications
   - China Sourcing Clients
   - Procurement Clients
   - Factory Visits
   - Logistics Updates
   - Shipping Notifications

6. **Projects** - Project lifecycle
   - Consultation Scheduled
   - Design Phase
   - Procurement Phase
   - Installation Phase
   - Completed Projects

7. **Internal Team** - Internal communications
   - Administrators
   - Designers
   - Architects
   - Procurement Team
   - Installers
   - Marketing
   - Finance
   - Management

8. **Automation** - System-managed workflows
   - New User Welcome
   - Consultation Confirmations
   - Quote Notifications
   - Payment Notifications
   - Installation Updates
   - Appointment Reminders
   - Project Updates

### Future Disabled Folders (Phase 2+)

- **Trade Programme** - Trade member communications
- **Membership** - Luxury membership program
- **Supplier Network** - Supplier portal communications
- **Events** - Luxury experiences and events

## Contact Attributes

Every contact synced to Brevo includes:

```typescript
- firstName (required)
- lastName (required)
- phone
- country
- city
- company
- clientType (Residential, Commercial, Hospitality, etc.)
- leadSource (Website, Referral, Social Media, Trade, Event, Direct)
- serviceInterest (Interior Design, Architecture, Sourcing, etc.)
- projectType (Residential, Commercial, Hospitality, Mixed, Consultation Only)
- membershipLevel (Essential, Collector, Patron, Black, None)
- tradeStatus (Not Applied, Pending, Approved, Active, Inactive)
- supplierStatus (Not Supplier, Pending, Active, Preferred, Inactive)
- preferredCommunication (Email, Phone, WhatsApp, SMS)
- preferredLanguage (English, Swahili, French)
- marketingConsent (boolean - GDPR compliance)
- dateJoined (timestamp)
- lastInteraction (timestamp)
- assignedStaffMember (reference to team member)
```

## Usage in Application

### Subscribe to Newsletter

```typescript
import { subscribeToNewsletter } from '@/lib/brevo/sync';

await subscribeToNewsletter(email, firstName, lastName);
```

### Add Contact to List

```typescript
import { addContactToList } from '@/lib/brevo/sync';

await addContactToList(email, 'CONSULTATION_REQUESTS');
```

### Sync Full Contact Profile

```typescript
import { syncContactToBrevo } from '@/lib/brevo/sync';

await syncContactToBrevo({
  email: 'client@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+254722000000',
  country: 'Kenya',
  city: 'Nairobi',
  company: 'Acme Corp',
  clientType: 'Commercial',
  leadSource: 'Website',
  serviceInterest: ['Interior Design', 'Architecture'],
  projectType: 'Commercial',
  membershipLevel: 'Essential',
  marketingConsent: true,
});
```

### Newsletter Signup Endpoint

```typescript
// POST /api/newsletter/subscribe
// Body: { email, firstName?, lastName? }
// Response: { success: true, email }
```

## API Routes

All Brevo integration routes are located under `/app/api/newsletter/` and `/app/api/brevo/`:

### Newsletter
- `POST /api/newsletter/subscribe` - Subscribe to newsletter
- `POST /api/newsletter/unsubscribe` - Unsubscribe from newsletter

### Future API Routes (Phase 2)
- `GET /api/brevo/lists` - Get all contact lists
- `POST /api/brevo/contacts/sync` - Manual contact sync
- `POST /api/brevo/campaigns/create` - Create marketing campaign
- `POST /api/brevo/automations/trigger` - Trigger automation workflow

## Database Considerations

You'll need to store:
1. **List ID Mappings** - Map Brevo list IDs to your application lists
   ```sql
   CREATE TABLE brevo_list_mappings (
     id SERIAL PRIMARY KEY,
     list_key VARCHAR UNIQUE,
     brevo_list_id INTEGER,
     created_at TIMESTAMP
   );
   ```

2. **Contact Sync Log** (optional)
   ```sql
   CREATE TABLE brevo_sync_logs (
     id SERIAL PRIMARY KEY,
     contact_id INTEGER,
     email VARCHAR,
     status VARCHAR,
     synced_at TIMESTAMP
   );
   ```

## Troubleshooting

### API Key Not Set
```
Error: BREVO_API_KEY is not set in environment variables
```
Solution: Add `BREVO_API_KEY` to `.env.local`

### List Not Found
```
Error: List not found in Brevo
```
Solution: Run the setup script again to create missing lists

### Contact Not Syncing
Check console logs for errors. Common issues:
- Invalid email format
- Rate limiting (Brevo has API limits)
- Invalid list IDs

Enable debug logging:
```typescript
// Add to sync functions
console.log('[Brevo]', 'Debug info...');
```

## Testing

### Manual Test
```bash
# Subscribe to newsletter
curl -X POST http://localhost:3000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","firstName":"John","lastName":"Doe"}'

# Expected response:
# { "success": true, "message": "Successfully subscribed to newsletter", "email": "test@example.com" }
```

## Production Checklist

- [ ] BREVO_API_KEY set in production environment
- [ ] Run setup script: `pnpm tsx scripts/brevo-setup.ts`
- [ ] Store list ID mappings in database
- [ ] Create email templates in Brevo UI
- [ ] Set up automation workflows
- [ ] Configure unsubscribe links (GDPR compliance)
- [ ] Test newsletter signup
- [ ] Monitor sync logs
- [ ] Set up alerts for sync failures

## Security Notes

1. **API Key**: Keep BREVO_API_KEY secret, never commit to git
2. **Unsubscribe**: All emails must include unsubscribe links (GDPR)
3. **Consent**: Always require marketing consent before adding to promotional lists
4. **Data**: Only sync necessary contact information
5. **Rate Limits**: Implement retry logic for API calls

## Support

For Brevo API documentation, visit: https://developers.brevo.com/

For issues, check:
- Brevo API status: https://status.brevo.com/
- Application logs in `/app/api/newsletter/` routes
- Brevo account dashboard for sync errors
