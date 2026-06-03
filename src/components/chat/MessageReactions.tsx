'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Smile } from 'lucide-react';
import { soundManager } from '@/lib/audio/NotificationSounds';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  message_id: string;
  conversation_id?: string;
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
  currentUserId,
  isOwnMessage = false,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [reactionList, setReactionList] = useState<Reaction[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  const fetchReactions = async () => {
    try {
      const response = await apiClient.get<{ reactions?: Reaction[] }>(`/v1/chat/messages/${messageId}/reactions`);
      setReactionList(response.reactions || []);
    } catch (error) {
      console.error('Error fetching reactions:', error);
      setReactionList(
        reactions.flatMap((reaction, index) =>
          reaction.user_ids.map((userId, userIndex) => ({
            id: `${messageId}-${index}-${userIndex}`,
            emoji: reaction.emoji,
            user_id: userId,
            message_id: messageId,
            created_at: new Date().toISOString(),
          })),
        ),
      );
    }
  };

  useEffect(() => {
    fetchReactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

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

  const reactionEntries = useMemo(() => {
    const grouped = reactionList.reduce(
      (acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = { emoji: reaction.emoji, count: 0, user_ids: [] as string[] };
        }
        acc[reaction.emoji].count += 1;
        acc[reaction.emoji].user_ids.push(reaction.user_id);
        return acc;
      },
      {} as Record<string, { emoji: string; count: number; user_ids: string[] }>,
    );

    return Object.values(grouped);
  }, [reactionList]);

  const handleReaction = async (emoji: string) => {
    try {
      await apiClient.post(`/v1/chat/messages/${messageId}/reactions`, { emoji });
      await fetchReactions();
      soundManager.playReaction();
      setShowPicker(false);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  return (
    <div ref={pickerRef} className="flex items-center gap-1 relative">
      {reactionEntries.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {reactionEntries.map((reaction) => {
            const hasReacted = reaction.user_ids.includes(currentUserId);

            return (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                className={cn(
                  'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-all duration-200',
                  isOwnMessage
                    ? hasReacted
                      ? 'bg-white/20 dark:bg-white/10 ring-1 ring-white/30'
                      : 'bg-white/10 dark:bg-zinc-700/50 hover:bg-white/20 dark:hover:bg-zinc-700'
                    : hasReacted
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-1 ring-indigo-300 dark:ring-indigo-700'
                      : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600',
                )}
              >
                <span className="text-sm">{reaction.emoji}</span>
                {reaction.count > 1 && <span className="text-[10px] font-medium">{reaction.count}</span>}
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setShowPicker(!showPicker)}
        className={cn(
          'p-1 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100',
          showPicker && 'opacity-100',
          isOwnMessage
            ? 'hover:bg-white/20 text-white/70 hover:text-white'
            : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
        )}
      >
        <Smile className="w-4 h-4" />
      </button>

      {showPicker && (
        <div className="absolute bottom-full mb-2 flex gap-1 p-2 rounded-full bg-white dark:bg-zinc-800 shadow-lg border border-zinc-200 dark:border-zinc-700 z-50">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 transition text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
