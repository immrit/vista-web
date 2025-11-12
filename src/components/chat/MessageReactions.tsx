'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { soundManager } from '@/lib/audio/NotificationSounds';
import { Smile } from 'lucide-react';

interface Reaction {
    id: string;
    emoji: string;
    user_id: string;
    message_id: string;
    created_at: string;
}

interface MessageReactionsProps {
    reactions: Array<{ emoji: string; user_ids: string[] }>;
    messageId: string;
    conversationId: string;
    currentUserId: string;
    isOwnMessage?: boolean;
}

const EMOJI_LIST = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

export function MessageReactions({
    reactions,
    messageId,
    conversationId,
    currentUserId,
    isOwnMessage = false,
}: MessageReactionsProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [reactionList, setReactionList] = useState<Reaction[]>([]);
    const pickerRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Fetch reactions from database
    useEffect(() => {
        fetchReactions();

        // Real-time subscription for reactions
        const channel = supabase
            .channel(`message-reactions:${messageId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'message_reactions',
                    filter: `message_id=eq.${messageId}`,
                },
                (payload) => {
                    fetchReactions();
                    if (payload.eventType === 'INSERT') {
                        soundManager.playReaction();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [messageId, supabase]);

    const fetchReactions = async () => {
        try {
            const { data, error } = await supabase
                .from('message_reactions')
                .select('*')
                .eq('message_id', messageId);

            if (!error && data) {
                setReactionList(data);
            }
        } catch (error) {
            console.error('Error fetching reactions:', error);
        }
    };

    // Group reactions by emoji with count
    const groupedReactions = reactionList.reduce(
        (acc, reaction) => {
            if (!acc[reaction.emoji]) {
                acc[reaction.emoji] = {
                    emoji: reaction.emoji,
                    count: 0,
                    user_ids: [],
                };
            }
            acc[reaction.emoji].count += 1;
            acc[reaction.emoji].user_ids.push(reaction.user_id);
            return acc;
        },
        {} as Record<string, { emoji: string; count: number; user_ids: string[] }>
    );

    const handleReaction = async (emoji: string) => {
        try {
            // Check if user already reacted with this emoji
            const existingReaction = reactionList.find(
                (r) => r.emoji === emoji && r.user_id === currentUserId
            );

            if (existingReaction) {
                // Remove reaction
                await supabase.from('message_reactions').delete().eq('id', existingReaction.id);
            } else {
                // Add new reaction
                await supabase.from('message_reactions').insert({
                    message_id: messageId,
                    user_id: currentUserId,
                    emoji: emoji,
                });
            }

            setShowPicker(false);
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    };

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowPicker(false);
            }
        };

        if (showPicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showPicker]);

    const reactionEntries = Object.values(groupedReactions);

    return (
        <div
            ref={pickerRef}
            className="flex items-center gap-1 relative"
        >
            {/* Display grouped reactions */}
            {reactionEntries.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                    {reactionEntries.map((reaction) => {
                        const hasReacted = reaction.user_ids.includes(currentUserId);

                        return (
                            <button
                                key={reaction.emoji}
                                onClick={() => handleReaction(reaction.emoji)}
                                className={cn(
                                    'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs',
                                    'transition-all duration-200',
                                    isOwnMessage
                                        ? hasReacted
                                            ? 'bg-white/20 dark:bg-white/10 ring-1 ring-white/30'
                                            : 'bg-white/10 dark:bg-zinc-700/50 hover:bg-white/20 dark:hover:bg-zinc-700'
                                        : hasReacted
                                            ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-1 ring-indigo-300 dark:ring-indigo-700'
                                            : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                                )}
                            >
                                <span className="text-sm">{reaction.emoji}</span>
                                {reaction.count > 1 && (
                                    <span
                                        className={cn(
                                            'text-[10px] font-medium',
                                            isOwnMessage
                                                ? hasReacted
                                                    ? 'text-white/90'
                                                    : 'text-white/70 dark:text-zinc-300'
                                                : hasReacted
                                                    ? 'text-indigo-700 dark:text-indigo-300'
                                                    : 'text-zinc-600 dark:text-zinc-400'
                                        )}
                                    >
                                        {reaction.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Reaction Button - Show on hover */}
            <button
                onClick={() => setShowPicker(!showPicker)}
                className={cn(
                    'opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full',
                    'hover:bg-white/20 dark:hover:bg-zinc-700/50',
                    showPicker && 'opacity-100'
                )}
                title="واکنش"
            >
                <Smile
                    className={cn(
                        'w-3.5 h-3.5',
                        isOwnMessage
                            ? 'text-white/90'
                            : 'text-zinc-600 dark:text-zinc-400'
                    )}
                />
            </button>

            {/* Emoji Picker */}
            {showPicker && (
                <div
                    className={cn(
                        'absolute z-50 mt-2',
                        isOwnMessage ? 'left-0' : 'right-0',
                        'bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl',
                        'border border-zinc-200 dark:border-zinc-700 p-3',
                        'animate-in fade-in zoom-in-95 duration-200',
                        'backdrop-blur-xl'
                    )}
                >
                    {/* Title */}
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 px-1">
                        واکنش خود را انتخاب کنید
                    </div>

                    {/* Emojis Grid */}
                    <div className="grid grid-cols-4 gap-2">
                        {EMOJI_LIST.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => handleReaction(emoji)}
                                className="text-2xl hover:scale-125 transition-all duration-200 active:scale-95 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
