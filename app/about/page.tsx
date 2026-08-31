import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from '@/components/ui/luxury-icons'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { getSetting } from '@/lib/actions/settings'
import { DEFAULT_ABOUT, type AboutContent } from '@/lib/about-content'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const about = await getSetting<AboutContent>('aboutPage', DEFAULT_ABOUT)
  const capabilities = Array.isArray(about.capabilities) ? about.capabilities : []
  const references = Array.isArray(about.references) ? about.references : []
  const employees = Array.isArray(about.employees) ? about.employees : []
  const storyParagraphs = about.story.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)

  return <>
    <SiteHeader />
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border/20 bg-obsidian text-ivory">
        <div className="relative min-h-[36rem] sm:min-h-[42rem]"><Image src={about.heroImage} alt="The Revamp UG studio" fill priority className="object-cover opacity-65" sizes="100vw" /><div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/45 to-obsidian/10" /><div className="absolute inset-x-0 bottom-0 px-5 pb-12 sm:px-8 sm:pb-16 lg:px-16 lg:pb-20"><div className="mx-auto max-w-[1440px]"><p className="text-[10px] uppercase tracking-[0.28em] text-gold">The Revamp UG · Design house</p><h1 className="mt-5 max-w-4xl font-serif text-5xl font-light leading-[0.92] sm:text-7xl lg:text-[7rem]">{about.heroTitle}</h1><p className="mt-6 max-w-2xl text-base leading-7 text-ivory/75 sm:text-lg">{about.heroIntro}</p></div></div></div>
      </section>

      <section className="border-b border-border/20 px-5 py-16 sm:px-8 md:py-24 lg:px-16"><div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24"><div><p className="text-[10px] uppercase tracking-[0.25em] text-primary">The story</p><h2 className="mt-4 max-w-md font-serif text-4xl font-light leading-[0.96] sm:text-6xl">{about.storyTitle}</h2></div><div className="grid gap-8 sm:grid-cols-[1.2fr_0.8fr] sm:items-start"><div className="space-y-5 text-base leading-8 text-muted-foreground sm:text-lg">{storyParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div><div className="relative aspect-[4/5] overflow-hidden bg-muted"><Image src={about.storyImage} alt="The Revamp UG interior work" fill className="object-cover" sizes="(max-width: 640px) 100vw, 30vw" /></div></div></div></section>

      <section className="border-b border-border/20 bg-muted/10 px-5 py-16 sm:px-8 md:py-24 lg:px-16"><div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[1fr_1fr]"><div><p className="text-[10px] uppercase tracking-[0.25em] text-primary">Founder’s note</p><h2 className="mt-4 max-w-lg font-serif text-4xl font-light leading-[0.96] sm:text-6xl">{about.founderTitle}</h2><p className="mt-6 max-w-xl whitespace-pre-line text-base leading-8 text-muted-foreground sm:text-lg">{about.founderStory}</p></div><div className="relative min-h-[24rem] overflow-hidden bg-muted"><Image src={about.founderImage} alt="The Revamp UG founder" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" /></div></div></section>

      {capabilities.length > 0 && <section className="border-b border-border/20 px-5 py-16 sm:px-8 md:py-24 lg:px-16"><div className="mx-auto max-w-[1440px]"><div className="mb-10 max-w-2xl"><p className="text-[10px] uppercase tracking-[0.25em] text-primary">Capabilities</p><h2 className="mt-4 font-serif text-4xl font-light sm:text-6xl">How we work.</h2></div><div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">{capabilities.map((item, index) => <article key={`${item.title}-${index}`} className="bg-background p-6 sm:p-8"><h3 className="mt-8 font-serif text-3xl font-light">{item.title}</h3><p className="mt-4 text-sm leading-7 text-muted-foreground">{item.description}</p></article>)}</div></div></section>}

      {references.length > 0 && <section className="border-b border-border/20 bg-obsidian px-5 py-16 text-ivory sm:px-8 md:py-24 lg:px-16"><div className="mx-auto max-w-[1440px]"><div className="mb-10 flex items-end justify-between gap-6"><div><p className="text-[10px] uppercase tracking-[0.25em] text-gold">Selected references</p><h2 className="mt-4 font-serif text-4xl font-light sm:text-6xl">Work with intention.</h2></div><Link href="/portfolio" className="hidden items-center gap-2 text-xs uppercase tracking-[0.15em] text-ivory/70 sm:inline-flex">View portfolio <ArrowUpRight className="size-4" /></Link></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{references.map((item, index) => <article key={`${item.title}-${index}`} className="group">{item.image && <div className="relative aspect-[4/3] overflow-hidden bg-white/10"><Image src={item.image} alt={item.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 33vw" /></div>}<p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-gold">{item.category}</p><h3 className="mt-2 font-serif text-3xl font-light">{item.title}</h3><p className="mt-3 text-sm leading-6 text-ivory/65">{item.description}</p></article>)}</div></div></section>}

      {employees.length > 0 && <section className="border-b border-border/20 px-5 py-16 sm:px-8 md:py-24 lg:px-16"><div className="mx-auto max-w-[1440px]"><div className="mb-10 text-center"><p className="text-[10px] uppercase tracking-[0.25em] text-primary">The people</p><h2 className="mt-4 font-serif text-4xl font-light sm:text-6xl">The studio behind the work.</h2></div><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{employees.map((member, index) => <article key={`${member.name}-${index}`} className="border border-border/60 bg-card p-4"><div className="relative aspect-[4/5] overflow-hidden bg-muted">{member.image ? <Image src={member.image} alt={`Portrait of ${member.name}`} fill className="object-cover object-top" sizes="(max-width: 640px) 100vw, 25vw" /> : <div className="flex h-full items-center justify-center font-serif text-5xl text-primary/40">{member.name.slice(0, 1)}</div>}</div><h3 className="mt-5 font-serif text-2xl font-light">{member.name}</h3><p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-primary">{member.role}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{member.bio}</p></article>)}</div></div></section>}

      <section className="px-5 py-16 text-center sm:px-8 md:py-24"><p className="text-[10px] uppercase tracking-[0.25em] text-primary">Begin a conversation</p><h2 className="mx-auto mt-4 max-w-2xl font-serif text-4xl font-light sm:text-6xl">Bring us the room, the question, or the ambition.</h2><div className="mt-8 flex flex-wrap justify-center gap-3"><Button asChild className="min-h-12 rounded-none px-7 text-xs uppercase tracking-[0.16em]"><Link href="/book-consultation">Book a consultation</Link></Button><Button asChild variant="outline" className="min-h-12 rounded-none px-7 text-xs uppercase tracking-[0.16em]"><Link href="/contact">Contact the studio</Link></Button></div></section>
    </main>
    <SiteFooter />
  </>
}
