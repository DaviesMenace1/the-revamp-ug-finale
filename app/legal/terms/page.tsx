import { LegalPage } from '../legal-page'

export const metadata = {
  title: 'Terms of Service | The Revamp UG',
  description: 'Working terms of service for The Revamp UG.',
}

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of service"
      intro="These working terms describe the relationship between The Revamp UG and visitors, clients, and customers using our design services, online store, and client portal."
      sections={[
        { heading: 'Using the site', body: 'You agree to use this website lawfully and to provide accurate information when requesting a consultation, creating an account, placing an order, or communicating with our team.' },
        { heading: 'Services and orders', body: 'Service scopes, availability, pricing, lead times, delivery, installation, and project milestones are confirmed with you before work begins. Product availability and estimates may change until an order or written scope is accepted.' },
        { heading: 'Client accounts', body: 'Keep your account details and sign-in credentials secure. The client portal is intended for the named client and authorized project participants; do not share private project documents or account access.' },
        { heading: 'Contact', body: 'Questions about these working terms, an order, or a project can be sent to support@therevampug.com or raised through the contact page.' },
      ]}
    />
  )
}
