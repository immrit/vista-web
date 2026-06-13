'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { UploadService } from '@/lib/uploadService'
import { getPostCharacterLimit, postApi } from '@/lib/backendApi'
import { Image, Video, Music, X, Loader2, Hash } from 'lucide-react'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { cn } from '@/lib/theme/cn'
import { toast } from 'sonner'

type MediaType = 'image' | 'video' | 'music' | null

export default function CreatePostPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<MediaType>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const maxLen = getPostCharacterLimit(profile)

  const pickMedia = (type: MediaType) => {
    setMediaType(type)
    fileRef.current?.click()
  }

  const handleFile = (file: File) => {
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
  }

  const clearMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview)
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
  }

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) {
      toast.error('متن یا رسانه اضافه کنید')
      return
    }
    if (!user?.id) return

    setSubmitting(true)
    try {
      let image_url: string | undefined
      let video_url: string | undefined
      let music_url: string | undefined

      if (mediaFile && mediaType) {
        setUploadProgress('در حال آپلود...')
        if (mediaType === 'image') image_url = await UploadService.uploadImage(mediaFile, user.id)
        else if (mediaType === 'video') video_url = await UploadService.uploadVideo(mediaFile, user.id)
        else if (mediaType === 'music') music_url = await UploadService.uploadMusic(mediaFile, user.id)
      }

      setUploadProgress('در حال انتشار...')
      await postApi.create({ content: content.trim(), image_url, video_url, music_url })
      toast.success('پست منتشر شد!')
      router.push('/feed')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'خطا در انتشار')
    } finally {
      setSubmitting(false)
      setUploadProgress('')
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <MobileTopBar title="پست جدید" showLogo={false} showNotifications={false}>
        <div className="flex items-center justify-between w-full px-2">
          <button onClick={() => router.back()} className="text-vista-text-secondary">انصراف</button>
          <span className="font-bold">پست جدید</span>
          <button
            onClick={handleSubmit}
            disabled={submitting || (!content.trim() && !mediaFile)}
            className="text-vista-primary font-bold disabled:opacity-40"
          >
            {submitting ? '...' : 'انتشار'}
          </button>
        </div>
      </MobileTopBar>

      <div className="feed-container px-4 py-4 max-w-2xl lg:pt-8">
        <div className="lg:glass-card lg:p-6 lg:rounded-2xl">
          {/* User row */}
          <div className="flex items-center gap-3 mb-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-vista-gradient flex items-center justify-center text-white font-bold">
                {(profile?.full_name || 'و').charAt(0)}
              </div>
            )}
            <span className="font-semibold">{profile?.full_name || profile?.username}</span>
          </div>

          {/* Text area */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, maxLen))}
            placeholder="چه چیزی در ذهن دارید؟"
            rows={6}
            autoFocus
            className="w-full bg-transparent text-lg resize-none outline-none placeholder:text-vista-text-secondary leading-relaxed"
          />
          <p className={cn('text-xs text-left mb-4', content.length >= maxLen ? 'text-vista-error' : 'text-vista-text-secondary')}>
            {content.length}/{maxLen}
          </p>

          {/* Media preview */}
          {mediaPreview && (
            <div className="relative mb-4 rounded-2xl overflow-hidden bg-vista-surface-variant dark:bg-vista-surface-variant-dark">
              {mediaType === 'video' ? (
                <video src={mediaPreview} className="w-full max-h-80 object-contain" controls playsInline />
              ) : mediaType === 'music' ? (
                <div className="p-6 flex items-center gap-3">
                  <Music className="w-8 h-8 text-vista-primary" />
                  <span className="text-sm truncate">{mediaFile?.name}</span>
                </div>
              ) : (
                <img src={mediaPreview} alt="" className="w-full max-h-80 object-contain" />
              )}
              <button onClick={clearMedia} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {uploadProgress && (
            <div className="flex items-center gap-2 text-sm text-vista-primary mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploadProgress}
            </div>
          )}

          {/* Media picker */}
          <div className="flex gap-3 pt-4 border-t border-vista-border dark:border-vista-border-dark">
            {[
              { type: 'image' as const, icon: Image, label: 'تصویر', color: 'text-green-500' },
              { type: 'video' as const, icon: Video, label: 'ویدیو', color: 'text-red-500' },
              { type: 'music' as const, icon: Music, label: 'موزیک', color: 'text-purple-500' },
            ].map(({ type, icon: Icon, label, color }) => (
              <button
                key={type}
                onClick={() => pickMedia(type)}
                disabled={!!mediaFile}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-vista-border dark:border-vista-border-dark transition-colors',
                  mediaFile ? 'opacity-40 cursor-not-allowed' : 'hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark'
                )}
              >
                <Icon className={cn('w-5 h-5', color)} />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>

          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept={
              mediaType === 'image' ? 'image/*' :
              mediaType === 'video' ? 'video/*' :
              mediaType === 'music' ? 'audio/*' : undefined
            }
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />

          <button
            onClick={handleSubmit}
            disabled={submitting || (!content.trim() && !mediaFile)}
            className="btn-vista w-full mt-6 hidden lg:flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            انتشار پست
          </button>
        </div>
      </div>
    </>
  )
}
