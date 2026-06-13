'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useActiveStories } from '@/hooks/useStories'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/theme/cn'
import type { StoryUser } from '@/lib/socialApi'
import { StoryViewer } from './StoryViewer'

export function StoryBar() {
  const { data: storyUsers = [], isLoading } = useActiveStories()
  const { profile } = useAuth()
  const [viewerState, setViewerState] = useState<{ users: StoryUser[]; userIndex: number } | null>(null)

  const openViewer = (userIndex: number) => {
    setViewerState({ users: storyUsers, userIndex })
  }

  return (
    <>
      <div className="border-b border-vista-border dark:border-vista-border-dark bg-vista-bg dark:bg-vista-bg-dark">
        <div className="flex gap-3 overflow-x-auto px-4 py-3 scrollbar-none">
          {/* Add story */}
          <Link
            href="/stories/create"
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="relative w-[68px] h-[68px]">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-vista-surface-variant dark:bg-vista-surface-variant-dark flex items-center justify-center text-lg font-bold">
                  {(profile?.full_name || profile?.username || 'و').charAt(0)}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-6 h-6 bg-vista-primary rounded-full flex items-center justify-center border-2 border-vista-bg dark:border-vista-bg-dark">
                <Plus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </span>
            </div>
            <span className="text-[11px] text-vista-text-secondary dark:text-vista-text-secondary-dark">
              استوری شما
            </span>
          </Link>

          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="w-[68px] h-[68px] rounded-full skeleton" />
                  <div className="w-12 h-2 skeleton rounded" />
                </div>
              ))
            : storyUsers.map((user, index) => (
                <button
                  key={user.user_id}
                  onClick={() => openViewer(index)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group"
                >
                  <div
                    className={cn(
                      'p-[2.5px] rounded-full',
                      user.has_unseen !== false ? 'story-ring' : 'story-ring-seen'
                    )}
                  >
                    <div className="p-[2px] bg-vista-bg dark:bg-vista-bg-dark rounded-full">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt=""
                          className="w-[60px] h-[60px] rounded-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div className="w-[60px] h-[60px] rounded-full bg-vista-gradient flex items-center justify-center text-white font-bold">
                          {(user.full_name || user.username || 'و').charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] max-w-[68px] truncate text-vista-text-secondary dark:text-vista-text-secondary-dark">
                    {user.username || user.full_name || 'کاربر'}
                  </span>
                </button>
              ))}
        </div>
      </div>

      {viewerState && (
        <StoryViewer
          users={viewerState.users}
          initialUserIndex={viewerState.userIndex}
          onClose={() => setViewerState(null)}
        />
      )}
    </>
  )
}
