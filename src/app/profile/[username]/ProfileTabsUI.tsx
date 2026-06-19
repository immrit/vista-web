'use client'

import { PostWithProfile, Profile } from '@/lib/types'
import { BadgeCheck, CreditCard, Grid3X3, Clapperboard, Music, MessageSquare, Share2, Settings, Lock, UserPlus, UserMinus, MoreHorizontal, Flag, Ban, Link2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PostCard } from '@/components/ui/PostCard'
import { blockApi } from '@/lib/socialApi'
import { ThoughtBubble } from '@/components/notes/ThoughtBubble'
import { NoteInputSheet } from '@/components/notes/NoteInputSheet'
import { useCurrentUserNote, useBatchNotes } from '@/hooks/useStories'
import { followApi } from '@/lib/socialApi'
import { cn } from '@/lib/theme/cn'
import { toast } from 'sonner'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { GuestJoinBanner } from '@/components/ui/GuestJoinBanner'
import { GuestShareHeader } from '@/components/ui/GuestShareHeader'
import { NoteViewerSheet } from '@/components/notes/NoteViewerSheet'
import { VistaIDCard } from '@/components/profile/VistaIDCard'
import { profileApi } from '@/lib/backendApi'
import { StoryHighlightBar } from '@/components/stories/StoryHighlightBar'

export default function ProfileTabsUI({ profile, posts, musicPosts, isRtl }: {
  profile: Profile
  posts: PostWithProfile[]
  musicPosts: PostWithProfile[]
  isRtl: boolean
}) {
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'music'>('posts')
  const [localPosts, setLocalPosts] = useState(() => {
    const pinned = posts.filter(p => p.is_pinned)
    const rest = posts.filter(p => !p.is_pinned)
    return [...pinned, ...rest]
  })
  const [followStatus, setFollowStatus] = useState<string>((profile as Record<string, unknown>).follow_status as string || 'none')
  const [showNoteSheet, setShowNoteSheet] = useState(false)
  const [showNoteViewer, setShowNoteViewer] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const { note: myNote } = useCurrentUserNote()
  const { data: profileNotes = {} } = useBatchNotes([profile.id])
  const profileNote = profileNotes[profile.id]
  const router = useRouter()

  const isGuest = !authLoading && !user
  const isOwnProfile = user?.id === profile.id
  const isPrivate = Boolean(profile.is_private)
  const isLocked = isPrivate && followStatus !== 'following' && !isOwnProfile
  const reelPosts = localPosts.filter(p => p.video_url)

  const tabs = [
    { id: 'posts' as const, icon: Grid3X3, label: 'پست‌ها' },
    { id: 'reels' as const, icon: Clapperboard, label: 'Reels' },
    { id: 'music' as const, icon: Music, label: 'موزیک' },
  ]

  const handleFollow = async () => {
    try {
      if (followStatus === 'following') {
        await followApi.unfollow(profile.id)
        setFollowStatus('none')
        toast.success('لغو دنبال کردن')
      } else {
        const res = await followApi.follow(profile.id)
        setFollowStatus(res.status || 'following')
        toast.success(res.status === 'requested' ? 'درخواست ارسال شد' : 'دنبال شد')
      }
    } catch {
      toast.error('خطا')
    }
  }

  const [showIDCard, setShowIDCard] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [showReportUser, setShowReportUser] = useState(false)
  const [reportUserReason, setReportUserReason] = useState('inappropriate')
  const [reportingUser, setReportingUser] = useState(false)

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/profile/${profile.username}`
    if (navigator.share) {
      try { await navigator.share({ title: profile.full_name || profile.username, url }) } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('لینک پروفایل کپی شد')
    }
  }

  const handleBlock = async () => {
    setShowMoreMenu(false)
    if (!confirm(isBlocked ? `آیا مسدودی ${profile.username} برداشته شود؟` : `آیا ${profile.username} مسدود شود؟`)) return
    try {
      if (isBlocked) {
        await blockApi.unblock(profile.id)
        setIsBlocked(false)
        toast.success('مسدودی برداشته شد')
      } else {
        await blockApi.block(profile.id)
        setIsBlocked(true)
        toast.success('کاربر مسدود شد')
      }
    } catch { toast.error('خطا') }
  }

  const handleReportUser = async () => {
    setReportingUser(true)
    try {
      await blockApi.reportUser(profile.id, reportUserReason)
      toast.success('گزارش ارسال شد')
      setShowReportUser(false)
    } catch { toast.error('خطا در ارسال گزارش') }
    finally { setReportingUser(false) }
  }

  const handleRequestVerification = async () => {
    try {
      await profileApi.requestVerification()
      setVerificationSent(true)
      toast.success('درخواست تأیید ارسال شد')
    } catch {
      toast.error('خطا در ارسال درخواست')
    }
  }

  const displayNote = isOwnProfile ? myNote : profileNote

  const handleNoteClick = () => {
    if (isOwnProfile) setShowNoteSheet(true)
    else if (profileNote?.content) setShowNoteViewer(true)
  }

  return (
    <>
      {isGuest && <GuestShareHeader />}
      {!isGuest && <MobileTopBar title={profile.username || ''} showLogo={false} showNotifications={false}>
        <span className="font-bold">@{profile.username}</span>
      </MobileTopBar>}

      <div className={cn('min-h-screen pb-bottom-nav lg:pb-0', isGuest && 'pb-28')} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="feed-container lg:pt-6">
          {/* Header */}
          <div className="px-4 py-6 lg:glass-card lg:rounded-2xl lg:mb-4">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* Avatar + Note */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleNoteClick}
                  className="relative block"
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-vista-primary/20" />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-vista-gradient flex items-center justify-center text-white text-3xl font-bold">
                      {(profile.full_name || profile.username || 'و').charAt(0)}
                    </div>
                  )}
                  {displayNote && (
                    <ThoughtBubble note={displayNote} onClick={handleNoteClick} />
                  )}
                </button>
              </div>

              {/* Stats + Info */}
              <div className="flex-1 w-full text-center sm:text-right">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h1 className="text-xl font-bold">{profile.full_name || profile.username}</h1>
                  {profile.is_verified && (
                    <span className="text-vista-primary text-sm">✓</span>
                  )}
                  {isPrivate && <Lock className="w-4 h-4 text-vista-text-secondary" />}
                </div>
                <p className="text-vista-text-secondary text-sm mb-4">@{profile.username}</p>

                {/* Stats row */}
                <div className="flex justify-center sm:justify-start gap-8 mb-4">
                  {[
                    { n: profile.posts_count || localPosts.length, l: 'پست' },
                    { n: profile.followers_count || 0, l: 'دنبال‌کننده' },
                    { n: profile.following_count || 0, l: 'دنبال‌شونده' },
                  ].map(({ n, l }) => (
                    <div key={l} className="text-center">
                      <p className="font-bold text-lg">{n.toLocaleString('fa-IR')}</p>
                      <p className="text-xs text-vista-text-secondary">{l}</p>
                    </div>
                  ))}
                </div>

                {profile.bio && (
                  <p className="text-sm leading-relaxed mb-4 max-w-md">{profile.bio}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-center sm:justify-start flex-wrap">
                  {isOwnProfile ? (
                    <>
                      <Link href="/settings/account" className="px-5 py-2 rounded-2xl border border-vista-border dark:border-vista-border-dark font-semibold text-sm hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark transition-colors">
                        ویرایش پروفایل
                      </Link>
                      <button
                        onClick={() => setShowIDCard(true)}
                        className="p-2 rounded-2xl border border-vista-border dark:border-vista-border-dark hover:bg-vista-surface-variant transition-colors"
                        title="کارت شناسایی ویستا"
                      >
                        <CreditCard className="w-5 h-5" />
                      </button>
                      {!profile.is_verified && (
                        <button
                          onClick={handleRequestVerification}
                          disabled={verificationSent}
                          className={cn(
                            'p-2 rounded-2xl border transition-colors',
                            verificationSent
                              ? 'border-green-500 text-green-500'
                              : 'border-vista-border dark:border-vista-border-dark hover:bg-vista-surface-variant'
                          )}
                          title={verificationSent ? 'درخواست ارسال شد' : 'درخواست تیک تأیید'}
                        >
                          <BadgeCheck className="w-5 h-5" />
                        </button>
                      )}
                      <Link href="/settings" className="p-2 rounded-2xl border border-vista-border dark:border-vista-border-dark hover:bg-vista-surface-variant transition-colors">
                        <Settings className="w-5 h-5" />
                      </Link>
                    </>
                  ) : !isGuest ? (
                    <>
                      <button onClick={handleFollow} className={cn(
                        'px-5 py-2 rounded-2xl font-semibold text-sm transition-colors',
                        followStatus === 'following'
                          ? 'border border-vista-border dark:border-vista-border-dark'
                          : 'bg-vista-gradient text-white'
                      )}>
                        {followStatus === 'following' ? (
                          <span className="flex items-center gap-1"><UserMinus className="w-4 h-4" /> دنبال می‌کنید</span>
                        ) : followStatus === 'requested' ? (
                          'درخواست ارسال شد'
                        ) : (
                          <span className="flex items-center gap-1"><UserPlus className="w-4 h-4" /> دنبال کردن</span>
                        )}
                      </button>
                      <button
                        onClick={() => router.push(`/messages?user=${profile.id}`)}
                        className="px-5 py-2 rounded-2xl border border-vista-border dark:border-vista-border-dark font-semibold text-sm flex items-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" /> پیام
                      </button>
                      <button onClick={handleShareProfile} className="p-2 rounded-2xl border border-vista-border dark:border-vista-border-dark hover:bg-vista-surface-variant transition-colors">
                        <Share2 className="w-5 h-5" />
                      </button>
                      <div className="relative">
                        <button onClick={() => setShowMoreMenu(m => !m)} className="p-2 rounded-2xl border border-vista-border dark:border-vista-border-dark hover:bg-vista-surface-variant transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        {showMoreMenu && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                            <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl z-50 py-2">
                              <button
                                onClick={() => { handleShareProfile(); setShowMoreMenu(false) }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              >
                                <Link2 className="w-4 h-4" /> کپی لینک
                              </button>
                              <button
                                onClick={handleBlock}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                              >
                                <Ban className="w-4 h-4" /> {isBlocked ? 'رفع مسدودی' : 'مسدود کردن'}
                              </button>
                              <button
                                onClick={() => { setShowMoreMenu(false); setShowReportUser(true) }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Flag className="w-4 h-4" /> گزارش
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Story Highlights */}
          <StoryHighlightBar userId={profile.id} isOwnProfile={isOwnProfile} />

          {/* Tabs */}
          <div className="sticky top-0 z-20 bg-vista-bg/90 dark:bg-vista-bg-dark/90 backdrop-blur-xl border-b border-vista-border dark:border-vista-border-dark">
            <div className="flex">
              {tabs.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors relative',
                    activeTab === id ? 'text-vista-primary' : 'text-vista-text-secondary'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{label}</span>
                  {activeTab === id && (
                    <span className="absolute bottom-0 inset-x-4 h-0.5 bg-vista-gradient rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-2 py-4">
            {isLocked ? (
              <div className="text-center py-16">
                <Lock className="w-12 h-12 mx-auto mb-4 text-vista-text-secondary" />
                <p className="font-semibold">حساب خصوصی</p>
                <p className="text-sm text-vista-text-secondary mt-1">برای مشاهده پست‌ها این کاربر را دنبال کنید</p>
              </div>
            ) : activeTab === 'posts' ? (
              localPosts.length === 0 ? (
                <EmptyTab label="پستی وجود ندارد" />
              ) : (
                <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
                  {localPosts.map(post => (
                    <Link key={post.id} href={`/post/${post.id}`} className="aspect-square relative overflow-hidden bg-vista-surface-variant dark:bg-vista-surface-variant-dark group">
                      {post.image_url ? (
                        <img src={post.image_url} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                      ) : post.video_url ? (
                        <video src={post.video_url} className="w-full h-full object-cover" muted />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2 text-xs text-center line-clamp-4">{post.content}</div>
                      )}
                      {post.is_pinned && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )
            ) : activeTab === 'reels' ? (
              reelPosts.length === 0 ? (
                <EmptyTab label="Reels وجود ندارد" />
              ) : (
                <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
                  {reelPosts.map(post => (
                    <Link key={post.id} href={`/post/${post.id}`} className="aspect-[9/16] relative overflow-hidden bg-black">
                      <video src={post.video_url!} className="w-full h-full object-cover" muted />
                    </Link>
                  ))}
                </div>
              )
            ) : musicPosts.length === 0 ? (
              <EmptyTab label="پست موزیکی وجود ندارد" />
            ) : (
              <div className="space-y-3">
                {musicPosts.map(post => (
                  <PostCard key={post.id} post={post} onUpdate={p => setLocalPosts(prev => prev.map(x => x.id === p.id ? p : x))} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isGuest && <GuestJoinBanner />}
      {isOwnProfile && <NoteInputSheet isOpen={showNoteSheet} onClose={() => setShowNoteSheet(false)} />}
      {!isOwnProfile && (
        <NoteViewerSheet
          note={profileNote}
          username={profile.username}
          avatarUrl={profile.avatar_url}
          isOpen={showNoteViewer}
          onClose={() => setShowNoteViewer(false)}
          onReply={() => router.push(`/messages?user=${profile.id}`)}
        />
      )}
      {showIDCard && <VistaIDCard profile={profile} onClose={() => setShowIDCard(false)} />}

      {showReportUser && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowReportUser(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 animate-slide-in-bottom sm:animate-none z-10">
            <h3 className="font-bold text-lg mb-4">گزارش کاربر</h3>
            <div className="space-y-2 mb-5">
              {[
                { v: 'inappropriate', l: 'محتوای نامناسب' },
                { v: 'spam', l: 'اسپم' },
                { v: 'fake', l: 'حساب جعلی' },
                { v: 'harassment', l: 'آزار و اذیت' },
                { v: 'other', l: 'سایر' },
              ].map(r => (
                <label key={r.v} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <input type="radio" name="report-user-reason" value={r.v} checked={reportUserReason === r.v} onChange={() => setReportUserReason(r.v)} className="accent-vista-primary w-4 h-4" />
                  <span className="text-sm">{r.l}</span>
                </label>
              ))}
            </div>
            <button onClick={handleReportUser} disabled={reportingUser} className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-60">
              {reportingUser ? 'در حال ارسال...' : 'ارسال گزارش'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="text-center py-16 text-vista-text-secondary">
      <p>{label}</p>
    </div>
  )
}
