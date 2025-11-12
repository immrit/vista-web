'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
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
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    // Filtered conversations
    const filteredConversations = useMemo(() => {
        let filtered = conversations;

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(conv =>
                conv.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Type filter
        if (filter === 'unread') {
            filtered = filtered.filter(conv => conv.unreadCount > 0);
        }

        // Sort by updatedAt (newest first)
        return filtered.sort((a, b) => {
            const dateA = new Date(a.updatedAt).getTime();
            const dateB = new Date(b.updatedAt).getTime();
            return dateB - dateA;
        });
    }, [conversations, searchQuery, filter]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">پیام‌ها</h1>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="جستجو در گفتگوها..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border border-transparent focus:border-blue-500 dark:focus:border-blue-400 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none transition"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2 mt-3">
                    {(['all', 'unread'] as const).map(filterType => (
                        <button
                            key={filterType}
                            onClick={() => setFilter(filterType)}
                            className={cn(
                                'px-4 py-1.5 rounded-full text-sm font-medium transition',
                                filter === filterType
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                            )}
                        >
                            {filterType === 'all' ? 'همه' : 'خوانده نشده'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <p>گفتگویی یافت نشد</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
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



