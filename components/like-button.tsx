'use client'

import { useState } from 'react'

export default function LikeButton({ initial = 147 }: { initial?: number }) {
  const [likes, setLikes] = useState(initial)
  const [liked, setLiked] = useState(false)

  const toggleLike = () => {
    setLiked(!liked)
    setLikes(liked ? likes - 1 : likes + 1)
  }

  return (
    <button
      onClick={toggleLike}
      className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/20 hover:border-primary/40 text-muted-foreground hover:text-primary transition-colors font-light"
    >
      <svg
        className={`size-5 ${liked ? 'fill-current' : ''}`}
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 21s-6.716-4.736-9.237-7.257A5.5 5.5 0 0 1 6 4.5 5.5 5.5 0 0 1 12 8.09 5.5 5.5 0 0 1 18 4.5a5.5 5.5 0 0 1 3.237 9.243C18.716 16.264 12 21 12 21z"
        />
      </svg>
      <span>{likes} likes</span>
    </button>
  )
}
