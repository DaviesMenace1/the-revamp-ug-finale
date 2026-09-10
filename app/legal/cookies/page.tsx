import { LegalPage } from '../legal-page'

export const metadata = {
  title: 'Cookie Policy | The Revamp UG',
  description: 'Working cookie policy for The Revamp UG.',
}

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie policy"
      intro="The Revamp UG uses essential browser storage to keep the website and shopping experience working. Optional analytics and marketing tools are controlled through your consent choices."
      sections={[
        { heading: 'Essential storage', body: 'Essential storage may support sign-in, security, shopping-cart state, accessibility preferences, and the operation of the website. These functions cannot always be disabled without affecting the service.' },
        { heading: 'Optional tools', body: 'When enabled by you, optional tools may help us understand site usage or measure marketing. The site currently gates Google Analytics, Google Tag Manager, Meta, TikTok, and PostHog behind consent.' },
        { heading: 'Manage your choices', body: 'Use the cookie preferences control in the footer to review or change optional consent. Your browser may also provide controls for deleting stored data.' },
        { heading: 'Questions', body: 'If you have questions about cookies or consent, contact support@therevampug.com.' },
      ]}
    />
  )
}
