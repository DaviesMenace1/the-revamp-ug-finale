# Brevo Integration - Quick Start Guide

## Environment Setup

Add to your `.env.local`:

```bash
BREVO_API_KEY=your_brevo_api_key_here
```

Get your API key from: https://app.brevo.com/settings/keys/api

---

## One-Time Setup

Run the setup script to create all folders and contact lists in Brevo:

```bash
pnpm tsx scripts/brevo-setup.ts
```

This will:
- Create 12 main folders
- Create 50+ contact lists across all folders
- Set up contact attributes
- Configure automation lists
- Log progress and any errors

---

## Folder Structure Created

### 1. Website Leads (7 lists)
- General Enquiries
- Consultation Requests
- Quote Requests
- Product Enquiries
- Source With Revamp Enquiries
- Contact Form Leads

### 2. Clients (7 lists)
- Prospective Clients
- Active Clients
- Previous Clients
- VIP Clients
- Hospitality Clients
- Commercial Clients
- Residential Clients

### 3. Trade Programme (9 lists) - *Disabled by default*
- Trade Applications, Approved Trade Members, Pending Approval
- Architects, Interior Designers, Developers
- Hotels, Restaurants, Property Investors

### 4. Membership (5 lists) - *Disabled by default*
- Waiting List
- Essential, Collector, Patron, Black Members

### 5. Newsletter (5 lists)
- Newsletter Subscribers
- Design Guide Downloads
- Journal Subscribers
- Weekly Digest
- Monthly Editorial

### 6. Products & Collections (6 lists)
- Furniture, Decor, Lighting, Art, Textiles Interest
- Limited Edition Interest

### 7. Procurement & Sourcing (5 lists)
- China Sourcing Clients
- Procurement Clients
- Factory Visits
- Logistics Updates
- Shipping Notifications

### 8. Projects (5 lists)
- Consultation Scheduled
- Design Phase, Procurement Phase, Installation Phase
- Completed Projects

### 9. Supplier Network (5 lists) - *Disabled by default*
- Active, Pending, International, Local, Preferred Suppliers

### 10. Internal Team (8 lists)
- Administrators, Designers, Architects
- Procurement Team, Installers, Marketing
- Finance, Management

### 11. Events (5 lists) - *Disabled by default*
- Event Invitations, Private Events
- Product Launches, Design Workshops
- VIP Experiences

### 12. Automation (7 lists) - *System managed*
- New User Welcome
- Consultation Confirmations
- Quote Notifications
- Payment Notifications
- Installation Updates
- Appointment Reminders
- Project Updates

---

## Newsletter Signup Form

### Using the Newsletter Component

```tsx
import { NewsletterSignup } from '@/components/newsletter-signup'

export default function Footer() {
  return (
    <footer>
      <NewsletterSignup />
    </footer>
  )
}
```

The component handles:
- Email validation
- Loading states
- Success/error messages
- Accessibility (ARIA labels)
- Responsive design

---

## API Endpoint

### POST `/api/newsletter/subscribe`

Subscribe a user to the newsletter.

**Request:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Subscription confirmed. Check your email."
}
```

**Response (Error - 400/500):**
```json
{
  "success": false,
  "error": "Email already subscribed"
}
```

---

## Contact Sync Service

### Syncing Contacts from PostgreSQL

The `lib/brevo/sync.ts` file provides functions to sync contacts:

```typescript
import { syncContactToBrevo } from '@/lib/brevo/sync'

// Sync a single contact
await syncContactToBrevo({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  country: 'United States',
  city: 'New York',
  company: 'Acme Inc',
  clientType: 'Residential',
  leadSource: 'Website Form',
  lists: ['Newsletter Subscribers', 'General Enquiries']
})
```

### Batch Sync

```typescript
import { syncMultipleContacts } from '@/lib/brevo/sync'

await syncMultipleContacts([
  { email: 'user1@example.com', firstName: 'John', ... },
  { email: 'user2@example.com', firstName: 'Jane', ... },
  // ... more contacts
])
```

---

## Brevo Config Structure

The `lib/brevo/config.ts` file defines:

- **Folders:** Organization hierarchy
- **Lists:** Contact lists for each folder
- **Contact Attributes:** Custom fields for contact data
- **Defaults:** Which modules are enabled/disabled

### Accessing Configuration

```typescript
import { BREVO_FOLDERS, BREVO_LISTS } from '@/lib/brevo/config'

// Get all lists
console.log(BREVO_FOLDERS)

// Get specific folder lists
console.log(BREVO_LISTS.WEBSITE_LEADS)
```

---

## Brevo API Client

The `lib/brevo/client.ts` file provides a wrapper around the Brevo REST API.

### Available Methods

```typescript
import { brevoClient } from '@/lib/brevo/client'

// Create folder
await brevoClient.createFolder(folderName)

// Get contact list ID
await brevoClient.getListId(listName)

// Add contact to list
await brevoClient.addContactToList(email, listId, attributes)

// Update contact
await brevoClient.updateContact(email, attributes)

// Send email
await brevoClient.sendTransactionalEmail({
  to: [{ email, name }],
  subject: 'Welcome',
  htmlContent: '<html>...</html>'
})
```

---

## Contact Attributes

Every contact in Brevo supports:

- First Name
- Last Name
- Phone Number
- Country
- City
- Company
- Client Type (Residential, Commercial, Hospitality, etc.)
- Lead Source (Website Form, Email, Referral, etc.)
- Service Interest (Design, Sourcing, Procurement, etc.)
- Project Type
- Membership Level
- Trade Status
- Supplier Status
- Preferred Communication Method
- Marketing Consent
- Preferred Language
- Date Joined
- Last Interaction
- Assigned Staff Member

---

## Database Integration

### Contact Source of Truth

- **PostgreSQL** = Source of truth for all customer/client data
- **Brevo** = Communication platform only

When data changes in your app:

1. Update PostgreSQL database
2. Trigger sync to Brevo via `syncContactToBrevo()`
3. Brevo keeps contact info in sync for email campaigns

### Webhook Example

When a user signs up via the app:

```typescript
// 1. Save to database
const newContact = await db.contacts.create({
  email, firstName, lastName, ...
})

// 2. Sync to Brevo
await syncContactToBrevo({
  email,
  firstName,
  lastName,
  lists: ['Website Leads', 'Newsletter Subscribers']
})

// 3. Optionally trigger automation
await brevoClient.triggerAutomation('new-user-welcome', email)
```

---

## Debugging

### Check if Setup Completed

```typescript
import { brevoClient } from '@/lib/brevo/client'

// Verify API connection
const status = await brevoClient.checkConnection()
console.log('Brevo connected:', status)
```

### View Created Lists

Log in to Brevo and navigate to:
- **Contacts** → **Lists** (see all contact lists)
- **Settings** → **API & Webhooks** → **API Keys** (verify your key)

### Common Issues

**Error: "BREVO_API_KEY is not set"**
- Add `BREVO_API_KEY` to your `.env.local`
- Restart the dev server

**Error: "Folder already exists"**
- Brevo doesn't allow duplicate folder names
- Check existing folders in Brevo dashboard
- Run setup script only once per environment

**Error: "Invalid email"**
- Validate email format before calling sync
- Use the built-in validation in NewsletterSignup component

---

## Next Steps

1. Set up `BREVO_API_KEY` in `.env.local`
2. Run `pnpm tsx scripts/brevo-setup.ts` once
3. Add `<NewsletterSignup />` to your footer
4. Test newsletter signup form
5. Verify contacts appear in Brevo dashboard
6. Set up email templates in Brevo for each folder
7. Configure automation workflows as needed

---

## Useful Links

- [Brevo API Documentation](https://developers.brevo.com/reference)
- [Brevo Dashboard](https://app.brevo.com)
- [Brevo Help Center](https://help.brevo.com)
- [Brevo Contact Management Guide](https://help.brevo.com/hc/en-us/articles/209467485)
