'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { storyApi } from '@/lib/socialApi'
import { UploadService } from '@/lib/uploadService'
import { useAuth } from '@/hooks/useAuth'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { toast } from 'sonner'

export default function StoryCreatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleFile = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handlePublish = async () => {
    if (!file) {
      toast.error('لطفاً یک تصویر یا ویدیو انتخاب کنید')
      return
    }

    setUploading(true)
    try {
      if (!user?.id) throw new Error('not authenticated')
      const objectUrl = await UploadService.uploadStory(file, user.id)

      await storyApi.create({
        media_url: objectUrl,
        media_type: file.type.startsWith('video/') ? 'video' : 'image',
        caption: caption.trim() || undefined,
      })

      toast.success('استوری منتشر شد!')
      router.push('/feed')
    } catch {
      toast.error('خطا در انتشار استوری')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <MobileTopBar title="استوری جدید" showLogo={false} showNotifications={false}>
        <h1 className="font-bold text-lg">استوری جدید</h1>
      </MobileTopBar>

      <div className="feed-container px-4 py-6 lg:pt-8">
        <div className="lg:glass-card lg:p-6 lg:rounded-2xl max-w-lg mx-auto">
          {!preview ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[9/16] max-h-[60vh] rounded-2xl border-2 border-dashed border-vista-border dark:border-vista-border-dark flex flex-col items-center justify-center gap-4 hover:border-vista-primary hover:bg-vista-primary/5 transition-all"
            >
              <ImagePlus className="w-12 h-12 text-vista-primary" />
              <div className="text-center">
                <p className="font-semibold">انتخاب تصویر یا ویدیو</p>
                <p className="text-sm text-vista-text-secondary dark:text-vista-text-secondary-dark mt-1">
                  از گالری دستگاه خود انتخاب کنید
                </p>
              </div>
            </button>
          ) : (
            <div className="relative aspect-[9/16] max-h-[60vh] rounded-2xl overflow-hidden bg-black">
              {file?.type.startsWith('video/') ? (
                <video src={preview} className="w-full h-full object-contain" controls playsInline />
              ) : (
                <img src={preview} alt="" className="w-full h-full object-contain" />
              )}
              <button
                onClick={() => { setPreview(null); setFile(null) }}
                className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />

          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="توضیح استوری (اختیاری)..."
            rows={2}
            className="input-vista mt-4 resize-none"
          />

          <button
            onClick={handlePublish}
            disabled={!file || uploading}
            className="btn-vista w-full mt-4 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال آپلود...
              </>
            ) : (
              'انتشار استوری'
            )}
          </button>
        </div>
      </div>
    </>
  )
}
