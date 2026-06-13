'use client'

import { cn } from '@/lib/theme/cn'
import type { ProfileNote } from '@/lib/socialApi'

interface ThoughtBubbleProps {
  note?: ProfileNote | null
  className?: string
  onClick?: () => void
}

export function ThoughtBubble({ note, className, onClick }: ThoughtBubbleProps) {
  if (!note?.content) return null

  const isExpired = note.expires_at && new Date(note.expires_at) < new Date()
  if (isExpired) return null

  return (
    <button
      onClick={onClick}
      className={cn(
        'absolute -top-2 left-1/2 -translate-x-1/2 z-10',
        'max-w-[140px] px-3 py-1.5',
        'bg-vista-surface dark:bg-vista-surface-variant-dark',
        'border border-vista-border dark:border-vista-border-dark',
        'rounded-2xl rounded-bl-sm shadow-md',
        'text-xs text-vista-text-primary dark:text-vista-text-primary-dark',
        'line-clamp-2 text-center',
        'hover:scale-105 transition-transform',
        className
      )}
    >
      {note.content}
    </button>
  )
}
