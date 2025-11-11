'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils/formatTime';
import { cn } from '@/lib/utils';

interface ConversationItemProps {
    conversation: {
        id: string;
        otherUserId: string;
        otherUserName: string;
        otherUserAvatar?: string | null;
        lastMessage?: string | null;
        lastMessageTime?: string | null;
        unreadCount: number;
        updatedAt: string;
        isOnline?: boolean;
    };
    isSelected: boolean;
    onClick: () => void;
}

export function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
    const hasUnread = conversation.unreadCount > 0;

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition active:scale-[0.98]',
                isSelected && 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            )}
        >
            {/* Avatar with Online Status */}
            <div className="relative flex-shrink-0">
                <Avatar
                    src={conversation.otherUserAvatar}
                    alt={conversation.otherUserName}
                    size="lg"
                    className={cn(hasUnread && 'ring-2 ring-blue-500')}
                />
                {conversation.isOnline && (
                    <div className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <h3
                        className={cn(
                            'text-sm font-medium truncate',
                            hasUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                        )}
                    >
                        {conversation.otherUserName}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {formatRelativeTime(conversation.lastMessageTime)}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p
                        className={cn(
                            'text-sm truncate',
                            hasUnread
                                ? 'text-gray-900 dark:text-white font-medium'
                                : 'text-gray-500 dark:text-gray-400'
                        )}
                    >
                        {conversation.lastMessage || 'هنوز پیامی ارسال نشده'}
                    </p>
                    {hasUnread && <Badge count={conversation.unreadCount} />}
                </div>
            </div>
        </button>
    );
}

