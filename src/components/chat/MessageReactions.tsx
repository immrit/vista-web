'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Reaction {
    emoji: string;
    user_ids: string[];
}

interface MessageReactionsProps {
    reactions: Reaction[];
    messageId: string;
    conversationId: string;
    currentUserId: string;
}

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

export function MessageReactions({
    reactions,
    messageId,
    conversationId,
    currentUserId,
}: MessageReactionsProps) {
    const [showPicker, setShowPicker] = useState(false);
    const supabase = createClient();

    const handleReaction = async (emoji: string) => {
        try {
            // Check if user already reacted with this emoji
            const existingReaction = reactions.find(r => r.user_ids.includes(currentUserId));

            if (existingReaction && existingReaction.emoji === emoji) {
                // Remove reaction
                await supabase
                    .from('message_reactions')
                    .delete()
                    .eq('message_id', messageId)
                    .eq('user_id', currentUserId)
                    .eq('emoji', emoji);
            } else {
                // Add or update reaction
                await supabase.from('message_reactions').upsert({
                    message_id: messageId,
                    conversation_id: conversationId,
                    user_id: currentUserId,
                    emoji,
                });
            }

            setShowPicker(false);
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    };

    return (
        <div className="flex flex-wrap gap-1 mt-1 relative">
            {reactions.map((reaction, index) => (
                <button
                    key={index}
                    onClick={() => handleReaction(reaction.emoji)}
                    className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-full text-xs transition',
                        reaction.user_ids.includes(currentUserId)
                            ? 'bg-blue-100 dark:bg-blue-900/30'
                            : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    )}
                >
                    <span>{reaction.emoji}</span>
                    <span className="text-gray-600 dark:text-gray-400">{reaction.user_ids.length}</span>
                </button>
            ))}

            {/* Add Reaction Button */}
            <button
                onClick={() => setShowPicker(!showPicker)}
                className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full text-xs transition"
            >
                +
            </button>

            {/* Quick Reaction Picker */}
            {showPicker && (
                <div className="absolute bottom-full mb-2 left-0 flex gap-1 p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-20">
                    {QUICK_REACTIONS.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => handleReaction(emoji)}
                            className="text-xl hover:scale-125 transition"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

