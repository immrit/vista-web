'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { cn } from '@/lib/utils';

const conversationsCache = new Map<string, { data: ConversationListItem[]; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000;

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

function normalizeConversation(raw: any): ConversationListItem {
  const peerId = raw.peer_id || raw.other_user_id || 'unknown';
  const lastMessageTime = raw.last_message_at || raw.last_message_time || raw.updated_at || raw.created_at || null;

  return {
    id: raw.id,
    otherUserId: peerId,
    otherUserName: raw.name || raw.other_user_name || raw.peer_name || 'کاربر ناشناس',
    otherUserUsername: raw.username || raw.other_user_username || raw.peer_username,
    otherUserAvatar: raw.image || raw.avatar_url || raw.other_user_avatar || null,
    lastMessage: raw.last_message_text || raw.last_message || null,
    lastMessageTime,
    unreadCount: raw.unread_count || 0,
    updatedAt: raw.updated_at || lastMessageTime || '',
    isOnline: raw.is_online || false,
  };
}

export default function MessagesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && selectedConversationId) {
      setShowConversationList(false);
    }
  }, [isMobile, selectedConversationId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const conversationId = params.get('conversation');
    if (!conversationId) return;

    setSelectedConversationId(conversationId);
    if (isMobile) setShowConversationList(false);
  }, [isMobile]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/auth?redirect=/messages');
      return;
    }

    let ignore = false;
    const cacheKey = `conversations:${user.id}`;

    const fetchFreshConversations = async () => {
      const response = await apiClient.get<any>('/v1/chat/conversations?limit=50');
      const rawConversations = Array.isArray(response) ? response : response.conversations || [];
      const normalized = rawConversations.map(normalizeConversation);

      conversationsCache.set(cacheKey, { data: normalized, timestamp: Date.now() });
      if (!ignore) {
        setConversations(normalized);
        setError(null);
        setIsLoading(false);
      }
    };

    const fetchConversations = async () => {
      try {
        const cached = conversationsCache.get(cacheKey);
        const now = Date.now();

        if (cached && now - cached.timestamp < CACHE_TTL) {
          setConversations(cached.data);
          setIsLoading(false);
          setError(null);
          fetchFreshConversations().catch(console.error);
          return;
        }

        setIsLoading(true);
        await fetchFreshConversations();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'بارگیری گفتگوها با مشکل مواجه شد.';
        console.error('Failed to load conversations:', err);
        if (!ignore) {
          setError(message);
          setIsLoading(false);
        }
      }
    };

    fetchConversations();

    return () => {
      ignore = true;
    };
  }, [loading, router, user]);

  const activeConversation = selectedConversationId
    ? conversations.find(conversation => conversation.id === selectedConversationId) ?? {
      id: selectedConversationId,
      otherUserId: '',
      otherUserName: 'گروه ویستا',
      otherUserAvatar: null,
      unreadCount: 0,
      updatedAt: '',
    }
    : null;

  const handleBackToList = () => {
    setSelectedConversationId(null);
    setShowConversationList(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="rounded-xl border border-zinc-200 p-6 text-sm text-gray-500 dark:border-zinc-800 dark:text-gray-400">
          در حال بررسی حساب کاربری...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex bg-gray-50 dark:bg-zinc-950 overflow-hidden md:right-[220px] md:inset-auto md:left-0 md:top-0 md:bottom-0">
      <div
        className={cn(
          'border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900',
          'md:w-[380px] md:flex-shrink-0',
          isMobile ? (showConversationList ? 'w-full' : 'hidden') : 'flex flex-col',
        )}
      >
        {error ? (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={id => {
              setSelectedConversationId(id);
              if (isMobile) setShowConversationList(false);
              router.replace(`/messages?conversation=${encodeURIComponent(id)}`);
            }}
          />
        )}
      </div>

      <div className={cn('flex-1 min-w-0', isMobile ? (selectedConversationId ? 'flex flex-col' : 'hidden') : 'flex flex-col')}>
        {selectedConversationId && activeConversation ? (
          <ChatWindow
            conversationId={selectedConversationId}
            currentUserId={user.id}
            conversationName={activeConversation.otherUserName}
            conversationAvatar={activeConversation.otherUserAvatar}
            otherUserId={activeConversation.otherUserId}
            otherUserUsername={activeConversation.otherUserUsername}
            onBack={isMobile ? handleBackToList : undefined}
          />
        ) : (
          !isMobile && (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center space-y-4">
                <svg className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-lg font-medium">یک گفتگو را انتخاب کنید</p>
                <p className="text-sm">برای شروع، یکی از گفتگوهای سمت راست را باز کنید.</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
