'use client'

import { useState, useRef, PointerEvent as ReactPointerEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, X, Loader2, Type, Globe, Users, Lock, ChevronDown, Smile, Clock, Trash2 } from 'lucide-react'
import { storyApi } from '@/lib/socialApi'
import { UploadService } from '@/lib/uploadService'
import { useAuth } from '@/hooks/useAuth'
import { MobileTopBar } from '@/components/layout/MobileTopBar'
import { toast } from 'sonner'
import { cn } from '@/lib/theme/cn'

type PrivacyType = 'everyone' | 'followers' | 'close_friends'

const PRIVACY_OPTIONS: { value: PrivacyType; label: string; icon: typeof Globe }[] = [
  { value: 'everyone', label: 'همه', icon: Globe },
  { value: 'followers', label: 'دنبال‌کنندگان', icon: Users },
  { value: 'close_friends', label: 'دوستان نزدیک', icon: Lock },
]

type InteractiveElement = {
  id: string
  type: 'text' | 'sticker'
  content: string
  x: number
  y: number
}

const STICKERS = ['❤️', '🔥', '😂', '😍', '🎉', '🌟', '💯', '✨', '👋', '🎂']

export default function StoryCreatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [textOverlay, setTextOverlay] = useState('')
  const [showTextEditor, setShowTextEditor] = useState(false)
  const [privacy, setPrivacy] = useState<PrivacyType>('everyone')
  const [duration, setDuration] = useState<'24h' | '48h'>('24h')
  const [showPrivacyPicker, setShowPrivacyPicker] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [elements, setElements] = useState<InteractiveElement[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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
        privacy_type: privacy,
        duration_type: duration,
        interactive_elements: elements,
      })

      toast.success('استوری منتشر شد!')
      router.push('/feed')
    } catch {
      toast.error('خطا در انتشار استوری')
    } finally {
      setUploading(false)
    }
  }

  const handlePointerDown = (e: ReactPointerEvent, id: string) => {
    setDraggingId(id)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: ReactPointerEvent) => {
    if (!draggingId || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    // Calculate percentage based on container size
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setElements(prev => prev.map(el => 
      el.id === draggingId ? { ...el, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : el
    ))
  }

  const handlePointerUp = (e: ReactPointerEvent) => {
    setDraggingId(null)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  const addTextElement = () => {
    if (!textOverlay.trim()) {
      setShowTextEditor(false)
      return
    }
    setElements(prev => [...prev, {
      id: Date.now().toString(),
      type: 'text',
      content: textOverlay.trim(),
      x: 50,
      y: 50
    }])
    setTextOverlay('')
    setShowTextEditor(false)
  }

  const addSticker = (sticker: string) => {
    setElements(prev => [...prev, {
      id: Date.now().toString(),
      type: 'sticker',
      content: sticker,
      x: 50,
      y: 50
    }])
    setShowStickerPicker(false)
  }

  const selectedPrivacy = PRIVACY_OPTIONS.find(p => p.value === privacy) || PRIVACY_OPTIONS[0]

  return (
    <>
      <MobileTopBar showLogo={false} showNotifications={false}>
        <div className="flex items-center justify-between w-full px-2">
          <button onClick={() => router.back()} className="text-vista-text-secondary">انصراف</button>
          <span className="font-bold">استوری جدید</span>
          <button
            onClick={handlePublish}
            disabled={!file || uploading}
            className="text-vista-primary font-bold disabled:opacity-40"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'انتشار'}
          </button>
        </div>
      </MobileTopBar>

      <div className="feed-container px-4 py-6 lg:pt-8">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Media area */}
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
            <div 
              ref={containerRef}
              className="relative aspect-[9/16] max-h-[60vh] rounded-2xl overflow-hidden bg-black touch-none select-none"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {file?.type.startsWith('video/') ? (
                <video src={preview} className="w-full h-full object-contain pointer-events-none" controls playsInline />
              ) : (
                <img src={preview} alt="" className="w-full h-full object-contain pointer-events-none" draggable={false} />
              )}

              {/* Interactive Elements */}
              {elements.map(el => (
                <div
                  key={el.id}
                  onPointerDown={(e) => handlePointerDown(e, el.id)}
                  className="absolute cursor-move -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${el.x}%`, top: `${el.y}%` }}
                >
                  <div className={cn(
                    el.type === 'text' 
                      ? 'bg-black/60 text-white px-4 py-2 rounded-xl text-lg font-bold whitespace-nowrap backdrop-blur-sm'
                      : 'text-6xl drop-shadow-lg'
                  )}>
                    {el.content}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setElements(prev => prev.filter(p => p.id !== el.id)) }}
                    className="absolute -top-3 -right-3 p-1.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Editing tools */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                <button
                  onClick={() => setShowTextEditor(true)}
                  className="p-2 rounded-xl backdrop-blur-sm shadow-lg transition-colors bg-black/50 text-white hover:bg-black/70"
                >
                  <Type className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowStickerPicker(v => !v)}
                  className="p-2 rounded-xl backdrop-blur-sm shadow-lg transition-colors bg-black/50 text-white hover:bg-black/70"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => { setPreview(null); setFile(null); setElements([]); setTextOverlay('') }}
                className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Sticker Picker */}
              {showStickerPicker && (
                <div className="absolute top-16 left-14 bg-black/80 backdrop-blur-md p-3 rounded-2xl grid grid-cols-4 gap-2 z-10">
                  {STICKERS.map(sticker => (
                    <button
                      key={sticker}
                      onClick={() => addSticker(sticker)}
                      className="text-2xl hover:scale-110 transition-transform p-1"
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              )}

              {/* Text overlay editor */}
              {showTextEditor && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col">
                  <div className="flex justify-between p-4">
                    <button onClick={() => setShowTextEditor(false)} className="text-white font-semibold">لغو</button>
                    <button onClick={addTextElement} className="text-vista-primary font-bold">تایید</button>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-4">
                    <input
                      value={textOverlay}
                      onChange={e => setTextOverlay(e.target.value)}
                      placeholder="تایپ کنید..."
                      maxLength={100}
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && addTextElement()}
                      className="w-full bg-transparent text-white placeholder:text-white/60 text-center text-3xl font-bold outline-none"
                    />
                  </div>
                </div>
              )}
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

          {/* Caption */}
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="توضیح استوری (اختیاری)..."
            rows={2}
            maxLength={200}
            className="input-vista resize-none"
          />

          {/* Duration & Privacy selector */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <button
                onClick={() => setShowPrivacyPicker(v => !v)}
                className="flex items-center gap-2 w-full px-3 py-3 rounded-2xl bg-vista-surface dark:bg-vista-surface-dark border border-vista-border dark:border-vista-border-dark hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark transition-colors"
              >
                <selectedPrivacy.icon className="w-4 h-4 text-vista-primary shrink-0" />
                <span className="flex-1 text-right text-sm font-medium truncate">{selectedPrivacy.label}</span>
                <ChevronDown className={cn('w-4 h-4 transition-transform', showPrivacyPicker && 'rotate-180')} />
              </button>

              {showPrivacyPicker && (
                <div className="absolute top-full mt-1 inset-x-0 z-10 bg-vista-surface dark:bg-vista-surface-dark border border-vista-border dark:border-vista-border-dark rounded-2xl shadow-xl overflow-hidden">
                  {PRIVACY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setPrivacy(opt.value); setShowPrivacyPicker(false) }}
                      className={cn(
                        'flex items-center gap-2 w-full px-3 py-3 transition-colors text-sm',
                        privacy === opt.value
                          ? 'bg-vista-primary/10 text-vista-primary'
                          : 'hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark'
                      )}
                    >
                      <opt.icon className="w-4 h-4 shrink-0" />
                      <span className="font-medium truncate">{opt.label}</span>
                      {privacy === opt.value && <span className="mr-auto text-vista-primary">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setDuration(d => d === '24h' ? '48h' : '24h')}
              className="flex items-center gap-2 w-full px-3 py-3 rounded-2xl bg-vista-surface dark:bg-vista-surface-dark border border-vista-border dark:border-vista-border-dark hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark transition-colors"
            >
              <Clock className="w-4 h-4 text-vista-primary shrink-0" />
              <span className="flex-1 text-right text-sm font-medium truncate">
                مدت: {duration === '24h' ? '۲۴ ساعت' : '۴۸ ساعت (ویژه)'}
              </span>
            </button>
          </div>

          <button
            onClick={handlePublish}
            disabled={!file || uploading}
            className="btn-vista w-full flex items-center justify-center gap-2"
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
