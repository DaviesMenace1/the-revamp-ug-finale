import { LegalPage } from '../legal-page'

export const metadata = {
  title: 'Privacy Policy | The Revamp UG',
  description: 'Working privacy policy for The Revamp UG.',
}

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      intro="This working policy explains, at a high level, how The Revamp UG uses information needed to provide design services, product orders, client support, and a reliable website experience."
      sections={[
        { heading: 'Information you provide', body: 'We may receive your name, contact details, project information, delivery details, account profile, consultation requests, order information, and messages when you use our services or contact our team.' },
        { heading: 'How we use information', body: 'Information is used to respond to requests, deliver services and orders, manage client projects, provide support, prevent misuse, maintain security, and improve the website where you have given the relevant consent.' },
        { heading: 'Optional analytics and marketing', body: 'Optional analytics, advertising, and marketing technologies are loaded only after your consent through the site’s cookie preferences. You can revisit those choices at any time from the cookie preferences control.' },
        { heading: 'Your questions', body: 'For privacy questions or requests, contact support@therevampug.com. We will verify the request and respond through an appropriate channel.' },
      ]}
    />
  )
}
