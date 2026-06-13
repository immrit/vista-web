'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useCurrentUserNote } from '@/hooks/useStories'
import { cn } from '@/lib/theme/cn'

const MAX_LENGTH = 60

interface NoteInputSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function NoteInputSheet({ isOpen, onClose }: NoteInputSheetProps) {
  const { note, createNote, deleteNote, isCreating } = useCurrentUserNote()
  const [content, setContent] = useState(note?.content || '')

  if (!isOpen) return null

  const handleSave = async () => {
    const trimmed = content.trim()
    if (!trimmed) return
    await createNote(trimmed.slice(0, MAX_LENGTH))
    onClose()
  }

  const handleDelete = async () => {
    await deleteNote()
    setContent('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full md:max-w-md bg-vista-surface dark:bg-vista-surface-dark rounded-t-3xl md:rounded-3xl p-6 animate-slide-in-bottom">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg">یادداشت جدید</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="چه فکری می‌کنی؟"
            rows={3}
            autoFocus
            className="input-vista resize-none text-base"
          />
          <span className={cn(
            'absolute bottom-3 left-3 text-xs',
            content.length >= MAX_LENGTH ? 'text-vista-error' : 'text-vista-text-secondary dark:text-vista-text-secondary-dark'
          )}>
            {content.length}/{MAX_LENGTH}
          </span>
        </div>

        <p className="text-xs text-vista-text-secondary dark:text-vista-text-secondary-dark mb-4">
          یادداشت شما ۲۴ ساعت نمایش داده می‌شود
        </p>

        <div className="flex gap-3">
          {note && (
            <button
              onClick={handleDelete}
              className="flex-1 py-3 rounded-2xl border border-vista-error text-vista-error font-semibold hover:bg-vista-error/10 transition-colors"
            >
              حذف
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!content.trim() || isCreating}
            className="flex-1 btn-vista"
          >
            {isCreating ? 'در حال ذخیره...' : 'انتشار'}
          </button>
        </div>
      </div>
    </div>
  )
}
