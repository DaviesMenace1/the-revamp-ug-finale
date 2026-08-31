import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { NewsletterSignup } from '@/components/newsletter-signup'
import type { IconType } from '@/components/ui/luxury-icons'
import { FaInstagram, FaSnapchatGhost, FaLinkedinIn } from '@/components/ui/luxury-icons'
import { SiTiktok } from '@/components/ui/luxury-icons'
import { CookiePreferencesTrigger } from '@/components/privacy/cookie-consent-provider'
import { siteContact } from '@/lib/site-config'

const footerLinks = {
  Services: [
    { label: 'Interior Design', href: '/services' },
    { label: 'Architecture', href: '/services/architecture' },
    { label: 'Source With Revamp', href: '/source-with-revamp' },
    { label: 'Custom Services', href: '/custom-services' },
  ],
  Collections: [
    { label: 'Living Spaces', href: '/collections' },
    { label: 'Bedroom', href: '/collections' },
    { label: 'Dining', href: '/collections' },
    { label: 'Lighting', href: '/collections' },
  ],
  Studio: [
    { label: 'About Us', href: '/about' },
    { label: 'Our Work', href: '/portfolio' },
    { label: 'Journal', href: '/journal' },
    { label: 'Contact', href: '/contact' },
    { label: 'Trade Program', href: '/trade-program' },
    { label: 'Membership', href: '/membership-program' },
  ],
  Client: [
    { label: 'Book Consultation', href: siteContact.bookingPath },
    { label: 'Request a Quote', href: '/request-quote' },
    { label: 'Product Inquiry', href: '/product-inquiry' },
    { label: 'Client Portal', href: '/client' },
    { label: 'Track Project', href: '/client/projects' },
    { label: 'Support', href: '/client/tickets' },
  ],
}

const socialLinks: { name: string; href: string; Icon: IconType }[] = [
  { name: 'Instagram', href: 'https://www.instagram.com/therevamp_ug', Icon: FaInstagram },
  { name: 'TikTok', href: 'https://www.tiktok.com/@revamp_ree', Icon: SiTiktok },
  { name: 'Snapchat', href: 'https://www.snapchat.com/add/therevamp_ug', Icon: FaSnapchatGhost },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/therevampug', Icon: FaLinkedinIn },
]

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background">
      {/* Main footer */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-20">
        <NewsletterSignup />
        <Separator className="my-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="font-serif text-2xl tracking-widest uppercase text-background">
              The Revamp<span className="text-gold ml-1">UG</span>
            </Link>
            <p className="font-sans text-background/50 text-sm leading-relaxed mt-4 max-w-xs">
              Bespoke interior design, architecture, and global sourcing | transforming spaces across East Africa and beyond.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-4 mt-6">
              {socialLinks.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="text-background/30 hover:text-gold transition-colors p-1"
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span className="sr-only">{name}</span>
                </a>
              ))}
            </div>

            {/* Contact */}
            <div className="mt-8 space-y-2">
              <a
                href={siteContact.phoneHref}
                className="block font-sans text-sm text-background/60 hover:text-gold transition-colors"
              >
                {siteContact.phoneDisplay}
              </a>
              <a
                href="mailto:support@therevampug.com"
                className="block font-sans text-sm text-background/60 hover:text-gold transition-colors"
              >
                {siteContact.supportEmail}
              </a>
              <p className="font-sans text-sm text-background/40 mt-2">
                {siteContact.location}
              </p>
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="font-sans text-[10px] tracking-[0.25em] uppercase text-gold mb-5">
                {group}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={`${group}-${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="font-sans text-sm text-background/50 hover:text-background transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-background/10" />

      {/* Bottom bar */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-sans text-xs text-background/30">
          &copy; {new Date().getFullYear()} The Revamp Ug. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          {[
            { label: 'FAQs', href: '/faqs'},
            { label: 'Privacy Policy', href: '/legal/privacy' },
            { label: 'Terms of Service', href: '/legal/terms' },
            { label: 'Cookie Policy', href: '/legal/cookies' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-sans text-xs text-background/30 hover:text-background/60 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <CookiePreferencesTrigger className="font-sans text-xs text-background/30 hover:text-background/60 transition-colors" />
        </div>
      </div>
    </footer>
  )
}

