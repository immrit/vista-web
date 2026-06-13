'use client'

import { useBatchNotes } from '@/hooks/useStories'
import { cn } from '@/lib/theme/cn'
import Link from 'next/link'

interface NotesTrayProps {
  userIds: string[]
}

export function NotesTray({ userIds }: NotesTrayProps) {
  const { data: notes = {} } = useBatchNotes(userIds.slice(0, 20))

  const activeNotes = userIds
    .map(id => ({ id, note: notes[id] }))
    .filter(({ note }) => note?.content && note.expires_at && new Date(note.expires_at) > new Date())

  if (activeNotes.length === 0) return null

  return (
    <div className="border-b border-vista-border dark:border-vista-border-dark px-4 py-3">
      <p className="text-xs font-semibold text-vista-text-secondary mb-2">یادداشت‌ها</p>
      <div className="flex gap-3 overflow-x-auto scrollbar-none">
        {activeNotes.map(({ id, note }) => (
          <Link
            key={id}
            href={`/messages?user=${id}`}
            className="shrink-0 max-w-[120px]"
          >
            <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-vista-surface-variant dark:bg-vista-surface-variant-dark border border-vista-border dark:border-vista-border-dark text-xs line-clamp-2 hover:border-vista-primary/30 transition-colors">
              {note!.content}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
