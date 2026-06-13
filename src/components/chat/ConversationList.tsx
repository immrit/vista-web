'use client';

import { useMemo } from 'react';
import { ConversationItem } from './ConversationItem';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string | null;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  unreadCount: number;
  updatedAt: string;
  isOnline?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  compact?: boolean;
  filter?: 'all' | 'unread';
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  compact = false,
  filter = 'all',
}: ConversationListProps) {
  const filteredConversations = useMemo(() => {
    let filtered = conversations;
    if (filter === 'unread') {
      filtered = filtered.filter(conv => conv.unreadCount > 0);
    }
    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [conversations, filter]);

  return (
    <div className={cn('flex flex-col', compact ? 'min-h-0' : 'h-full')}>
      <div className={cn('flex-1 overflow-y-auto', compact && 'min-h-0')}>
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-vista-text-secondary text-sm">
            <p>گفتگویی یافت نشد</p>
          </div>
        ) : (
          <div className="divide-y divide-vista-border dark:divide-vista-border-dark">
            {filteredConversations.map(conversation => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedId}
                onClick={() => onSelect(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
