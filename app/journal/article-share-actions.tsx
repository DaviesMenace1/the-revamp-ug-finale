'use client'

import { Link2, Share2 } from '@/components/ui/luxury-icons'

export default function ArticleShareActions() {
  const copyLink = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href)
    } catch {
      // Clipboard access can be unavailable in some mobile browser contexts.
    }
  }

  const shareArticle = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url: window.location.href })
        return
      } catch {
        // The visitor may have dismissed the native share sheet.
      }
    }
    await copyLink()
  }

  return <div className="flex items-center gap-4 text-muted-foreground"><button type="button" aria-label="Share article" onClick={() => void shareArticle()} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] hover:text-foreground"><Share2 className="size-4" /> Share</button><button type="button" aria-label="Copy article link" onClick={() => void copyLink()} className="hover:text-foreground"><Link2 className="size-4" /></button></div>
}
