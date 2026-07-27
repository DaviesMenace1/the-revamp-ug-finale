# Brevo Integration Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   THE REVAMP UG APPLICATION                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────────────┐  │
│  │   FRONTEND       │         │   NEXT.JS BACKEND        │  │
│  ├──────────────────┤         ├──────────────────────────┤  │
│  │ Newsletter Form  │─────┐   │ API Routes               │  │
│  │ Contact Forms    │─────┼──▶│ /api/newsletter/sub      │  │
│  │ Signup           │─────┤   │ /api/forms/contact       │  │
│  │ Project Forms    │─────┘   │ /api/auth/signup         │  │
│  └──────────────────┘         │ etc.                     │  │
│                               └──────────┬───────────────┘  │
│                                          │                   │
│  ┌──────────────────────────────────────▼──────────────┐    │
│  │            PostgreSQL Database                      │    │
│  ├───────────────────────────────────────────────────┤    │
│  │ users | contacts | projects | consultations       │    │
│  │ quotations | orders | suppliers | teams           │    │
│  │                                                    │    │
│  │ (Source of Truth)                                 │    │
│  └────────────┬──────────────────────────────────────┘    │
│               │                                             │
└───────────────┼─────────────────────────────────────────────┘
                │
                │ Sync Service
                │ syncContactToBrevo()
                │
    ┌───────────▼────────────┐
    │   BREVO EMAIL PLATFORM │
    ├───────────────────────┤
    │   Contact Management   │
    │   Email Campaigns      │
    │   Automation Workflows │
    │   Transactional Email  │
    │   Analytics            │
    └───────────────────────┘
```

---

## Data Flow Diagrams

### 1. Newsletter Signup Flow

```
User visits website
        │
        ▼
┌──────────────────────────┐
│ Newsletter Form          │
│ (components/newsletter)  │
└──────────────┬───────────┘
               │
        ▼
    Email validation
               │
        ▼
POST /api/newsletter/subscribe
               │
        ┌─────┴─────┐
        │           │
        ▼           ▼
  ┌─────────────────────────┐
  │ Database Check          │
  │ (Is email new?)         │
  └────────┬────────────────┘
           │
           ├─ New ─────────────┐
           │                   │
           └─ Exists ──────────┤
                               ▼
                    ┌────────────────────────┐
                    │ syncContactToBrevo()   │
                    │ (lib/brevo/sync.ts)    │
                    └────────────┬───────────┘
                                 │
                    ┌────────────▼───────────┐
                    │ Brevo API Client       │
                    │ (lib/brevo/client.ts)  │
                    └────────────┬───────────┘
                                 │
                    ┌────────────▼─────────────────────┐
                    │ Brevo                             │
                    │ - Newsletter Subscribers list      │
                    │ - Create/Update contact          │
                    │ - Trigger welcome automation     │
                    └───────────────────────────────────┘
                                 │
                    ┌────────────▼───────────┐
                    │ Return Success         │
                    │ Show message to user   │
                    └───────────────────────┘
```

---

### 2. Contact Creation Flow (New User Signup)

```
User signs up via auth form
        │
        ▼
┌─────────────────────────────────┐
│ Database: Create User           │
│ - email, name, phone, etc.      │
│ - Store in users table          │
└────────────────┬────────────────┘
                 │
        ┌────────▼──────────┐
        │ Determine Lists   │
        │ Based on user     │
        │ type/source       │
        └────────┬──────────┘
                 │
        ┌────────▼───────────────────────┐
        │ syncContactToBrevo({           │
        │   email,                       │
        │   firstName,                   │
        │   lastName,                    │
        │   leadSource: 'Signup',        │
        │   lists: [                     │
        │     'Prospective Clients',     │
        │     'Website Leads'            │
        │   ]                            │
        │ })                             │
        └────────┬───────────────────────┘
                 │
        ┌────────▼────────────────────┐
        │ Brevo API                    │
        │ - Create or update contact   │
        │ - Add to lists               │
        │ - Set attributes             │
        └────────┬────────────────────┘
                 │
        ┌────────▼──────────────────────┐
        │ Trigger Automation            │
        │ - New user welcome email      │
        │ - Product recommendations    │
        │ - Onboarding sequence        │
        └───────────────────────────────┘
```

---

### 3. Batch Contact Sync Flow

```
Bulk operation (import, migration, etc.)
        │
        ▼
┌──────────────────────────┐
│ Collect contact data     │
│ from database            │
└────────────┬─────────────┘
             │
    ┌────────▼──────────────┐
    │ Validate emails       │
    │ Remove duplicates     │
    │ Prepare attributes    │
    └────────┬──────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │ syncMultipleContacts([               │
    │   { email, firstName, lists },       │
    │   { email, firstName, lists },       │
    │   ...                                │
    │ ])                                   │
    └────────┬──────────────────────────────┘
             │
    ┌────────▼────────────────────┐
    │ Process in batches          │
    │ (50 contacts at a time)     │
    └────────┬────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Brevo API Calls              │
    │ - Add/update contacts        │
    │ - Add to multiple lists      │
    │ - Handle rate limits         │
    └────────┬──────────────────────┘
             │
    ┌────────▼──────────────────────┐
    │ Log results                  │
    │ - Success count              │
    │ - Error count                │
    │ - Duration                   │
    └──────────────────────────────┘
```

---

## Folder & List Hierarchy

```
┌─ Brevo Account ─────────────────────────────────────────┐
│                                                           │
│  ┌─ Website Leads (folder)          [7 lists]           │
│  │  ├─ General Enquiries                                │
│  │  ├─ Consultation Requests                            │
│  │  ├─ Quote Requests                                  │
│  │  ├─ Product Enquiries                               │
│  │  ├─ Source With Revamp Enquiries                    │
│  │  └─ Contact Form Leads                              │
│  │                                                       │
│  ├─ Clients (folder)                [7 lists]           │
│  │  ├─ Prospective Clients                             │
│  │  ├─ Active Clients                                  │
│  │  ├─ Previous Clients                                │
│  │  ├─ VIP Clients                                     │
│  │  ├─ Hospitality Clients                             │
│  │  ├─ Commercial Clients                              │
│  │  └─ Residential Clients                             │
│  │                                                       │
│  ├─ Newsletter (folder)              [5 lists]           │
│  │  ├─ Newsletter Subscribers ◄── PRIMARY               │
│  │  ├─ Design Guide Downloads                          │
│  │  ├─ Journal Subscribers                             │
│  │  ├─ Weekly Digest                                   │
│  │  └─ Monthly Editorial                               │
│  │                                                       │
│  ├─ Projects (folder)                [5 lists]           │
│  │  ├─ Consultation Scheduled                          │
│  │  ├─ Design Phase                                    │
│  │  ├─ Procurement Phase                               │
│  │  ├─ Installation Phase                              │
│  │  └─ Completed Projects                              │
│  │                                                       │
│  ├─ Trade Programme (folder)         [9 lists] DISABLED │
│  │  ├─ Trade Applications                              │
│  │  ├─ Approved Trade Members                          │
│  │  ├─ Pending Approval                                │
│  │  ├─ Architects                                      │
│  │  ├─ Interior Designers                              │
│  │  ├─ Developers                                      │
│  │  ├─ Hotels                                          │
│  │  ├─ Restaurants                                     │
│  │  └─ Property Investors                              │
│  │                                                       │
│  ├─ Membership (folder)              [5 lists] DISABLED │
│  │  ├─ Waiting List                                    │
│  │  ├─ Essential Members                               │
│  │  ├─ Collector Members                               │
│  │  ├─ Patron Members                                  │
│  │  └─ Black Members                                   │
│  │                                                       │
│  ├─ Procurement & Sourcing (folder)  [5 lists]          │
│  │  ├─ China Sourcing Clients                          │
│  │  ├─ Procurement Clients                             │
│  │  ├─ Factory Visits                                  │
│  │  ├─ Logistics Updates                               │
│  │  └─ Shipping Notifications                          │
│  │                                                       │
│  ├─ Products & Collections (folder)  [6 lists]          │
│  │  ├─ Furniture Interest                              │
│  │  ├─ Decor Interest                                  │
│  │  ├─ Lighting Interest                               │
│  │  ├─ Art Interest                                    │
│  │  ├─ Textiles Interest                               │
│  │  └─ Limited Edition Interest                        │
│  │                                                       │
│  ├─ Supplier Network (folder)        [5 lists] DISABLED │
│  │  ├─ Active Suppliers                                │
│  │  ├─ Pending Suppliers                               │
│  │  ├─ International Suppliers                         │
│  │  ├─ Local Suppliers                                 │
│  │  └─ Preferred Suppliers                             │
│  │                                                       │
│  ├─ Internal Team (folder)           [8 lists]          │
│  │  ├─ Administrators                                  │
│  │  ├─ Designers                                       │
│  │  ├─ Architects                                      │
│  │  ├─ Procurement Team                                │
│  │  ├─ Installers                                      │
│  │  ├─ Marketing                                       │
│  │  ├─ Finance                                         │
│  │  └─ Management                                      │
│  │                                                       │
│  ├─ Events (folder)                  [5 lists] DISABLED │
│  │  ├─ Event Invitations                               │
│  │  ├─ Private Events                                  │
│  │  ├─ Product Launches                                │
│  │  ├─ Design Workshops                                │
│  │  └─ VIP Experiences                                 │
│  │                                                       │
│  └─ Automation (folder)              [7 lists] SYSTEM    │
│     ├─ New User Welcome                                │
│     ├─ Consultation Confirmations                      │
│     ├─ Quote Notifications                             │
│     ├─ Payment Notifications                           │
│     ├─ Installation Updates                            │
│     ├─ Appointment Reminders                           │
│     └─ Project Updates                                 │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Contact Attribute Schema

```
Every contact has these custom fields:

┌──────────────────────────────────────────────┐
│ Brevo Contact Attributes                     │
├──────────────────────────────────────────────┤
│ FIRSTNAME              (String)               │
│ LASTNAME               (String)               │
│ PHONE                  (String)               │
│ COUNTRY                (String)               │
│ CITY                   (String)               │
│ COMPANY                (String)               │
│ CLIENT_TYPE            (String)               │
│   └─ Residential / Commercial / Hospitality │
│ LEAD_SOURCE            (String)               │
│   └─ Website / Email / Referral / etc.      │
│ SERVICE_INTEREST       (String)               │
│   └─ Design / Sourcing / Procurement / etc. │
│ PROJECT_TYPE           (String)               │
│ MEMBERSHIP_LEVEL       (String)               │
│   └─ Waiting / Essential / Collector / etc. │
│ TRADE_STATUS           (String)               │
│ SUPPLIER_STATUS        (String)               │
│ PREFERRED_COMM         (String)               │
│   └─ Email / Phone / WhatsApp / etc.        │
│ MARKETING_CONSENT      (Boolean)              │
│ PREFERRED_LANGUAGE     (String)               │
│ DATE_JOINED            (Date)                 │
│ LAST_INTERACTION       (Date)                 │
│ ASSIGNED_STAFF         (String)               │
│                                              │
│ (These are synchronized from PostgreSQL)    │
└──────────────────────────────────────────────┘
```

---

## Integration Points

```
┌──────────────────────────────────────────────────────────┐
│ Integration Points with Next.js Application              │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ 1. User Signup/Auth                                     │
│    Event: User creates account                          │
│    Action: Sync to Prospective Clients                  │
│    File: middleware.ts or auth callback                │
│                                                           │
│ 2. Newsletter Signup                                    │
│    Event: User subscribes to newsletter                 │
│    Action: Sync to Newsletter Subscribers               │
│    File: app/api/newsletter/subscribe/route.ts          │
│                                                           │
│ 3. Contact Form Submission                              │
│    Event: User submits contact form                     │
│    Action: Sync to General Enquiries                    │
│    File: app/api/forms/contact/route.ts                │
│                                                           │
│ 4. Consultation Request                                 │
│    Event: User books consultation                       │
│    Action: Sync to Consultation Requests                │
│    File: app/api/forms/consultation/route.ts           │
│                                                           │
│ 5. Project Initiation                                   │
│    Event: New project created                           │
│    Action: Sync to Projects → Design Phase              │
│    File: Server action handling project creation       │
│                                                           │
│ 6. Quote Request                                        │
│    Event: User requests quotation                       │
│    Action: Sync to Quote Requests                       │
│    File: app/api/forms/quote/route.ts                  │
│                                                           │
│ 7. Product Purchase                                     │
│    Event: Order placed                                  │
│    Action: Sync to Orders / Automation list             │
│    File: Payment webhook handler                        │
│                                                           │
│ 8. Email Notifications                                  │
│    Event: Various system events                         │
│    Action: Send transactional emails                    │
│    File: lib/brevo/client.ts                           │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Automation Workflows (To Be Set Up in Brevo)

```
┌─ New User Welcome ───────────────────────────┐
│ Trigger: Contact added to "Newsletter Subscribers"  │
│ Wait: 0 minutes                               │
│ Action: Send "Welcome to Revamp" email       │
│ Follow-up (3 days): Send product guide       │
└─────────────────────────────────────────────┘

┌─ Consultation Request ───────────────────────┐
│ Trigger: Contact added to "Consultation Requests"  │
│ Wait: 0 minutes                               │
│ Action: Send "Consultation Confirmation" email    │
│ Follow-up (1 day): Staff notification         │
│ Follow-up (7 days): Send intro call reminder │
└─────────────────────────────────────────────┘

┌─ Quote Notification ─────────────────────────┐
│ Trigger: Contact added to "Quote Requests"   │
│ Wait: 0 minutes                               │
│ Action: Send quotation template email        │
│ Follow-up (3 days): Follow-up reminder       │
│ Follow-up (7 days): Urgent follow-up         │
└─────────────────────────────────────────────┘

┌─ Payment Confirmation ───────────────────────┐
│ Trigger: Contact added to "Automation" → "Payment Notifications"  │
│ Wait: 0 minutes                               │
│ Action: Send invoice/receipt                 │
│ Follow-up (1 day): Order status update       │
│ Follow-up (30 days): Delivery confirmation   │
└─────────────────────────────────────────────┘
```

---

## File Dependencies

```
lib/brevo/
  ├── config.ts ◄────────────────────────┐
  │                                        │
  ├── client.ts ◄────────────────────────┼─ Uses config
  │   └─ Imports: config.ts               │
  │                                        │
  ├── sync.ts ◄─────────────────────────┼─ Uses config & client
  │   └─ Imports: config.ts, client.ts    │
  │                                        │
  └─ Used by:                              │
      ├── app/api/newsletter/subscribe/   │
      ├── components/newsletter-signup.tsx │
      ├── Server actions                  │
      ├── Middleware                      │
      └── Cron jobs (future)              │

scripts/
  └── brevo-setup.ts
      └─ Imports: config.ts, client.ts
```

---

## Deployment Phases

```
Phase 1: Infrastructure Setup (Week 1)
├─ Configure BREVO_API_KEY
├─ Run setup script
└─ Verify in Brevo dashboard

Phase 2: Newsletter (Week 2)
├─ Add NewsletterSignup component
├─ Test on staging
├─ Deploy to production
└─ Monitor signup rate

Phase 3: Lead Capture (Week 3)
├─ Connect contact forms
├─ Sync form submissions
├─ Test automations
└─ Train team on Brevo

Phase 4: Advanced Features (Week 4+)
├─ Client portal integration
├─ Project lifecycle sync
├─ Supplier management
├─ Event automation
└─ Reporting & analytics
```

---

**This architecture ensures:**
- Clean separation of concerns
- Single source of truth (PostgreSQL)
- Scalable contact syncing
- Automated email workflows
- GDPR compliance (opt-in, unsubscribe)
