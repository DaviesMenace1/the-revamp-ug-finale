import 'server-only'

import { getSetting } from '@/lib/actions/settings'

export type CompanyProfile = {
  name: string
  address: string
  phone: string
  primaryEmail: string
  supportEmail: string
  salesEmail: string
  taxLabel: string
  taxId: string
  bankName: string
  bankAccount: string
  mtnMobileMoney: string
  airtelMoney: string
  footer: string
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
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

export async function getCompanyProfile(): Promise<CompanyProfile> {
  return getSetting('document_profile', DEFAULT_COMPANY_PROFILE)
}
