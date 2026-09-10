import type { Metadata } from 'next'
import { LegalPage } from '../legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy | The Revamp UG',
  description: 'How The Revamp UG collects, uses, shares, protects, and retains personal information across its website, design services, shop, and client support.',
  alternates: { canonical: '/legal/privacy' },
}

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      lastUpdated="10 September 2026"
      showReviewNote={false}
      intro="This Privacy Policy explains how The Revamp UG collects, uses, stores, shares, and protects personal information when you visit therevampug.com, create an account, request design services, place an order, contact our support team, or otherwise use our website and client portals. It is written for customers, prospective customers, guests, and visitors worldwide."
      sections={[
        {
          heading: '1. Who we are',
          body: 'The Revamp UG operates the therevampug.com website, online shop, design-service experiences, client portals, support desk, consultations, and related communications. In this policy, “The Revamp UG”, “we”, “us”, and “our” refer to the website operator. For privacy questions, data requests, or account-deletion requests, contact support@therevampug.com and include enough information for us to identify the relevant account or request.',
        },
        {
          heading: '2. Information we collect',
          body: 'We may collect information you provide directly, including your name, email address, telephone number, delivery and billing details, company information, project brief, consultation details, preferences, support-ticket content, messages, uploaded files, order information, and other information you choose to submit. When you create or use an account, we may receive account identifiers, profile information, authentication status, and profile-image information from our authentication provider. We do not ask you to submit payment-card numbers to us through ordinary website forms; payment details are handled by the relevant payment provider. We may also receive technical information such as IP address, browser and device characteristics, approximate location derived from IP address, pages viewed, referral information, security events, and cookie or similar-storage identifiers, subject to your consent where required.',
        },
        {
          heading: '3. Google sign-in and Google user data',
          body: 'If you choose Google sign-in, we use the authentication information made available through the Google sign-in flow, such as your Google account identifier, name, email address, profile image, and authentication status, to create or access your The Revamp UG account, secure the sign-in process, associate your orders and client records with your account, and display your profile. We do not sell Google user data, use it for targeted advertising, or use it for purposes unrelated to the account feature you selected. We do not request access to Gmail, Google Drive, Google Calendar, contacts, or other Google APIs unless a separate feature clearly explains that access and requests any required permission. We do not share Google user data with third parties except service providers that help us provide authentication, hosting, security, or account functionality under appropriate contractual or technical safeguards, or when disclosure is required by law. We retain account-linked Google sign-in data while your account remains active and for a limited period afterward where needed for security, dispute resolution, fraud prevention, legal compliance, or backup recovery; you may request deletion by contacting support@therevampug.com.',
        },
        {
          heading: '4. How we use information',
          body: 'We use personal information to provide and personalise the website; authenticate and secure accounts; process orders, payments, deliveries, returns, and refunds; respond to enquiries and support tickets; deliver consultations, design services, projects, and client communications; manage memberships or trade access where applicable; send service notices and transactional messages; send newsletters or marketing only where permitted and, where required, after consent; prevent fraud, abuse, and security incidents; maintain records; measure and improve our services; and comply with legal obligations.',
        },
        {
          heading: '5. Cookies, analytics, and marketing',
          body: 'Essential cookies and browser storage may be used for authentication, security, shopping-cart state, accessibility preferences, consent choices, and core website operation. Optional analytics and marketing tools are controlled through the site’s cookie-preference mechanism and are activated only where the required consent has been provided. The currently documented optional tools include Google Analytics, Google Tag Manager, Meta, TikTok, and PostHog. You can review or change optional choices through the cookie-preferences control. More detail is available in the Cookie Policy at /legal/cookies.',
        },
        {
          heading: '6. When we share information',
          body: 'We may share the minimum information needed with service providers that host or secure the website and database, provide authentication, process payments, send email or newsletter communications, support customer service, deliver orders, provide professional services, or help us detect abuse and maintain reliability. We may also disclose information to authorities, advisers, insurers, or another party where reasonably necessary to comply with law, protect rights and safety, investigate fraud, enforce our terms, or complete a merger, acquisition, financing, or transfer of business assets. We do not sell personal information or share it with third parties for their independent targeted advertising. Service providers may process information in countries other than the country where you live, subject to applicable safeguards.',
        },
        {
          heading: '7. Payments, orders, and communications',
          body: 'When you place an order or make a payment, the relevant payment provider may collect and process payment credentials, transaction details, and fraud-prevention information under its own privacy terms. We receive confirmation and transaction information needed to fulfil the order, provide support, reconcile payments, and manage refunds. If you subscribe to communications, your email address and the subscription information you provide may be processed by our email or marketing service provider. You can unsubscribe from marketing communications at any time using the link in the message or by contacting us; service and transaction messages may still be sent where necessary.',
        },
        {
          heading: '8. Security and retention',
          body: 'We use reasonable administrative, technical, and organisational measures to protect personal information, including access controls, authenticated account flows, secure transport where supported, least-privilege operational access, and monitoring for abuse and failures. No online service can guarantee absolute security. We retain information for as long as reasonably necessary for the purpose collected, including while an account, order, project, support request, consent record, or legal obligation remains active. We then delete, anonymise, or securely isolate it unless a longer period is required for legal, accounting, fraud-prevention, dispute-resolution, or backup purposes.',
        },
        {
          heading: '9. Your choices and rights',
          body: 'Depending on where you live, you may have rights to request access to, correction of, deletion of, or a copy of your personal information; to object to or restrict certain processing; to withdraw consent for optional analytics or marketing; and to complain to a relevant data-protection authority. You may update some account information from your profile settings, unsubscribe from marketing messages, and change optional cookie preferences. To make a privacy or account-deletion request, email support@therevampug.com. We may need to verify your identity before completing a request and will respond within the period required by applicable law.',
        },
        {
          heading: '10. Children and third-party services',
          body: 'Our website and services are not directed to children who are below the minimum age required to use the relevant service. We do not knowingly collect personal information from children without appropriate authorisation. Our website may link to payment providers, social platforms, delivery services, authentication providers, or other third-party websites. Their privacy practices are governed by their own policies, and you should review them before submitting information.',
        },
        {
          heading: '11. Changes to this policy',
          body: 'We may update this Privacy Policy when our services, technology, legal obligations, or data practices change. The “Last updated” date at the top of this page identifies the current version. If a change is material, we may provide additional notice through the website, an account message, or another appropriate channel.',
        },
      ]}
    />
  )
}
