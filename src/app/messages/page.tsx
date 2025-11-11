'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { cn } from '@/lib/utils';

// Simple in-memory cache for conversations
const conversationsCache = new Map<string, { data: ConversationListItem[]; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Function to invalidate cache for a user
export const invalidateConversationsCache = (userId: string) => {
    conversationsCache.delete(`conversations:${userId}`);
};

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

export default function MessagesPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const supabase = useMemo(() => createClient(), []);

    const [conversations, setConversations] = useState<ConversationListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showConversationList, setShowConversationList] = useState(true);

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Mobile: Hide conversation list when chat is selected
    useEffect(() => {
        if (isMobile && selectedConversationId) {
            setShowConversationList(false);
        }
    }, [isMobile, selectedConversationId]);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace('/auth?redirect=/messages');
            return;
        }

        let ignore = false;

        const fetchConversations = async () => {
            try {
                // Check cache first
                const cacheKey = `conversations:${user.id}`;
                const cached = conversationsCache.get(cacheKey);
                const now = Date.now();

                if (cached && (now - cached.timestamp) < CACHE_TTL) {
                    // Use cached data
                    setConversations(cached.data);
                    setIsLoading(false);
                    setError(null);

                    // Fetch fresh data in background to update cache
                    fetchFreshConversations(user.id, cacheKey).catch(console.error);
                    return;
                }

                setIsLoading(true);
                setError(null);

                await fetchFreshConversations(user.id, cacheKey);
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : typeof err === 'object' && err !== null
                            ? JSON.stringify(err)
                            : 'بارگیری گفتگوها با مشکل مواجه شد.';

                console.error('Failed to load conversations:', err);
                setError(message);
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        };

        const fetchFreshConversations = async (userId: string, cacheKey: string) => {
            try {

                const { data: participantRows, error: participantError } = await supabase
                    .from('conversation_participants')
                    .select(
                        `
              conversation_id,
              conversations!inner (
                id,
                last_message,
                last_message_time,
                updated_at,
                last_activity
              )
            `
                    )
                    .eq('user_id', userId)
                    .order('updated_at', { referencedTable: 'conversations', ascending: false });

                if (participantError) {
                    throw participantError;
                }

                if (ignore || !participantRows || participantRows.length === 0) {
                    setConversations([]);
                    return;
                }

                const conversationIds = participantRows
                    .map(row => row.conversation_id)
                    .filter((value): value is string => Boolean(value));

                if (conversationIds.length === 0) {
                    setConversations([]);
                    return;
                }

                // Get all participants for these conversations
                const { data: allParticipants } = await supabase
                    .from('conversation_participants')
                    .select('conversation_id, user_id')
                    .in('conversation_id', conversationIds);

                const otherUserByConversation = new Map<string, string>();
                if (allParticipants) {
                    conversationIds.forEach(convId => {
                        const participants = allParticipants.filter(p => p.conversation_id === convId);
                        const otherUser = participants.find(p => p.user_id !== userId);
                        if (otherUser) {
                            otherUserByConversation.set(convId, otherUser.user_id);
                        }
                    });
                }

                const otherUserIds = Array.from(otherUserByConversation.values());
                if (otherUserIds.length === 0) {
                    setConversations([]);
                    return;
                }

                // Get profiles for other users
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url, is_online')
                    .in('id', otherUserIds);

                const profileMap = new Map<string, { name: string; username: string; avatar: string | null; isOnline: boolean }>();
                if (profiles) {
                    profiles.forEach(profile => {
                        profileMap.set(profile.id, {
                            name: profile.full_name || profile.username || 'کاربر ناشناس',
                            username: profile.username || '',
                            avatar: profile.avatar_url,
                            isOnline: profile.is_online || false,
                        });
                    });
                }

                const normalized: ConversationListItem[] = participantRows.reduce<ConversationListItem[]>(
                    (acc, row) => {
                        const conversationId = row.conversation_id;
                        if (!conversationId) return acc;

                        const conversation = Array.isArray(row.conversations) ? row.conversations[0] : row.conversations;
                        if (!conversation || !conversation.id) return acc;

                        const otherUserId = otherUserByConversation.get(conversationId);
                        const profileInfo = otherUserId ? profileMap.get(otherUserId) : undefined;

                        acc.push({
                            id: conversation.id,
                            otherUserId: otherUserId ?? 'unknown',
                            otherUserName: profileInfo?.name ?? 'کاربر ناشناس',
                            otherUserUsername: profileInfo?.username,
                            otherUserAvatar: profileInfo?.avatar ?? null,
                            lastMessage: conversation.last_message,
                            lastMessageTime: conversation.last_message_time,
                            unreadCount: 0, // TODO: Calculate from messages
                            updatedAt: conversation.updated_at ?? conversation.last_message_time ?? conversation.last_activity ?? '',
                            isOnline: profileInfo?.isOnline ?? false,
                        });

                        return acc;
                    },
                    []
                );

                // Cache the data
                conversationsCache.set(cacheKey, {
                    data: normalized,
                    timestamp: Date.now(),
                });

                if (!ignore) {
                    setConversations(normalized);
                    setIsLoading(false);
                }
            } catch (err) {
                throw err; // Re-throw to be caught by outer catch
            }
        };

        fetchConversations();

        return () => {
            ignore = true;
        };
    }, [loading, router, selectedConversationId, supabase, user]);

    const activeConversation = selectedConversationId
        ? conversations.find(conversation => conversation.id === selectedConversationId) ?? null
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

    if (!user) {
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 overflow-hidden w-full max-w-full">
            {/* Conversation List - Responsive */}
            <div
                className={cn(
                    'border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900',
                    // Desktop: Always visible, 380px width
                    'md:w-[380px] md:block',
                    // Mobile: Full screen or hidden
                    isMobile ? (showConversationList ? 'w-full' : 'hidden') : 'block'
                )}
            >
                <ConversationList
                    conversations={conversations}
                    selectedId={selectedConversationId}
                    onSelect={id => {
                        setSelectedConversationId(id);
                        if (isMobile) setShowConversationList(false);
                    }}
                />
            </div>

            {/* Chat Window - Responsive */}
            <div
                className={cn(
                    'flex-1',
                    // Mobile: Show only when conversation selected
                    isMobile ? (selectedConversationId ? 'block' : 'hidden') : 'block'
                )}
            >
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
                    // Empty state for desktop
                    !isMobile && (
                        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <div className="text-center space-y-4">
                                <svg
                                    className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-700"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                                <p className="text-lg font-medium">هیچ گفتگویی انتخاب نشده</p>
                                <p className="text-sm">یک گفتگو را از لیست انتخاب کنید</p>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
