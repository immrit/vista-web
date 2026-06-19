'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Eye, Send, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { storyApi, StoryUser } from '@/lib/socialApi'
import { cn } from '@/lib/theme/cn'
import { useAuth } from '@/hooks/useAuth'

interface StoryViewerProps {
  users: StoryUser[]
  initialUserIndex: number
  onClose: () => void
}

const STORY_DURATION = 5000
const STORY_REACTIONS = ['❤️', '🔥', '😮', '😂', '👏', '😢', '😍', '🙌', '💯']

export function StoryViewer({ users, initialUserIndex, onClose }: StoryViewerProps) {
  const [userIndex, setUserIndex] = useState(initialUserIndex)
  const [storyIndex, setStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reply, setReply] = useState('')
  const [showReactions, setShowReactions] = useState(false)
  const [showViewers, setShowViewers] = useState(false)
  const [viewers, setViewers] = useState<Array<{ user_id: string; username: string; full_name?: string; avatar_url?: string; viewed_at: string }>>([])
  const [loadingViewers, setLoadingViewers] = useState(false)
  const [sentReaction, setSentReaction] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef(Date.now())
  const { user } = useAuth()

  const currentUser = users[userIndex]
  const stories = currentUser?.stories || []
  const currentStory = stories[storyIndex]
  const isOwnStory = currentUser?.user_id === user?.id

  const goNext = useCallback(() => {
    if (storyIndex < stories.length - 1) {
      setStoryIndex(i => i + 1)
      setProgress(0)
      startRef.current = Date.now()
      setShowViewers(false)
    } else if (userIndex < users.length - 1) {
      setUserIndex(i => i + 1)
      setStoryIndex(0)
      setProgress(0)
      startRef.current = Date.now()
      setShowViewers(false)
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
    if (!currentStory || paused || showViewers) return
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
  }, [currentStory, paused, showViewers, goNext])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showViewers) setShowViewers(false)
        else onClose()
      }
      if (!showViewers && e.key === 'ArrowLeft') goNext()
      if (!showViewers && e.key === 'ArrowRight') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goNext, goPrev, showViewers])

  const handleShowViewers = async () => {
    if (!currentStory?.id) return
    setPaused(true)
    setShowViewers(true)
    setLoadingViewers(true)
    try {
      const list = await storyApi.getViewers(currentStory.id)
      setViewers(list)
    } catch {
      setViewers([])
    } finally {
      setLoadingViewers(false)
    }
  }

  const handleReply = async () => {
    if (!reply.trim()) return
    try {
      await storyApi.reply(currentStory.id, reply.trim())
      setReply('')
    } catch { /* silent */ }
  }

  const handleReact = async (emoji: string) => {
    setSentReaction(emoji)
    setShowReactions(false)
    try {
      await storyApi.react(currentStory.id, emoji)
    } catch { /* silent */ }
    setTimeout(() => setSentReaction(null), 2000)
  }

  if (!currentUser || !currentStory) {
    onClose()
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="relative w-full h-full md:max-w-md md:max-h-[90vh] md:rounded-2xl overflow-hidden bg-black">
        {/* Progress bars */}
        <div className="absolute top-0 inset-x-0 z-20 flex gap-1 p-3 pt-[calc(0.75rem+var(--safe-area-top))]">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < storyIndex ? '100%' : i === storyIndex ? `${progress * 100}%` : '0%',
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
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-vista-primary rounded-full" aria-label="بستن">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Media */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          onMouseDown={() => { setPaused(true); setShowReactions(false) }}
          onMouseUp={() => { setPaused(false); startRef.current = Date.now() - progress * STORY_DURATION }}
          onTouchStart={() => { setPaused(true); setShowReactions(false) }}
          onTouchEnd={() => { setPaused(false); startRef.current = Date.now() - progress * STORY_DURATION }}
        >
          {currentStory.media_type === 'video' ? (
            <video key={currentStory.id} src={currentStory.media_url} className="w-full h-full object-contain pointer-events-none" autoPlay muted playsInline />
          ) : (
            <img key={currentStory.id} src={currentStory.media_url} alt="" className="w-full h-full object-contain pointer-events-none" />
          )}

          {/* Interactive Elements */}
          {currentStory.interactive_elements?.map((el: any) => (
            <div
              key={el.id}
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${el.x}%`, top: `${el.y}%` }}
            >
              <div className={cn(
                el.type === 'text' 
                  ? 'bg-black/60 text-white px-4 py-2 rounded-xl text-lg font-bold whitespace-nowrap backdrop-blur-sm'
                  : 'text-6xl drop-shadow-lg'
              )}>
                {el.content}
              </div>
            </div>
          ))}
        </div>

        {/* Tap zones */}
        <button className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={goPrev} aria-label="قبلی" />
        <button className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={goNext} aria-label="بعدی" />

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-24 inset-x-0 z-20 px-4">
            <p className="text-white text-sm text-center drop-shadow-lg">{currentStory.caption}</p>
          </div>
        )}

        {/* Sent reaction animation */}
        {sentReaction && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <span className="text-6xl animate-bounce">{sentReaction}</span>
          </div>
        )}

        {/* Reaction picker */}
        {showReactions && (
          <div className="absolute bottom-20 inset-x-0 z-30 flex justify-center gap-2 px-4">
            <div className="flex gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-2">
              {STORY_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="text-2xl hover:scale-125 transition-transform active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="absolute bottom-0 inset-x-0 z-20 p-4 pb-[calc(1rem+var(--safe-area-bottom))]">
          {isOwnStory ? (
            /* Own story: show viewer count */
            <button
              onClick={handleShowViewers}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-vista-primary rounded-full px-2 py-1"
              aria-label="مشاهده بازدیدکنندگان"
            >
              <Eye className="w-5 h-5" />
              <span className="text-sm">
                {currentStory.view_count ?? 0} بازدید
              </span>
            </button>
          ) : (
            /* Other's story: reply + reaction */
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                <input
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="پاسخ به استوری..."
                  className="flex-1 bg-transparent text-white placeholder:text-white/60 text-sm outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleReply()}
                  onClick={e => e.stopPropagation()}
                />
                <button
                  onClick={handleReply}
                  disabled={!reply.trim()}
                  className={cn('p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-vista-primary', reply.trim() ? 'text-vista-primary' : 'text-white/40')}
                  aria-label="ارسال پاسخ"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              {/* Emoji reaction button */}
              <button
                onClick={e => { e.stopPropagation(); setShowReactions(r => !r); setPaused(true) }}
                className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full text-xl focus:outline-none focus:ring-2 focus:ring-vista-primary"
                aria-label="واکنش نشان دادن"
              >
                ❤️
              </button>
            </div>
          )}
        </div>

        {/* Viewers sheet */}
        {showViewers && (
          <div className="absolute inset-0 z-40 bg-black/70 flex items-end" onClick={() => { setShowViewers(false); setPaused(false); startRef.current = Date.now() }}>
            <div
              className="w-full bg-zinc-900 rounded-t-2xl p-4 max-h-[60%] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  بازدیدکنندگان ({currentStory.view_count ?? viewers.length})
                </h3>
                <button onClick={() => { setShowViewers(false); setPaused(false); startRef.current = Date.now() }} className="text-white/60 focus:outline-none focus:ring-2 focus:ring-vista-primary rounded-full p-1" aria-label="بستن لیست بازدیدکنندگان">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                {loadingViewers ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : viewers.length === 0 ? (
                  <p className="text-white/50 text-center py-6 text-sm">هنوز کسی استوری را ندیده</p>
                ) : (
                  <div className="space-y-3">
                    {viewers.map(v => (
                      <div key={v.user_id} className="flex items-center gap-3">
                        {v.avatar_url ? (
                          <img src={v.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-vista-gradient flex items-center justify-center text-white text-sm font-bold">
                            {(v.full_name || v.username || '?').charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-white text-sm font-medium">{v.full_name || v.username}</p>
                          <p className="text-white/50 text-xs">@{v.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop nav arrows */}
      <button onClick={goPrev} className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors focus:outline-none focus:ring-2 focus:ring-vista-primary" aria-label="استوری قبلی">
        <ChevronRight className="w-6 h-6" />
      </button>
      <button onClick={goNext} className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors focus:outline-none focus:ring-2 focus:ring-vista-primary" aria-label="استوری بعدی">
        <ChevronLeft className="w-6 h-6" />
      </button>
    </div>
  )
}
