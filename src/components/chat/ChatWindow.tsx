'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Phone, Video, Info } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ChatDetailsSheet } from './ChatDetailsSheet';
import { SoundToggle } from './SoundToggle';
import { useMessages } from '@/hooks/useMessages';
import { useTyping } from '@/hooks/useTyping';
import { Message } from '@/lib/models/message';
import { formatMessageDate } from '@/lib/utils/formatTime';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface ChatWindowProps {
    conversationId: string;
    currentUserId: string;
    conversationName: string;
    conversationAvatar?: string | null;
    otherUserId?: string;
    otherUserUsername?: string;
    onBack?: () => void;
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

    const { messages, conversation, isLoading, sendMessage, deleteMessage, editMessage } = useMessages({
        conversationId,
        currentUserId,
    });
    const { isTyping, typingUsers } = useTyping({ conversationId, currentUserId });
    const [fetchedProfile, setFetchedProfile] = useState<any>(null);
    const supabase = createClient();

    // Fetch profile if not available from conversation
    useEffect(() => {
        const fetchProfile = async () => {
            if (!otherUserId) return; // Skip if no otherUserId
            
            // Check if profile is already in conversation
            const otherParticipant = conversation?.participants?.find((p: any) => p.profile?.id !== currentUserId);
            if (otherParticipant?.profile) return; // Skip if we already have profile
            
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url, is_online, is_verified, verification_type, bio, last_seen')
                    .eq('id', otherUserId)
                    .single();

                if (!error && data) {
                    setFetchedProfile(data);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };

        fetchProfile();
    }, [otherUserId, conversation, currentUserId, supabase]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Show/hide scroll button
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = formatMessageDate(message.createdAt);
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {} as Record<string, Message[]>);

    const handleReply = (messageId: string) => {
        setReplyToMessageId(messageId);
    };

    const handleEditStart = (messageId: string) => {
        setEditingMessageId(messageId);
    };

    const handleEditComplete = async (messageId: string, newContent: string) => {
        await editMessage(messageId, newContent);
        setEditingMessageId(null);
    };

    const handleDelete = async (messageId: string) => {
        if (confirm('آیا از حذف این پیام اطمینان دارید؟')) {
            await deleteMessage(messageId);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Get other participant
    const otherParticipant = conversation?.participants?.find((p: any) => p.profile?.id !== currentUserId);
    let profile = otherParticipant?.profile || fetchedProfile;
    
    // Fallback: If profile is not loaded from conversation or fetch, create a basic profile object from props
    if (!profile && conversationName) {
        // Try to get user_id from participants first, then from prop
        const userId = conversation?.participants?.find((p: any) => p.user_id !== currentUserId)?.user_id || otherUserId;
        profile = {
            id: userId || null,
            username: otherUserUsername || conversationName.toLowerCase().replace(/\s+/g, '').replace('@', ''),
            full_name: conversationName,
            avatar_url: conversationAvatar,
            is_online: false,
        };
    }

    const getReplyToMessage = (messageId: string): Message | null => {
        return messages.find(m => m.id === messageId) || null;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 relative">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800">
                {/* Back Button (Mobile) */}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                )}

                {/* Avatar with Online Status - Clickable for Details */}
                <button
                    onClick={() => setShowDetails(true)}
                    className="relative flex-shrink-0 hover:opacity-80 transition"
                >
                    <Avatar
                        src={profile?.avatar_url || conversationAvatar}
                        alt={profile?.full_name || profile?.username || conversationName}
                        size="md"
                    />
                    {profile?.is_online && (
                        <div className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                    )}
                </button>

                {/* User Info - Clickable for Details */}
                <button
                    onClick={() => setShowDetails(true)}
                    className="flex-1 text-right min-w-0 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg p-2 -mr-2 transition"
                >
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                        {profile?.full_name || profile?.username || conversationName || 'کاربر ناشناس'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {profile?.is_online ? 'آنلاین' : `آخرین بازدید ${profile?.last_seen || 'نامشخص'}`}
                    </p>
                </button>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                    <SoundToggle />
                    <button
                        onClick={() => {
                            // TODO: Implement voice call
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition"
                    >
                        <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                        onClick={() => {
                            // TODO: Implement video call
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition"
                    >
                        <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                        onClick={() => setShowDetails(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full transition"
                    >
                        <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Messages Container */}
            <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-sm text-gray-500 dark:text-gray-400">در حال بارگیری پیام‌ها...</div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                            <p className="text-lg font-medium mb-2">هنوز پیامی ارسال نشده</p>
                            <p className="text-sm">شروع به گفتگو کنید!</p>
                        </div>
                    </div>
                ) : (
                    Object.entries(groupedMessages).map(([date, dateMessages]) => (
                        <div key={date}>
                            {/* Date Separator */}
                            <div className="flex items-center justify-center my-4">
                                <div className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-full text-xs text-gray-600 dark:text-gray-400">
                                    {date}
                                </div>
                            </div>

                            {/* Messages for this date */}
                            {dateMessages.map((message, idx) => {
                                const prevMessage = idx > 0 ? dateMessages[idx - 1] : null;
                                const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;

                                return (
                                    <div key={message.id} className={cn('mb-2', showAvatar && 'mt-4')}>
                                        <MessageBubble
                                            message={message}
                                            replyToMessage={message.replyToId ? getReplyToMessage(message.replyToId) : null}
                                            onReply={handleReply}
                                            onEdit={handleEditStart}
                                            onDelete={handleDelete}
                                            conversationId={conversationId}
                                            currentUserId={currentUserId}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}

                {/* Typing Indicator */}
                {isTyping && typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}

                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to Bottom Button */}
            {showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full shadow-lg hover:shadow-xl transition"
                >
                    <svg
                        className="w-5 h-5 text-gray-600 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                    </svg>
                </button>
            )}

            {/* Message Input */}
            <MessageInput
                conversationId={conversationId}
                replyToMessageId={replyToMessageId}
                editingMessageId={editingMessageId}
                onSend={async (content, replyToId, editingId) => {
                    if (editingId) {
                        await handleEditComplete(editingId, content);
                    } else {
                        await sendMessage(content, undefined, replyToId || undefined);
                    }
                }}
                onCancelReply={() => setReplyToMessageId(null)}
                onCancelEdit={() => setEditingMessageId(null)}
            />

            {/* Chat Details Sheet */}
            <ChatDetailsSheet
                isOpen={showDetails}
                onClose={() => setShowDetails(false)}
                conversation={conversation}
                profile={profile}
                currentUserId={currentUserId}
            />
        </div>
    );
}

