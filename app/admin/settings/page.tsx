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
  mobileMoney: false,
}

export default async function AdminSettingsPage() {
  const [business, email, payment] = await Promise.all([
    getSetting('business', BUSINESS_DEFAULTS),
    getSetting('email', EMAIL_DEFAULTS),
    getSetting('payment', PAYMENT_DEFAULTS),
  ])

  return (
    <SettingsClient
      initialBusiness={business}
      initialEmail={email}
      initialPayment={payment}
    />
  )
}
