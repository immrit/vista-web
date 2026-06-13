'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { ProfileNote } from '@/lib/socialApi'
import { cn } from '@/lib/theme/cn'

interface NoteViewerSheetProps {
  note: ProfileNote | null
  username?: string
  avatarUrl?: string
  isOpen: boolean
  onClose: () => void
  onReply?: () => void
}

export function NoteViewerSheet({ note, username, avatarUrl, isOpen, onClose, onReply }: NoteViewerSheetProps) {
  if (!isOpen || !note?.content) return null

  const isExpired = note.expires_at && new Date(note.expires_at) < new Date()
  if (isExpired) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-sm bg-vista-surface dark:bg-vista-surface-dark rounded-t-3xl md:rounded-3xl p-6 animate-slide-in-bottom">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-vista-gradient flex items-center justify-center text-white font-bold">
                {(username || 'و').charAt(0)}
              </div>
            )}
            <span className="font-semibold">@{username}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 rounded-2xl bg-vista-surface-variant dark:bg-vista-surface-variant-dark mb-4">
          <p className="text-base leading-relaxed">{note.content}</p>
        </div>
        {onReply && (
          <button onClick={onReply} className="btn-vista w-full">
            پاسخ دادن
          </button>
        )}
      </div>
    </div>
  )
}
