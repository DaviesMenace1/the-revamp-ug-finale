'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'revamp:wishlist'

function readWishlist(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function writeWishlist(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  window.dispatchEvent(new CustomEvent('revamp:wishlist-change'))
}

export function WishlistButton({
  productId,
  variant = 'full',
}: {
  productId: string
  variant?: 'full' | 'icon'
}) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const sync = () => setSaved(readWishlist().includes(productId))
    sync()
    window.addEventListener('revamp:wishlist-change', sync)
    return () => window.removeEventListener('revamp:wishlist-change', sync)
  }, [productId])

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const current = readWishlist()
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]
    writeWishlist(next)
    setSaved(next.includes(productId))
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={toggle}
        aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={saved}
        className="size-9 flex items-center justify-center bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
      >
        <Heart size={16} className={cn('transition-colors', saved ? 'fill-gold text-gold' : 'text-foreground/70')} />
      </button>
    )
  }

  return (
    <Button
      onClick={toggle}
      variant="outline"
      size="lg"
      aria-pressed={saved}
      className="w-full rounded-none border-foreground/20 font-sans text-xs tracking-widest uppercase py-6 hover:border-gold hover:text-gold"
    >
      <Heart size={15} className={cn('mr-2', saved && 'fill-gold text-gold')} />
      {saved ? 'Saved to Wishlist' : 'Add to Wishlist'}
    </Button>
  )
}
