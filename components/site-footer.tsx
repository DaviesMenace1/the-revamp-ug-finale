import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

const footerLinks = {
  Services: [
    { label: 'Interior Design', href: '/services/interior-design' },
    { label: 'Architecture', href: '/architecture' },
    { label: 'Global Sourcing', href: '/services/sourcing' },
    { label: 'Installation', href: '/services/installation' },
  ],
  Collections: [
    { label: 'Living Spaces', href: '/collections/living' },
    { label: 'Bedroom', href: '/collections/bedroom' },
    { label: 'Dining', href: '/collections/dining' },
    { label: 'Lighting', href: '/collections/lighting' },
  ],
  Studio: [
    { label: 'About Us', href: '/about' },
    { label: 'Our Work', href: '/portfolio' },
    { label: 'Journal', href: '/journal' },
    { label: 'Contact', href: '/contact' },
  ],
  Client: [
    { label: 'Book Consultation', href: '/contact' },
    { label: 'Client Portal', href: '/client' },
    { label: 'Track Project', href: '/portal/projects' },
    { label: 'Support', href: '/support' },
  ],
}

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background">
      {/* Main footer */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-20">
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
              {['Instagram', 'Tiktok', 'Snapchat', 'LinkedIn'].map((platform) => (
                <a
                  key={platform}
                  href={`#${platform.toLowerCase()}`}
                  className="font-sans text-[10px] tracking-widest uppercase text-background/30 hover:text-gold transition-colors"
                  aria-label={platform}
                >
                  {platform}
                </a>
              ))}
            </div>

            {/* Contact */}
            <div className="mt-8 space-y-2">
              <a
                href="tel:+256745867098"
                className="block font-sans text-sm text-background/60 hover:text-gold transition-colors"
              >
                +256 703 861 668
              </a>
              <a
                href="mailto:hello@therevampug.com"
                className="block font-sans text-sm text-background/60 hover:text-gold transition-colors"
              >
                hello@therevampug.com
              </a>
              <p className="font-sans text-sm text-background/40 mt-2">
                Kyanja | Kampala, Uganda
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
                  <li key={link.href}>
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
        </div>
      </div>
    </footer>
  )
}
