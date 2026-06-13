'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import { storyApi, StoryUser } from '@/lib/socialApi'
import { cn } from '@/lib/theme/cn'

interface StoryViewerProps {
  users: StoryUser[]
  initialUserIndex: number
  onClose: () => void
}

const STORY_DURATION = 5000

export function StoryViewer({ users, initialUserIndex, onClose }: StoryViewerProps) {
  const [userIndex, setUserIndex] = useState(initialUserIndex)
  const [storyIndex, setStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reply, setReply] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startRef = useRef(Date.now())

  const currentUser = users[userIndex]
  const stories = currentUser?.stories || []
  const currentStory = stories[storyIndex]

  const goNext = useCallback(() => {
    if (storyIndex < stories.length - 1) {
      setStoryIndex(i => i + 1)
      setProgress(0)
      startRef.current = Date.now()
    } else if (userIndex < users.length - 1) {
      setUserIndex(i => i + 1)
      setStoryIndex(0)
      setProgress(0)
      startRef.current = Date.now()
    } else {
      onClose()
    }
  }, [storyIndex, stories.length, userIndex, users.length, onClose])

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(i => i - 1)
      setProgress(0)
      startRef.current = Date.now()
    } else if (userIndex > 0) {
      const prevUser = users[userIndex - 1]
      setUserIndex(i => i - 1)
      setStoryIndex(Math.max(0, (prevUser?.stories?.length || 1) - 1))
      setProgress(0)
      startRef.current = Date.now()
    }
  }, [storyIndex, userIndex, users])

  useEffect(() => {
    if (!currentStory || paused) return
    if (currentStory.id) {
      storyApi.markViewed(currentStory.id).catch(() => {})
    }

    const tick = () => {
      const elapsed = Date.now() - startRef.current
      const pct = Math.min(elapsed / STORY_DURATION, 1)
      setProgress(pct)
      if (pct >= 1) goNext()
    }

    timerRef.current = setInterval(tick, 50)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentStory, paused, goNext])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goNext()
      if (e.key === 'ArrowRight') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goNext, goPrev])

  if (!currentUser || !currentStory) {
    onClose()
    return null
  }

  const handleReply = async () => {
    if (!reply.trim()) return
    try {
      await storyApi.reply(currentStory.id, reply.trim())
      setReply('')
    } catch {
      // silent
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      {/* Desktop: centered card */}
      <div className="relative w-full h-full md:max-w-md md:max-h-[90vh] md:rounded-2xl overflow-hidden bg-black">
        {/* Progress bars */}
        <div className="absolute top-0 inset-x-0 z-20 flex gap-1 p-3 pt-[calc(0.75rem+var(--safe-area-top))]">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width:
                    i < storyIndex ? '100%' : i === storyIndex ? `${progress * 100}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-10 inset-x-0 z-20 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-vista-gradient flex items-center justify-center text-white text-sm font-bold">
                {(currentUser.full_name || currentUser.username || 'و').charAt(0)}
              </div>
            )}
            <span className="text-white font-semibold text-sm">
              {currentUser.username || currentUser.full_name}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Media */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => { setPaused(false); startRef.current = Date.now() - progress * STORY_DURATION }}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => { setPaused(false); startRef.current = Date.now() - progress * STORY_DURATION }}
        >
          {currentStory.media_type === 'video' ? (
            <video
              key={currentStory.id}
              src={currentStory.media_url}
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <img
              key={currentStory.id}
              src={currentStory.media_url}
              alt=""
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Tap zones */}
        <button
          className="absolute inset-y-0 right-0 w-1/3 z-10"
          onClick={goPrev}
          aria-label="قبلی"
        />
        <button
          className="absolute inset-y-0 left-0 w-1/3 z-10"
          onClick={goNext}
          aria-label="بعدی"
        />

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 inset-x-0 z-20 px-4">
            <p className="text-white text-sm text-center drop-shadow-lg">{currentStory.caption}</p>
          </div>
        )}

        {/* Reply */}
        <div className="absolute bottom-0 inset-x-0 z-20 p-4 pb-[calc(1rem+var(--safe-area-bottom))]">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
            <input
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="پاسخ به استوری..."
              className="flex-1 bg-transparent text-white placeholder:text-white/60 text-sm outline-none"
              onKeyDown={e => e.key === 'Enter' && handleReply()}
            />
            <button
              onClick={handleReply}
              disabled={!reply.trim()}
              className={cn('p-1.5 rounded-full', reply.trim() ? 'text-vista-primary' : 'text-white/40')}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop nav arrows */}
      <button
        onClick={goPrev}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
      <button
        onClick={goNext}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
    </div>
  )
}
