import { getSetting } from '@/lib/actions/settings'
import SettingsClient from './settings-client'

export const dynamic = 'force-dynamic'

const BUSINESS_DEFAULTS = {
  name: 'The Revamp Ug',
  email: 'support@revampug.com',
  phone: '+256 (0) 703 861 668',
  address: 'Plot 12, Kyanja, Kampala, Uganda',
  description: 'We are a premier interior design and architecture studio based in Kampala, Uganda.',
}

const EMAIL_DEFAULTS = {
  orderConfirmation: true,
  projectUpdates: true,
  newMessageNotifications: true,
  weeklySummary: false,
}

const PAYMENT_DEFAULTS = {
  currency: 'UGX',
  taxRate: '18',
  bankTransfer: true,
  cardPayments: true,
  mobileMoney: true,
}

const DOCUMENT_PROFILE_DEFAULTS = {
  name: 'The Revamp Ug',
  address: 'Kyanja, Kampala, Uganda',
  phone: '+256 783 476 807',
  primaryEmail: 'info@therevampug.com',
  supportEmail: 'support@therevampug.com',
  salesEmail: 'sales@therevampug.com',
  taxLabel: 'Tax details to be confirmed',
  taxId: '',
  bankName: 'Bank transfer',
  bankAccount: 'Account no. 051 208 1946',
  mtnMobileMoney: '0783 476807',
  airtelMoney: '0703 861668',
  footer: 'Thank you for choosing The Revamp Ug.',
}

export default async function AdminSettingsPage() {
  const business = await getSetting('business', BUSINESS_DEFAULTS)
  const email = await getSetting('email', EMAIL_DEFAULTS)
  const payment = await getSetting('payment', PAYMENT_DEFAULTS)
  const documentProfile = await getSetting('document_profile', DOCUMENT_PROFILE_DEFAULTS)

  return (
    <SettingsClient
      initialBusiness={business}
      initialEmail={email}
      initialPayment={payment}
      initialDocumentProfile={documentProfile}
    />
  )
}
