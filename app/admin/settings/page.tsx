import { getSetting } from '@/lib/actions/settings'
import { listConsultationPromotions } from '@/lib/actions/consultation-commerce'
import { listCollectionPromotions } from '@/lib/actions/collection-commerce'
import { type ConsultationPricing, type ConsultationPromotion } from './consultation-commerce-client'
import { type CollectionPromotion } from './collection-commerce-client'
import SettingsClient from './settings-client'
import { DEFAULT_SUBSCRIPTION_PRICING, getSubscriptionPricing } from '@/lib/subscriptions'
import { listPickupStations } from '@/lib/actions/pickup-stations'

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

const CONSULTATION_PRICING_DEFAULTS: ConsultationPricing = {
  baseFee: '200000',
  currency: 'UGX',
  taxRate: '0',
  taxInclusive: true,
  holdMinutes: 15,
  terms: 'Consultation bookings are confirmed after successful payment. Please contact the studio if you need to change your appointment.',
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
  const consultationPricing = await getSetting('consultation_pricing', CONSULTATION_PRICING_DEFAULTS)
  const promotions = await listConsultationPromotions()
  const collectionPromotions = await listCollectionPromotions()
  const documentProfile = await getSetting('document_profile', DOCUMENT_PROFILE_DEFAULTS)
  const subscriptionPricing = await getSubscriptionPricing()
  const pickupStations = await listPickupStations(true)

  return (
    <SettingsClient
      initialBusiness={business}
      initialEmail={email}
      initialPayment={payment}
      initialDocumentProfile={documentProfile}
      initialConsultationPricing={consultationPricing}
      initialPromotions={promotions as ConsultationPromotion[]}
      initialCollectionPromotions={collectionPromotions as CollectionPromotion[]}
      initialSubscriptionPricing={subscriptionPricing || DEFAULT_SUBSCRIPTION_PRICING}
      initialPickupStations={pickupStations}
    />
  )
}
