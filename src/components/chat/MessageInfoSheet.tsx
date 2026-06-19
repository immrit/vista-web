'use client';

import { useState, useEffect } from 'react';
import { X, CheckCheck, Clock, Eye } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { formatTime } from '@/lib/utils/formatTime';

interface Reader {
  user_id: string
  username?: string
  full_name?: string
  avatar_url?: string
  read_at: string
}

interface MessageInfoSheetProps {
  messageId: string
  conversationId: string
  sentAt: string
  onClose: () => void
}

export function MessageInfoSheet({ messageId, conversationId, sentAt, onClose }: MessageInfoSheetProps) {
  const [readers, setReaders] = useState<Reader[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.get<{ readers?: Reader[] }>(
          `/v1/chat/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/readers`
        )
        setReaders(data.readers || [])
      } catch {
        setReaders([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [messageId, conversationId])

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm flex flex-col max-h-[70vh] z-10 animate-slide-in-bottom sm:animate-none">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Eye className="w-5 h-5 text-vista-primary" />
            اطلاعات پیام
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 text-sm">
          <Clock className="w-4 h-4 text-zinc-400" />
          <span className="text-zinc-500">ارسال شده در</span>
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatTime(sentAt)}</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCheck className="w-4 h-4 text-vista-primary" />
            خوانده شده توسط ({readers.length})
          </p>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : readers.length === 0 ? (
            <p className="text-center py-6 text-sm text-zinc-400">هنوز کسی پیام را نخوانده</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {readers.map(r => (
                <div key={r.user_id} className="flex items-center gap-3 px-4 py-3">
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-vista-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {(r.full_name || r.username || '?').charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.full_name || r.username}</p>
                    {r.username && r.full_name && <p className="text-xs text-zinc-400 truncate">@{r.username}</p>}
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0">{formatTime(r.read_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
