'use client';

import { useState, useEffect } from 'react';
import { Search, Send, X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  name: string;
  avatar?: string | null;
}

interface ForwardMessageModalProps {
  content: string;
  onClose: () => void;
}

function normalizeForwardConv(raw: Record<string, unknown>): Conversation {
  return {
    id: String(raw.id),
    name: String(raw.name || raw.other_user_name || raw.peer_name || 'کاربر'),
    avatar: (raw.image || raw.avatar_url || raw.other_user_avatar || null) as string | null,
  };
}

export function ForwardMessageModal({ content, onClose }: ForwardMessageModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.get<{ conversations?: Record<string, unknown>[] }>(
          '/v1/chat/conversations?limit=50',
        );
        setConversations((data.conversations || []).map(normalizeForwardConv));
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedIds.size === 0) return;
    setSending(true);
    try {
      await Promise.all(
        [...selectedIds].map(convId =>
          apiClient.post(`/v1/chat/conversations/${convId}/messages`, { content }),
        ),
      );
      toast.success(`پیام به ${selectedIds.size} مکالمه ارسال شد`);
      onClose();
    } catch {
      toast.error('خطا در ارسال');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md flex flex-col max-h-[80vh] animate-slide-in-bottom sm:animate-none">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="font-bold text-lg">ارسال پیام به</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجوی مکالمه..."
              className="w-full h-10 pr-9 pl-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-zinc-400 py-10 text-sm">مکالمه‌ای یافت نشد</p>
          ) : (
            filtered.map(conv => (
              <button
                key={conv.id}
                onClick={() => toggle(conv.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                <div className="relative shrink-0">
                  <Avatar src={conv.avatar} alt={conv.name} size="sm" />
                  {selectedIds.has(conv.id) && (
                    <div className="absolute inset-0 rounded-full bg-vista-primary/80 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">{conv.name}</span>
              </button>
            ))
          )}
        </div>

        {/* Send */}
        {selectedIds.size > 0 && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-vista-gradient text-white font-semibold text-sm disabled:opacity-60"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              ارسال به {selectedIds.size} مکالمه
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
