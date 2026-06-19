'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Phone, Search, Video, Info, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ChatDetailsSheet } from './ChatDetailsSheet';
import { GroupDetailsSheet } from './GroupDetailsSheet';
import { SoundToggle } from './SoundToggle';
import { ChatBackground } from './ChatBackground';
import { ConnectionBanner } from './ConnectionBanner';
import { ForwardMessageModal } from './ForwardMessageModal';
import { useMessages } from '@/hooks/useMessages';
import { useTyping } from '@/hooks/useTyping';
import { Message } from '@/lib/models/message';
import { formatMessageDate } from '@/lib/utils/formatTime';
import { cn } from '@/lib/utils';
import { profileApi } from '@/lib/backendApi';
import { getChatTheme } from '@/lib/chat/chatTheme';
import { useIsDark } from '@/hooks/useIsDark';

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  conversationName: string;
  conversationAvatar?: string | null;
  otherUserId?: string;
  otherUserUsername?: string;
  onBack?: () => void;
}

function isGroupConversation(conversation: Record<string, unknown> | null, otherUserId?: string) {
  const type = String(conversation?.conversation_type || conversation?.type || '').toLowerCase();
  return type === 'group' || (!otherUserId && Boolean(conversation?.name));
}

export function ChatWindow({
  conversationId,
  currentUserId,
  conversationName,
  conversationAvatar,
  otherUserId,
  otherUserUsername,
  onBack,
}: ChatWindowProps) {
  const [showDetails, setShowDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [forwardContent, setForwardContent] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const shouldStickToBottomRef = useRef(true);

  const {
    messages,
    conversation,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMoreMessages,
    sendMessage,
    deleteMessage,
    editMessage,
    getDisplayContent,
    isSecret,
    secretChatReady,
    secretNotices,
    markRead,
  } = useMessages({ conversationId, currentUserId });

  const isDark = useIsDark();
  const chatTheme = getChatTheme(isDark);
  const isGroup = isGroupConversation(conversation, otherUserId);

  const { isTyping, typingUsers, setTyping } = useTyping({
    conversationId,
    currentUserId,
    peerName: conversationName,
  });

  const [fetchedProfile, setFetchedProfile] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (isGroup || !otherUserId) return;
      const participants = conversation?.participants as Array<{ profile?: { id?: string } }> | undefined;
      const otherParticipant = participants?.find(p => p.profile?.id !== currentUserId);
      if (otherParticipant?.profile) return;
      try {
        setFetchedProfile(await profileApi.get(otherUserId));
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [isGroup, otherUserId, conversation, currentUserId]);

  useEffect(() => {
    if (shouldStickToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    markRead();
  }, [conversationId, markRead]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
      shouldStickToBottomRef.current = isNearBottom;
      setShowScrollButton(!isNearBottom);

      if (scrollTop < 80 && hasMore && !isLoadingMore) {
        void loadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, loadMoreMessages]);

  useEffect(() => {
    if (showSearch) setTimeout(() => searchInputRef.current?.focus(), 50);
    else setSearchQuery('');
  }, [showSearch]);

  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const groupedMessages = filteredMessages.reduce((groups, message) => {
    const date = formatMessageDate(message.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  const handleEditSave = async (messageId: string, newContent: string) => {
    await editMessage(messageId, newContent);
    setEditingMessageId(null);
  };

  const handleDelete = async (messageId: string) => {
    if (confirm('آیا از حذف این پیام اطمینان دارید؟')) {
      await deleteMessage(messageId);
    }
  };

  const scrollToBottom = () => {
    shouldStickToBottomRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const participants = conversation?.participants as Array<{ profile?: Record<string, unknown>; user_id?: string }> | undefined;
  const otherParticipant = participants?.find(p => (p.profile?.id as string) !== currentUserId);
  let profile = otherParticipant?.profile || fetchedProfile;

  if (!isGroup && !profile && conversationName) {
    const userId = participants?.find(p => p.user_id !== currentUserId)?.user_id || otherUserId;
    profile = {
      id: userId || null,
      username: otherUserUsername || conversationName.toLowerCase().replace(/\s+/g, '').replace('@', ''),
      full_name: conversationName,
      avatar_url: conversationAvatar,
      is_online: false,
    };
  }

  const getReplyToMessage = (messageId: string): Message | null =>
    messages.find(m => m.id === messageId) || null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <ChatBackground className="h-full w-full">
      <ConnectionBanner />

      {isSecret && (
        <div className="px-3 py-2 text-xs text-center bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 border-b border-indigo-500/20">
          🔒 چت مخفی — رمزنگاری سرتاسری (E2EE)
          {!secretChatReady && ' — در حال تبادل کلید...'}
        </div>
      )}

      {secretNotices.map(notice => (
        <div
          key={notice}
          className="px-3 py-1.5 text-xs text-center bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-b border-emerald-500/15"
        >
          {notice}
        </div>
      ))}

      <div
        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 flex-shrink-0 border-b backdrop-blur-md"
        style={{
          backgroundColor: chatTheme.appBar,
          borderColor: chatTheme.divider,
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
            aria-label="بازگشت"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition md:hidden"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: chatTheme.icon }} />
          </button>
        )}

        <button onClick={() => setShowDetails(true)} className="relative flex-shrink-0 hover:opacity-85 transition">
          <Avatar
            src={isGroup ? (conversation?.image as string) || conversationAvatar : (profile?.avatar_url as string) || conversationAvatar}
            alt={isGroup ? String(conversation?.name || conversationName) : String(profile?.full_name || profile?.username || conversationName)}
            size="md"
          />
          {!isGroup && Boolean(profile?.is_online) && (
            <div
              className="absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-white dark:border-black"
              style={{ backgroundColor: chatTheme.online }}
            />
          )}
        </button>

        <button
          onClick={() => setShowDetails(true)}
          className="flex-1 text-right min-w-0 rounded-lg p-2 -mr-2 hover:bg-black/5 dark:hover:bg-white/5 transition"
        >
          <h2 className="text-sm sm:text-base font-semibold truncate" style={{ color: chatTheme.text }}>
            {String(profile?.full_name || profile?.username || conversationName || 'کاربر ناشناس')}
          </h2>
          <p className="text-xs sm:text-sm truncate" style={{ color: chatTheme.secondaryText }}>
            {Boolean(profile?.is_online)
              ? 'آنلاین'
              : `آخرین بازدید ${String(profile?.last_seen || 'نامشخص')}`}
          </p>
        </button>

        <div className="flex items-center gap-1 flex-shrink-0">
          <SoundToggle />
          <button
            onClick={() => setShowSearch(s => !s)}
            aria-label="جستجو در پیام‌ها"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <Search className="w-5 h-5" style={{ color: chatTheme.icon }} />
          </button>
          <button aria-label="تماس صوتی" className="hidden sm:flex p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition">
            <Phone className="w-5 h-5" style={{ color: chatTheme.icon }} />
          </button>
          <button aria-label="تماس تصویری" className="hidden sm:flex p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition">
            <Video className="w-5 h-5" style={{ color: chatTheme.icon }} />
          </button>
          <button
            onClick={() => setShowDetails(true)}
            aria-label="اطلاعات گفتگو"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <Info className="w-5 h-5" style={{ color: chatTheme.icon }} />
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0" style={{ backgroundColor: chatTheme.appBar, borderColor: chatTheme.divider }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: chatTheme.secondaryText }} />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="جستجو در پیام‌ها..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: chatTheme.text }}
          />
          {searchQuery && (
            <span className="text-xs shrink-0" style={{ color: chatTheme.secondaryText }}>
              {filteredMessages.length} نتیجه
            </span>
          )}
          <button onClick={() => setShowSearch(false)} aria-label="بستن جستجو" className="p-1">
            <X className="w-4 h-4" style={{ color: chatTheme.secondaryText }} />
          </button>
        </div>
      )}

      <div ref={containerRef} role="log" aria-live="polite" aria-label="پیام‌ها" className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 min-h-0">
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center" style={{ color: chatTheme.secondaryText }}>
              <p className="text-base font-medium mb-1">هنوز پیامی ارسال نشده</p>
              <p className="text-sm opacity-80">شروع به گفتگو کنید!</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex items-center justify-center my-3 sm:my-4">
                <div
                  className="px-3 py-1 rounded-full text-xs backdrop-blur-sm"
                  style={{ backgroundColor: chatTheme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: chatTheme.secondaryText }}
                >
                  {date}
                </div>
              </div>

              {dateMessages.map((message, idx) => {
                const prevMessage = idx > 0 ? dateMessages[idx - 1] : null;
                const nextMessage = idx < dateMessages.length - 1 ? dateMessages[idx + 1] : null;
                const isFirstInGroup = !prevMessage || prevMessage.senderId !== message.senderId;
                const isLastInGroup = !nextMessage || nextMessage.senderId !== message.senderId;

                return (
                  <div key={message.id} className={cn(isFirstInGroup && 'mt-2')}>
                                        <MessageBubble
                                            message={message}
                                            displayContent={getDisplayContent(message)}
                      replyToMessage={message.replyToId ? getReplyToMessage(message.replyToId) : null}
                      onReply={id => setReplyToMessageId(id)}
                      onEdit={id => setEditingMessageId(id)}
                      onDelete={handleDelete}
                      onForward={content => setForwardContent(content)}
                      conversationId={conversationId}
                      currentUserId={currentUserId}
                      isFirstInGroup={isFirstInGroup}
                      isLastInGroup={isLastInGroup}
                    />
                  </div>
                );
              })}
            </div>
          ))
        )}

        {isTyping && typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} className="px-1" />
        )}

        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          aria-label="رفتن به آخرین پیام"
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 p-2.5 rounded-full shadow-lg border backdrop-blur-md bg-white/90 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-700"
        >
          <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}

      <div className="flex-shrink-0">
        <MessageInput
          conversationId={conversationId}
          replyToMessageId={replyToMessageId}
          replyToContent={replyToMessageId ? getReplyToMessage(replyToMessageId)?.content : null}
          editingMessageId={editingMessageId}
          editingContent={editingMessageId ? getReplyToMessage(editingMessageId)?.content : null}
          onTyping={setTyping}
          onSend={async (content, files, replyToId, editingId) => {
            if (editingId) {
              await handleEditSave(editingId, content);
            } else {
              await sendMessage(content, files, replyToId || undefined);
            }
          }}
          onCancelReply={() => setReplyToMessageId(null)}
          onCancelEdit={() => setEditingMessageId(null)}
        />
      </div>

      {forwardContent !== null && (
        <ForwardMessageModal
          content={forwardContent}
          onClose={() => setForwardContent(null)}
        />
      )}

      {isGroup ? (
        <GroupDetailsSheet
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          conversation={conversation}
          currentUserId={currentUserId}
        />
      ) : (
        <ChatDetailsSheet
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          conversation={conversation}
          profile={profile}
          currentUserId={currentUserId}
        />
      )}
    </ChatBackground>
  );
}
