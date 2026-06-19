'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react'
import { highlightApi, StoryHighlight, StoryResponse, storyApi } from '@/lib/socialApi'
import { StoryViewer } from './StoryViewer'
import { toast } from 'sonner'

interface StoryHighlightBarProps {
  userId: string
  isOwnProfile: boolean
}

export function StoryHighlightBar({ userId, isOwnProfile }: StoryHighlightBarProps) {
  const [highlights, setHighlights] = useState<StoryHighlight[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingHighlight, setViewingHighlight] = useState<StoryHighlight | null>(null)
  const [highlightStories, setHighlightStories] = useState<StoryResponse[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<StoryHighlight | null>(null)
  const [createTitle, setCreateTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [myStories, setMyStories] = useState<StoryResponse[]>([])
  const [selectedStoryIds, setSelectedStoryIds] = useState<Set<string>>(new Set())
  const [loadingStories, setLoadingStories] = useState(false)

  useEffect(() => {
    highlightApi.list(userId).then(h => { setHighlights(h); setLoading(false) })
  }, [userId])

  const openHighlight = async (h: StoryHighlight) => {
    setViewingHighlight(h)
    const stories = await highlightApi.getStories(h.id)
    setHighlightStories(stories)
  }

  const openCreate = async () => {
    setCreateTitle('')
    setSelectedStoryIds(new Set())
    setShowCreate(true)
    setLoadingStories(true)
    try {
      const stories = await storyApi.getUserStories(userId)
      setMyStories(stories)
    } catch { setMyStories([]) }
    finally { setLoadingStories(false) }
  }

  const openEdit = async (h: StoryHighlight) => {
    setEditTarget(h)
    setCreateTitle(h.title)
    setSelectedStoryIds(new Set(h.story_ids))
    setLoadingStories(true)
    try {
      const stories = await storyApi.getUserStories(userId)
      setMyStories(stories)
    } catch { setMyStories([]) }
    finally { setLoadingStories(false) }
  }

  const handleSaveCreate = async () => {
    if (!createTitle.trim() || selectedStoryIds.size === 0) return
    setSaving(true)
    try {
      const h = await highlightApi.create(createTitle.trim(), Array.from(selectedStoryIds))
      setHighlights(prev => [...prev, h])
      setShowCreate(false)
      toast.success('هایلایت ایجاد شد')
    } catch {
      toast.error('خطا در ایجاد هایلایت')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editTarget || !createTitle.trim()) return
    setSaving(true)
    try {
      await highlightApi.update(editTarget.id, createTitle.trim())
      if (selectedStoryIds.size > 0) {
        await highlightApi.addStories(editTarget.id, Array.from(selectedStoryIds).filter(id => !editTarget.story_ids.includes(id)))
      }
      setHighlights(prev => prev.map(h => h.id === editTarget.id ? { ...h, title: createTitle.trim() } : h))
      setEditTarget(null)
      toast.success('هایلایت بروزرسانی شد')
    } catch {
      toast.error('خطا در بروزرسانی')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (h: StoryHighlight) => {
    if (!confirm(`هایلایت "${h.title}" حذف شود؟`)) return
    try {
      await highlightApi.delete(h.id)
      setHighlights(prev => prev.filter(x => x.id !== h.id))
      toast.success('هایلایت حذف شد')
    } catch {
      toast.error('خطا در حذف')
    }
  }

  if (loading) return null
  if (highlights.length === 0 && !isOwnProfile) return null

  return (
    <>
      <div className="flex gap-4 overflow-x-auto px-4 py-3 scrollbar-hide">
        {isOwnProfile && (
          <button
            onClick={openCreate}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center hover:border-vista-primary transition-colors">
              <Plus className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-16 text-center truncate">جدید</span>
          </button>
        )}
        {highlights.map(h => (
          <div key={h.id} className="flex flex-col items-center gap-1.5 shrink-0 group">
            <button
              onClick={() => openHighlight(h)}
              className="relative w-16 h-16 rounded-full ring-2 ring-vista-primary/50 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 overflow-hidden hover:ring-vista-primary transition-all"
            >
              {h.cover_url ? (
                <img src={h.cover_url} alt={h.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-vista-gradient flex items-center justify-center text-white font-bold text-xl">
                  {h.title.charAt(0)}
                </div>
              )}
            </button>
            <div className="flex items-center gap-1">
              <span className="text-xs text-zinc-700 dark:text-zinc-300 max-w-[60px] truncate">{h.title}</span>
              {isOwnProfile && (
                <div className="hidden group-hover:flex items-center gap-0.5">
                  <button onClick={() => openEdit(h)} className="p-0.5 text-zinc-400 hover:text-vista-primary">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDelete(h)} className="p-0.5 text-zinc-400 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Highlight viewer */}
      {viewingHighlight && highlightStories.length > 0 && (
        <StoryViewer
          users={[{
            user_id: userId,
            username: viewingHighlight.title,
            stories: highlightStories,
          }]}
          initialUserIndex={0}
          onClose={() => { setViewingHighlight(null); setHighlightStories([]) }}
        />
      )}

      {/* Create / Edit modal */}
      {(showCreate || editTarget) && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowCreate(false); setEditTarget(null) }} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md flex flex-col max-h-[80vh] z-10 animate-slide-in-bottom sm:animate-none">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg">{editTarget ? 'ویرایش هایلایت' : 'هایلایت جدید'}</h3>
              <button onClick={() => { setShowCreate(false); setEditTarget(null) }} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">عنوان هایلایت</label>
              <input
                value={createTitle}
                onChange={e => setCreateTitle(e.target.value)}
                placeholder="مثلاً: سفر، کار، خانواده..."
                maxLength={30}
                className="w-full h-10 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-vista-primary"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">انتخاب استوری‌ها</p>
              {loadingStories ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-vista-primary" /></div>
              ) : myStories.length === 0 ? (
                <p className="text-center py-4 text-sm text-zinc-400">استوری‌ای برای انتخاب وجود ندارد</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {myStories.map(story => (
                    <button
                      key={story.id}
                      onClick={() => setSelectedStoryIds(prev => {
                        const next = new Set(prev)
                        next.has(story.id) ? next.delete(story.id) : next.add(story.id)
                        return next
                      })}
                      className="relative aspect-[9/16] rounded-xl overflow-hidden"
                    >
                      {story.media_type === 'video' ? (
                        <video src={story.media_url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={story.media_url} alt="" className="w-full h-full object-cover" />
                      )}
                      {selectedStoryIds.has(story.id) && (
                        <div className="absolute inset-0 bg-vista-primary/50 flex items-center justify-center">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={editTarget ? handleSaveEdit : handleSaveCreate}
                disabled={saving || !createTitle.trim() || (showCreate && selectedStoryIds.size === 0)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-vista-gradient text-white font-semibold text-sm disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editTarget ? 'ذخیره تغییرات' : 'ایجاد هایلایت'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
