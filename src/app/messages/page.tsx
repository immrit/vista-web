'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { NotesTray } from '@/components/notes/NotesTray';
import { ConnectionBanner } from '@/components/chat/ConnectionBanner';
import { cn } from '@/lib/theme/cn';
import { Plus, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getChatWebSocket } from '@/lib/chat/chatWebSocket';

interface ConversationListItem {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserUsername?: string;
  otherUserAvatar?: string | null;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  unreadCount: number;
  updatedAt: string;
  isOnline?: boolean;
}

function normalizeConversation(raw: Record<string, unknown>): ConversationListItem {
  const peerId = String(raw.peer_id || raw.other_user_id || 'unknown');
  const lastMessageTime = (raw.last_message_at || raw.last_message_time || raw.updated_at || raw.created_at || null) as string | null;
  return {
    id: String(raw.id),
    otherUserId: peerId,
    otherUserName: String(raw.name || raw.other_user_name || raw.peer_name || 'کاربر'),
    otherUserUsername: (raw.username || raw.other_user_username || raw.peer_username) as string | undefined,
    otherUserAvatar: (raw.image || raw.avatar_url || raw.other_user_avatar || null) as string | null,
    lastMessage: (raw.last_message_text || raw.last_message || null) as string | null,
    lastMessageTime,
    unreadCount: Number(raw.unread_count || 0),
    updatedAt: String(raw.updated_at || lastMessageTime || ''),
    isOnline: Boolean(raw.is_online),
  };
}

export default function MessagesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showList, setShowList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<{ conversations?: Record<string, unknown>[] }>('/v1/chat/conversations?limit=50');
      setConversations((data.conversations || []).map(normalizeConversation));
    } catch {
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [user, loading, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const convId = params.get('conversation');
    const userId = params.get('user');
    if (convId) {
      setSelectedId(convId);
      if (isMobile) setShowList(false);
    } else if (userId && user) {
      apiClient.post<{ id: string }>('/v1/chat/conversations', { peer_id: userId })
        .then(conv => {
          setSelectedId(conv.id);
          if (isMobile) setShowList(false);
          router.replace(`/messages?conversation=${conv.id}`);
        })
        .catch(() => {});
    }
  }, [isMobile, user, router]);

  useEffect(() => {
    if (!user) return;
    void loadConversations();
  }, [user, loadConversations]);

  useEffect(() => {
    if (!user) return;
    const ws = getChatWebSocket();
    if (!ws) return;

    return ws.subscribe(event => {
      if (event.type === 'new_message') {
        const payload = event.data ?? {};
        const conversationId = String(payload.conversation_id ?? '');
        if (!conversationId) return;

        setConversations(prev => {
          const idx = prev.findIndex(c => c.id === conversationId);
          const preview = String(payload.content ?? payload.message_type ?? 'پیام');
          const time = String(payload.created_at ?? new Date().toISOString());
          const senderId = String(payload.sender_id ?? '');

          if (idx === -1) {
            void loadConversations();
            return prev;
          }

          const updated = [...prev];
          const item = { ...updated[idx] };
          item.lastMessage = preview;
          item.lastMessageTime = time;
          item.updatedAt = time;
          if (senderId !== user.id && selectedId !== conversationId) {
            item.unreadCount += 1;
          }
          updated[idx] = item;
          return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        });
      }

      if (event.type === 'conversation_updated') {
        void loadConversations();
      }

      if (event.type === 'read_receipt') {
        const conversationId = String(event.data?.conversation_id ?? '');
        const readerId = String(event.data?.user_id ?? '');
        if (readerId === user.id && conversationId) {
          setConversations(prev =>
            prev.map(c => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
          );
        }
      }
    });
  }, [user, selectedId, loadConversations]);

  const selectConversation = (id: string) => {
    setSelectedId(id);
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    if (isMobile) setShowList(false);
  };

  const filtered = conversations.filter(c =>
    !searchQuery ||
    c.otherUserName.includes(searchQuery) ||
    c.otherUserUsername?.includes(searchQuery),
  );

  const peerIds = conversations.map(c => c.otherUserId);
  const selected = conversations.find(c => c.id === selectedId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-var(--safe-area-top))] lg:h-screen flex flex-col lg:flex-row">
      <div
        className={cn(
          'flex flex-col border-l border-vista-border dark:border-vista-border-dark bg-vista-bg dark:bg-vista-bg-dark',
          'w-full lg:w-[380px] shrink-0',
          isMobile && !showList && 'hidden',
          isMobile && 'h-full',
        )}
      >
        <ConnectionBanner />

        <div className="flex items-center justify-between px-4 h-14 border-b border-vista-border dark:border-vista-border-dark">
          <h1 className="font-bold text-lg">پیام‌ها</h1>
          <Link
            href="/messages/create"
            className="p-2 rounded-full hover:bg-vista-surface-variant dark:hover:bg-vista-surface-variant-dark"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>

        <div className="px-4 py-2 space-y-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vista-text-secondary" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="جستجو..."
              className="input-vista py-2.5 pr-9 text-sm"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'unread'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition',
                  filter === type
                    ? 'bg-vista-gradient text-white'
                    : 'bg-vista-surface-variant dark:bg-vista-surface-variant-dark text-vista-text-secondary',
                )}
              >
                {type === 'all' ? 'همه' : 'خوانده‌نشده'}
              </button>
            ))}
          </div>
        </div>

        <NotesTray userIds={peerIds} />

        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ConversationList
              conversations={filtered}
              selectedId={selectedId}
              onSelect={selectConversation}
              compact
              filter={filter}
            />
          )}
        </div>
      </div>

      <div className={cn('flex-1 flex flex-col min-w-0', isMobile && showList && 'hidden')}>
        {selectedId && selected ? (
          <>
            {isMobile && (
              <div className="flex items-center gap-3 px-4 h-14 border-b border-vista-border dark:border-vista-border-dark bg-vista-bg dark:bg-vista-bg-dark">
                <button
                  onClick={() => {
                    setShowList(true);
                    setSelectedId(null);
                  }}
                  className="p-2 -mr-2"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <div className="flex items-center gap-2">
                  {selected.otherUserAvatar ? (
                    <img src={selected.otherUserAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-vista-gradient flex items-center justify-center text-white text-sm font-bold">
                      {selected.otherUserName.charAt(0)}
                    </div>
                  )}
                  <span className="font-semibold">{selected.otherUserName}</span>
                </div>
              </div>
            )}
            <ChatWindow
              conversationId={selectedId}
              currentUserId={user!.id}
              conversationName={selected.otherUserName}
              conversationAvatar={selected.otherUserAvatar}
              otherUserId={selected.otherUserId}
              otherUserUsername={selected.otherUserUsername}
              onBack={
                isMobile
                  ? () => {
                      setShowList(true);
                      setSelectedId(null);
                    }
                  : undefined
              }
            />
          </>
        ) : (
          <div className="flex-1 hidden lg:flex items-center justify-center text-vista-text-secondary">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-vista-surface-variant dark:bg-vista-surface-variant-dark flex items-center justify-center text-2xl">
                💬
              </div>
              <p className="font-semibold">یک مکالمه انتخاب کنید</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
