'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Save, Check } from 'lucide-react'
import { saveSetting } from '@/lib/actions/settings'
import ConsultationCommerceClient, { type ConsultationPricing, type ConsultationPromotion } from './consultation-commerce-client'

type Business = { name: string; email: string; phone: string; address: string; description: string }
type EmailPrefs = {
  orderConfirmation: boolean
  projectUpdates: boolean
  newMessageNotifications: boolean
  weeklySummary: boolean
}
type Payment = {
  currency: string
  taxRate: string
  bankTransfer: boolean
  cardPayments: boolean
  mobileMoney: boolean
}
type DocumentProfile = {
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

export default function SettingsClient({
  initialBusiness,
  initialEmail,
  initialPayment,
  initialDocumentProfile,
  initialConsultationPricing,
  initialPromotions,
}: {
  initialBusiness: Business
  initialEmail: EmailPrefs
  initialPayment: Payment
  initialDocumentProfile: DocumentProfile
  initialConsultationPricing: ConsultationPricing
  initialPromotions: ConsultationPromotion[]
}) {
  const [business, setBusiness] = useState(initialBusiness)
  const [email, setEmail] = useState(initialEmail)
  const [payment, setPayment] = useState(initialPayment)
  const [documentProfile, setDocumentProfile] = useState(initialDocumentProfile)
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave(key: string, value: Record<string, unknown>) {
    startTransition(async () => {
      const res = await saveSetting(key, value)
      if (res.success) {
        setSavedKey(key)
        setTimeout(() => setSavedKey(null), 2000)
      }
    })
  }

  return (
    <div className="space-y-8 p-8 max-w-4xl">
      <div>
        <h1 className="font-serif text-4xl font-light text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Configure system settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Update your business details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Business Name</label>
              <Input
                value={business.name}
                onChange={(e) => setBusiness((b) => ({ ...b, name: e.target.value }))}
                className="rounded-none border-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Business Email</label>
              <Input
                value={business.email}
                onChange={(e) => setBusiness((b) => ({ ...b, email: e.target.value }))}
                className="rounded-none border-muted"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
              <Input
                value={business.phone}
                onChange={(e) => setBusiness((b) => ({ ...b, phone: e.target.value }))}
                className="rounded-none border-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Address</label>
              <Input
                value={business.address}
                onChange={(e) => setBusiness((b) => ({ ...b, address: e.target.value }))}
                className="rounded-none border-muted"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Business Description</label>
            <Textarea
              value={business.description}
              onChange={(e) => setBusiness((b) => ({ ...b, description: e.target.value }))}
              rows={4}
              className="rounded-none border-muted resize-none"
            />
          </div>
          <Button
            disabled={isPending}
            onClick={() => handleSave('business', business)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
          >
            {savedKey === 'business' ? <Check className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {savedKey === 'business' ? 'Saved' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
          <CardDescription>Configure email notifications and templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={email.orderConfirmation}
                onChange={(e) => setEmail((v) => ({ ...v, orderConfirmation: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm text-foreground">Send order confirmation emails</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={email.projectUpdates}
                onChange={(e) => setEmail((v) => ({ ...v, projectUpdates: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm text-foreground">Send project update emails to clients</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={email.newMessageNotifications}
                onChange={(e) => setEmail((v) => ({ ...v, newMessageNotifications: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm text-foreground">Send new message notifications</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={email.weeklySummary}
                onChange={(e) => setEmail((v) => ({ ...v, weeklySummary: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm text-foreground">Send weekly summary reports</span>
            </label>
          </div>
          <Button
            disabled={isPending}
            onClick={() => handleSave('email', email)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
          >
            {savedKey === 'email' ? <Check className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {savedKey === 'email' ? 'Saved' : 'Save Email Settings'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>Configure payment methods and options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
              <select
                value={payment.currency}
                onChange={(e) => setPayment((p) => ({ ...p, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-muted rounded-none text-foreground bg-background"
              >
                <option value="UGX">UGX (Uganda Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tax Rate (%)</label>
              <Input
                value={payment.taxRate}
                onChange={(e) => setPayment((p) => ({ ...p, taxRate: e.target.value }))}
                className="rounded-none border-muted"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={payment.bankTransfer}
                onChange={(e) => setPayment((p) => ({ ...p, bankTransfer: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm text-foreground">Enable bank transfer payments</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={payment.cardPayments}
                onChange={(e) => setPayment((p) => ({ ...p, cardPayments: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm text-foreground">Enable card payments</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={payment.mobileMoney}
                onChange={(e) => setPayment((p) => ({ ...p, mobileMoney: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm text-foreground">Enable mobile money payments</span>
            </label>
          </div>
          <Button
            disabled={isPending}
            onClick={() => handleSave('payment', payment)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
          >
            {savedKey === 'payment' ? <Check className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {savedKey === 'payment' ? 'Saved' : 'Save Payment Settings'}
          </Button>
        </CardContent>
      </Card>

      <ConsultationCommerceClient initialPricing={initialConsultationPricing} initialPromotions={initialPromotions} />

      <Card>
        <CardHeader>
          <CardTitle>Generated Document Profile</CardTitle>
          <CardDescription>These details appear on newly generated PDFs and remain editable.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {([
              ['name', 'Business name'],
              ['address', 'Address'],
              ['phone', 'Phone'],
              ['primaryEmail', 'Primary email'],
              ['supportEmail', 'Support email'],
              ['salesEmail', 'Sales email'],
              ['taxLabel', 'Tax label'],
              ['taxId', 'Tax / registration number'],
              ['bankName', 'Bank/payment method label'],
              ['bankAccount', 'Bank account details'],
              ['mtnMobileMoney', 'MTN Mobile Money'],
              ['airtelMoney', 'Airtel Money'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor={`document-${key}`}>{label}</label>
                <Input id={`document-${key}`} value={documentProfile[key]} onChange={(event) => setDocumentProfile((profile) => ({ ...profile, [key]: event.target.value }))} className="rounded-none border-muted" />
              </div>
            ))}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="document-footer">Document footer</label>
            <Input id="document-footer" value={documentProfile.footer} onChange={(event) => setDocumentProfile((profile) => ({ ...profile, footer: event.target.value }))} className="rounded-none border-muted" />
          </div>
          <Button disabled={isPending} onClick={() => handleSave('document_profile', documentProfile)} className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90">
            {savedKey === 'document_profile' ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            {savedKey === 'document_profile' ? 'Saved' : 'Save Document Profile'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
