'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { profileApi } from '@/lib/backendApi'
import { followApi } from '@/lib/socialApi'
import { useAuth } from '@/hooks/useAuth'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { ArrowRight, UserPlus, UserMinus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Profile } from '@/lib/types'

export default function FollowingPage() {
  const { username } = useParams<{ username: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState<string | undefined>()
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  const load = useCallback(async (reset = false) => {
    try {
      const profile = await profileApi.byUsername(username)
      const result = await profileApi.getFollowing(profile.id, 30, reset ? undefined : cursor)
      setUsers(prev => reset ? result.users : [...prev, ...result.users])
      setHasMore(Boolean(result.has_more))
      setCursor(result.next_cursor)
      if (reset) {
        const initFollowing = new Set(result.users.filter(u => (u as any).follow_status === 'following').map(u => u.id))
        setFollowingIds(initFollowing)
      }
    } catch {
      toast.error('خطا در بارگذاری')
    } finally {
      setIsLoading(false)
    }
  }, [username, cursor])

  useEffect(() => { void load(true) }, [username])

  const handleFollow = async (userId: string, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        await followApi.unfollow(userId)
        setFollowingIds(prev => { const s = new Set(prev); s.delete(userId); return s })
      } else {
        await followApi.follow(userId)
        setFollowingIds(prev => new Set([...prev, userId]))
      }
    } catch { toast.error('خطا') }
  }

  return (
    <div className="min-h-screen bg-vista-bg dark:bg-vista-bg-dark">
      <MobileTopBar title={`دنبال‌شوندگان @${username}`} showLogo={false} showNotifications={false}
        rightAction={
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark">
            <ArrowRight className="w-5 h-5" />
          </button>
        }
      />
      <div className="feed-container py-4">
        <h1 className="hidden lg:block text-xl font-bold px-4 mb-4">دنبال‌شوندگان @{username}</h1>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-vista-primary" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-vista-text-secondary">هنوز کسی را دنبال نمی‌کند</div>
        ) : (
          <div className="space-y-1">
            {users.map(u => (
              <UserRow key={u.id} user={u} isMe={user?.id === u.id} isFollowing={followingIds.has(u.id)} onFollow={handleFollow} />
            ))}
            {hasMore && (
              <button onClick={() => load()} className="w-full py-3 text-sm text-vista-primary font-medium">
                بیشتر نمایش بده
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function UserRow({ user, isMe, isFollowing, onFollow }: { user: Profile; isMe: boolean; isFollowing: boolean; onFollow: (id: string, following: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-vista-surface-variant/60 dark:hover:bg-vista-surface-variant-dark/60 transition-colors">
      <Link href={`/profile/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-vista-gradient flex items-center justify-center text-white font-bold flex-shrink-0">
            {(user.full_name || user.username || 'و').charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold truncate">{user.full_name || user.username}</p>
          <p className="text-sm text-vista-text-secondary truncate">@{user.username}</p>
        </div>
      </Link>
      {!isMe && (
        <button
          onClick={() => onFollow(user.id, isFollowing)}
          className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0 flex items-center gap-1.5 ${
            isFollowing
              ? 'border border-vista-border dark:border-vista-border-dark text-vista-text-primary dark:text-vista-text-primary-dark'
              : 'bg-vista-gradient text-white'
          }`}
        >
          {isFollowing ? <><UserMinus className="w-3.5 h-3.5" />دنبال می‌کنید</> : <><UserPlus className="w-3.5 h-3.5" />دنبال کردن</>}
        </button>
      )}
    </div>
  )
}
