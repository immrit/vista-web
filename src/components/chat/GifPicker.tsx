'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { useIsDark } from '@/hooks/useIsDark';
import { getChatTheme } from '@/lib/chat/chatTheme';

interface GifResult {
  id: string
  url: string
  preview: string
  title: string
}

interface GifPickerProps {
  onSelect: (gifUrl: string) => void
  onClose: () => void
}

const TENOR_KEY = 'AIzaSyAyimkuYQYF_FXVALexPzfQJe7w4I-5P4E'
const TENOR_FALLBACK = 'LIVDSRZULELA'

async function searchGifs(query: string, limit = 20): Promise<GifResult[]> {
  const endpoint = query.trim()
    ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_KEY}&limit=${limit}&media_filter=gif,tinygif`
    : `https://tenor.googleapis.com/v2/featured?key=${TENOR_KEY}&limit=${limit}&media_filter=gif,tinygif`

  try {
    const res = await fetch(endpoint)
    if (!res.ok) throw new Error('tenor error')
    const data = await res.json() as { results?: Array<{ id: string; title: string; media_formats?: Record<string, { url: string }> }> }
    return (data.results || []).map(r => ({
      id: r.id,
      title: r.title,
      url: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url || '',
      preview: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url || '',
    })).filter(g => g.url)
  } catch {
    // Fallback to demo key
    try {
      const fallbackEndpoint = query.trim()
        ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_FALLBACK}&limit=${limit}&media_filter=gif,tinygif`
        : `https://tenor.googleapis.com/v2/featured?key=${TENOR_FALLBACK}&limit=${limit}&media_filter=gif,tinygif`
      const res2 = await fetch(fallbackEndpoint)
      const data2 = await res2.json() as { results?: Array<{ id: string; title: string; media_formats?: Record<string, { url: string }> }> }
      return (data2.results || []).map(r => ({
        id: r.id,
        title: r.title,
        url: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url || '',
        preview: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url || '',
      })).filter(g => g.url)
    } catch {
      return []
    }
  }
}

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<GifResult[]>([])
  const [loading, setLoading] = useState(true)
  const isDark = useIsDark()
  const theme = getChatTheme(isDark)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 80)
    load('')
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => load(query), 400)
    return () => clearTimeout(timer)
  }, [query])

  const load = async (q: string) => {
    setLoading(true)
    const results = await searchGifs(q)
    setGifs(results)
    setLoading(false)
  }

  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
      style={{ height: '320px', backgroundColor: theme.appBar, borderColor: theme.divider }}
    >
      <div className="flex items-center gap-2 p-2 border-b" style={{ borderColor: theme.divider }}>
        <Search className="w-4 h-4 shrink-0" style={{ color: theme.secondaryText }} />
        <input
          ref={searchRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="جستجوی GIF..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: theme.text }}
        />
        <button onClick={onClose} className="p-1">
          <X className="w-4 h-4" style={{ color: theme.secondaryText }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.secondaryText }} />
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm" style={{ color: theme.secondaryText }}>
            نتیجه‌ای یافت نشد
          </div>
        ) : (
          <div className="columns-3 gap-1 space-y-1">
            {gifs.map(gif => (
              <button
                key={gif.id}
                onClick={() => { onSelect(gif.url); onClose() }}
                className="w-full overflow-hidden rounded-lg hover:opacity-80 transition-opacity break-inside-avoid"
              >
                <img
                  src={gif.preview}
                  alt={gif.title}
                  className="w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-1.5 flex items-center justify-end border-t" style={{ borderColor: theme.divider }}>
        <span className="text-xs" style={{ color: theme.secondaryText }}>Powered by Tenor</span>
      </div>
    </div>
  )
}
