# Brevo Deployment Checklist

## Pre-Deployment

- [ ] Create Brevo account at https://app.brevo.com
- [ ] Generate API key from Settings → API & Webhooks → REST API
- [ ] Copy API key (format: `xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

## Environment Configuration

### Local Development

```bash
# Add to .env.local
BREVO_API_KEY=your_api_key_here
```

### Vercel Production

1. Go to Vercel Project Settings
2. Navigate to Environment Variables
3. Add:
   - Name: `BREVO_API_KEY`
   - Value: Your Brevo API key
   - Environments: Production
4. Redeploy project

## Setup Execution

### Option 1: Run Locally (Recommended)

```bash
# From project root
pnpm tsx scripts/brevo-setup.ts
```

Watch for output:
```
✓ Connected to Brevo API
✓ Creating folders...
  ✓ Website Leads folder
  ✓ Clients folder
  ✓ Trade Programme folder
  ... (more folders)
✓ Creating contact lists...
  ✓ General Enquiries
  ✓ Newsletter Subscribers
  ... (more lists)
✓ Creating contact attributes...
✓ Setup complete!
```

### Option 2: Run in Vercel (Post-Deployment)

After deploying to Vercel:

```bash
# SSH into Vercel or use local environment
vercel env pull
pnpm tsx scripts/brevo-setup.ts
```

## Post-Setup Verification

- [ ] Log in to Brevo dashboard
- [ ] Navigate to **Contacts** → **Lists**
- [ ] Verify all 12 folders exist
- [ ] Verify 50+ contact lists are created
- [ ] Check **Settings** → **Attributes** for custom fields

## Frontend Integration

### 1. Add Newsletter Signup Component

In your footer or homepage:

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

- [ ] Component added to layout
- [ ] Styling verified (mobile/desktop)
- [ ] Form submission tested locally

### 2. Test Newsletter Endpoint

```bash
# Test subscription
curl -X POST http://localhost:3000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Subscription confirmed. Check your email."
}
```

- [ ] Endpoint responds successfully
- [ ] Email appears in Brevo "Newsletter Subscribers" list
- [ ] Duplicate email returns error message

## Email Template Setup

### 1. Brevo Email Template Categories

Create template folders in Brevo (Settings → Email templates → Add folder):

- [ ] Welcome Emails
- [ ] Newsletter
- [ ] Consultation
- [ ] Quotations
- [ ] Projects
- [ ] Procurement
- [ ] Orders
- [ ] Payments
- [ ] Installations
- [ ] Journal
- [ ] Trade Programme
- [ ] Membership
- [ ] Supplier Portal
- [ ] AI Concierge
- [ ] Marketing
- [ ] Internal Notifications

### 2. Create Welcome Email

1. Go to Brevo Dashboard
2. Click **Campaigns** → **Email**
3. Click **Create** → **Template**
4. Name: "Welcome - New Subscriber"
5. Add HTML content
6. Save as template

- [ ] Welcome email template created
- [ ] Preview tested
- [ ] Sender name/email configured

### 3. Set Up Automation

1. Go to **Campaigns** → **Marketing Automation**
2. Create new automation workflow:
   - Trigger: "Contact added to Newsletter Subscribers list"
   - Action: "Send Welcome email"

- [ ] Automation workflow created
- [ ] Test contact receives welcome email
- [ ] Trigger delay configured (if needed)

## Data Sync Testing

### 1. Test Single Contact Sync

```typescript
import { syncContactToBrevo } from '@/lib/brevo/sync'

// In a server action or API route
await syncContactToBrevo({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  country: 'United States',
  city: 'New York',
  company: 'Acme Inc',
  clientType: 'Residential',
  leadSource: 'Website Form',
  lists: ['General Enquiries', 'Newsletter Subscribers']
})
```

- [ ] Contact appears in Brevo dashboard
- [ ] Contact attributes populated
- [ ] Contact added to correct lists

### 2. Test Batch Sync

```typescript
import { syncMultipleContacts } from '@/lib/brevo/sync'

const contacts = [
  { email: 'user1@example.com', firstName: 'User', lastName: 'One', lists: ['Newsletter Subscribers'] },
  { email: 'user2@example.com', firstName: 'User', lastName: 'Two', lists: ['Newsletter Subscribers'] },
]

await syncMultipleContacts(contacts)
```

- [ ] Multiple contacts synced
- [ ] Batch processing completed without errors
- [ ] All contacts appear in Brevo

## Database Integration

### 1. Contact Sync Triggers

When database events occur, sync to Brevo:

```typescript
// On user signup
async function handleUserSignup(user) {
  // 1. Save to database
  await db.users.create(user)
  
  // 2. Sync to Brevo
  await syncContactToBrevo({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    lists: ['Website Leads', 'Newsletter Subscribers']
  })
}
```

- [ ] Signup flow triggers contact sync
- [ ] New users appear in Brevo
- [ ] List assignments correct

### 2. Form Submission Sync

For contact forms (consultations, quotes, etc.):

```typescript
// app/api/forms/consultation/route.ts
async function handleConsultationRequest(data) {
  // 1. Save to database
  const consultation = await db.consultations.create(data)
  
  // 2. Sync to Brevo with correct list
  await syncContactToBrevo({
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    lists: ['Consultation Requests']
  })
}
```

- [ ] Form submission syncs to Brevo
- [ ] Submissions appear in correct list
- [ ] Staff notifications trigger

## Production Monitoring

### 1. Error Tracking

- [ ] Sentry integration capturing Brevo errors
- [ ] Failed syncs logged and alerted
- [ ] API quota monitoring set up

### 2. Performance Monitoring

- [ ] Newsletter subscribe endpoint latency monitored
- [ ] Batch sync performance tracked
- [ ] API rate limit monitoring active

### 3. Contact Quality

- [ ] Monitor bounce rate
- [ ] Track unsubscribe rate
- [ ] Verify list growth over time

## Troubleshooting

### Setup Script Fails

```bash
# Check API key format
echo $BREVO_API_KEY

# Verify connectivity
curl -H "api-key: $BREVO_API_KEY" \
  https://api.brevo.com/v3/account
```

If 401: Invalid API key
If 403: Account not active

### Newsletter Signup Returns Error

Check browser console:
- [ ] Network tab shows POST to `/api/newsletter/subscribe`
- [ ] Response status 200 (success) or 400 (error)
- [ ] Error message displayed to user

### Contacts Not Appearing in Brevo

- [ ] API key correct in environment
- [ ] Contact lists exist (verify in Brevo dashboard)
- [ ] Email format valid
- [ ] Check Brevo API logs for errors

## Final Verification

- [ ] Newsletter signup form works on production
- [ ] Test email subscribed successfully
- [ ] Confirmation email received
- [ ] Contact appears in Brevo dashboard
- [ ] All 12 folders visible in Brevo
- [ ] Contact attributes populated correctly
- [ ] Welcome automation triggered
- [ ] No errors in Sentry dashboard
- [ ] API response times acceptable

## Rollout Strategy

### Phase 1: Newsletter (MVP)
- [ ] Newsletter signup on homepage
- [ ] Newsletter list created
- [ ] Welcome automation active

### Phase 2: Lead Capture
- [ ] Contact form syncs to "General Enquiries"
- [ ] Consultation form syncs to "Consultation Requests"
- [ ] Form submissions appear in Brevo

### Phase 3: Client Management
- [ ] User signup syncs to "Prospective Clients"
- [ ] Project creation syncs to "Projects" folder
- [ ] Purchase syncs to "Orders" list

### Phase 4: Advanced Automation
- [ ] Trade programme automation
- [ ] Membership programme automation
- [ ] Supplier communication
- [ ] Event management

## Support & Resources

- **Brevo Docs**: https://developers.brevo.com/reference
- **API Status**: https://status.brevo.com
- **Contact Support**: support@brevo.com
- **Rate Limits**: 300 requests/minute

---

**Setup Date:** _______________
**Deployed By:** _______________
**Production Ready:** _______________
