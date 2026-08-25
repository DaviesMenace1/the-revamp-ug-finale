import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export function StudioIntroSection() {
  return (
    <section className="overflow-hidden border-b border-border/70 bg-background py-20 sm:py-28 lg:py-36">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24 lg:px-12">
        <div className="flex items-start gap-4"><div><p className="text-[10px] uppercase tracking-[0.28em] text-primary">A studio for considered living</p><p className="mt-6 max-w-xs text-sm leading-7 text-muted-foreground">We bring architecture, interiors, objects, and sourcing into one clear point of view.</p></div></div>
        <div>
          <h2 className="max-w-5xl font-serif text-4xl leading-[0.98] tracking-tight text-foreground sm:text-6xl lg:text-8xl">Rooms with a point of view<span className="text-primary">.</span></h2>
          <div className="mt-10 flex flex-col gap-8 border-t border-border/70 pt-8 sm:flex-row sm:items-end sm:justify-between"><p className="max-w-md text-base leading-7 text-muted-foreground">The Revamp is a Ugandan design house with a global eye. We create spaces that feel collected, tactile, and unmistakably yours — from the first sketch to the final object.</p><Link href="/about" className="inline-flex min-h-11 w-fit shrink-0 items-center gap-2 border-b border-foreground pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-primary hover:text-primary">Meet the studio <ArrowUpRight className="size-4" /></Link></div>
        </div>
      </div>
    </section>
  )
}
