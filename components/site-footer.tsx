'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { ChevronDown, ChevronUpIcon, FaInstagram, Mail, MapPin, Phone } from '@/components/ui/luxury-icons'
import { siteContact } from '@/lib/site-config'
import { NewsletterSignup } from '@/components/newsletter-signup'

const footerGroups = [
  {
    title: 'Explore',
    links: [
      ['Home', '/'],
      ['Collections', '/collections'],
      ['Projects', '/projects'],
      ['Journal', '/journal'],
      ['Shop', '/collections'],
      ['About', '/about'],
      ['Contact', '/contact'],
    ],
  },
  {
    title: 'Services',
    links: [
      ['Interior design', '/services'],
      ['Architecture', '/architecture'],
      ['Global sourcing', '/services'],
      ['Custom millwork', '/services'],
      ['Turnkey solutions', '/services'],
      ['Consultations', '/book-consultation'],
      ['Trade program', '/trade-program'],
    ],
  },
  {
    title: 'Support',
    links: [
      ['FAQs', '/faqs'],
      ['Shipping & delivery', '/refund-policy'],
      ['Returns & exchanges', '/refund-policy'],
      ['Care & maintenance', '/contact?interest=general'],
      ['Track order', '/client/orders'],
      ['Client portal', '/client'],
      ['Get in touch', '/contact'],
    ],
  },
]

function FooterGroup({ group, mobile = false, expanded, onToggle }: { group: typeof footerGroups[number]; mobile?: boolean; expanded: boolean; onToggle: () => void }) {
  if (mobile) {
    return <div className="border-b border-border/80"><button type="button" onClick={onToggle} aria-expanded={expanded} className="flex min-h-16 w-full items-center justify-between text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground"><span>{group.title}</span>{expanded ? <ChevronUpIcon className="size-4" /> : <ChevronDown className="size-4" />}</button>{expanded && <nav className="grid gap-4 pb-6" aria-label={`${group.title} links`}>{group.links.map(([label, href]) => <Link key={label} href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{label}</Link>)}</nav>}</div>
  }

  return <div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">{group.title}</p><nav className="mt-6 grid gap-4" aria-label={`${group.title} links`}>{group.links.map(([label, href]) => <Link key={label} href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{label}</Link>)}</nav></div>
}

export function SiteFooter() {
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const whatsapp = 'https://wa.me/256783476807'
  const email = siteContact.primaryEmail || 'info@therevampug.com'
  const phone = siteContact.phoneDisplay || '+256 783 476 807'

  return <footer className="border-t border-border bg-canvas text-foreground">
    <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_1.7fr_1.2fr] lg:gap-16">
        <div><Link href="/" className="inline-flex items-start" aria-label="The Revamp UG home"><Image src="/brand/revamp-mark.png" alt="The Revamp UG" width={120} height={120} className="size-20 object-contain object-left sm:size-24" /></Link><p className="mt-8 max-w-xs font-serif text-4xl font-light leading-[0.98] sm:text-5xl">The architecture of refined living.</p><p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">Interiors. Architecture. Global sourcing.<br />A more considered way to live.</p></div>
        <div className="hidden gap-10 sm:grid sm:grid-cols-3"><FooterGroup group={footerGroups[0]} expanded={false} onToggle={() => undefined} /><FooterGroup group={footerGroups[1]} expanded={false} onToggle={() => undefined} /><FooterGroup group={footerGroups[2]} expanded={false} onToggle={() => undefined} /></div>
        <div><NewsletterSignup variant="footer" consentRequired title="Curated stories, new arrivals and inspiration, to your inbox." subtitle="" buttonText="Join" /></div>
      </div>

      <div className="mt-12 grid border-y border-border/80 sm:hidden">{footerGroups.map((group) => <FooterGroup key={group.title} group={group} mobile expanded={openGroup === group.title} onToggle={() => setOpenGroup((current) => current === group.title ? null : group.title)} />)}</div>

      <div className="mt-12 grid grid-cols-2 gap-6 border-y border-border/80 py-8 sm:grid-cols-3 sm:gap-8 lg:grid-cols-[1fr_1fr_1.2fr_1fr_auto] lg:items-center"><div className="flex items-start gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-sm">{siteContact.location || 'Kyanja, Kampala, Uganda'}</p><p className="mt-1 text-xs text-muted-foreground">By appointment only</p></div></div><div className="flex items-start gap-3"><Phone className="mt-0.5 size-5 shrink-0 text-primary" /><div><a href={siteContact.phoneHref} className="text-sm hover:text-primary">{phone}</a><p className="mt-1 text-xs text-muted-foreground">Mon to Sat, 9:00 to 18:00</p></div></div><div className="flex items-start gap-3"><Mail className="mt-0.5 size-5 shrink-0 text-primary" /><div><a href={`mailto:${email}`} className="break-all text-sm hover:text-primary">{email}</a><p className="mt-1 text-xs text-muted-foreground">We reply within 24 hours</p></div></div><div className="col-span-2 flex items-center gap-5 border-t border-border/80 pt-6 sm:col-span-1 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0"><span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Follow our journey</span><a href="https://www.instagram.com/therevamp_ug" target="_blank" rel="noreferrer" aria-label="Follow The Revamp UG on Instagram" className="transition-colors hover:text-primary"><FaInstagram className="size-6" /></a></div><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hidden size-12 items-center justify-center rounded-full border border-border text-xs transition-colors hover:border-foreground hover:bg-foreground hover:text-background lg:inline-flex" aria-label="Back to top"><ChevronUpIcon className="size-5" /></button></div>

      <div className="flex flex-col gap-6 border-b border-border/80 py-7 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">© {new Date().getFullYear()} The Revamp UG. All rights reserved.</p><div className="flex flex-wrap gap-x-6 gap-y-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground"><Link href="/legal/privacy" className="hover:text-foreground">Privacy policy</Link><Link href="/legal/terms" className="hover:text-foreground">Terms & conditions</Link><Link href="/sitemap.xml" className="hover:text-foreground">Sitemap</Link></div></div>
      <div className="pt-8"><span className="block h-px w-12 bg-foreground" /><p className="mt-5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">The architecture of refined living.</p></div>
    </div>
  </footer>
}
