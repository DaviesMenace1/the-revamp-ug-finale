import Link from 'next/link'
import { MessageCircle } from '@/components/ui/luxury-icons'
import { siteContact } from '@/lib/site-config'
import { NewsletterSignup } from '@/components/newsletter-signup'

export function SiteFooter() {
  const whatsapp = 'https://wa.me/256703861668'
  return (
    <footer className="border-t border-border bg-white px-6 py-16 lg:px-12 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.2fr_1fr_1fr] md:gap-16">
        <div>
          <p className="font-serif text-4xl leading-none md:text-5xl">Define your space.</p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">Schedule a private viewing, request our current catalog, or begin a conversation about your residence.</p>
          <Link href="/contact" className="mt-8 inline-flex rounded-full bg-obsidian px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-canvas transition-colors hover:bg-gilded hover:text-obsidian">Private Consultation</Link>
          <NewsletterSignup />
        </div>
        <div className="space-y-6 text-sm">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gilded">Studio</p><p className="mt-3 whitespace-pre-line leading-relaxed">Plot 185, Kyanja{`\n`}Kampala, Uganda{`\n`}By appointment</p></div>
          <a href={`mailto:${siteContact.primaryEmail || 'therevampug@gmail.com'}`} className="block hover:text-gilded">{siteContact.primaryEmail || 'therevampug@gmail.com'}</a>
        </div>
        <div className="space-y-6 text-sm">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gilded">Contact</p><a href={siteContact.phoneHref} className="mt-3 block hover:text-gilded">{siteContact.phoneDisplay || '+256 703 861 668'}</a><a href={whatsapp} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 hover:text-gilded"><MessageCircle className="size-4" />Message on WhatsApp</a></div>
          <div className="flex flex-wrap gap-5 text-[10px] uppercase tracking-[0.2em]"><a href="https://www.instagram.com/therevamp_ug" target="_blank" rel="noreferrer" className="hover:text-gilded">Instagram</a><Link href="/about" className="hover:text-gilded">The Studio</Link><Link href="/architecture" className="hover:text-gilded">Architecture</Link><Link href="/journal" className="hover:text-gilded">Archives</Link></div>
        </div>
      </div>
      <div className="mx-auto mt-16 flex max-w-7xl flex-col gap-3 border-t border-border pt-5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} The Revamp UG</span><div className="flex gap-5"><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><Link href="/faqs">FAQs</Link></div></div>
    </footer>
  )
}
