'use client';

import { useState } from 'react';
import { Check, CheckCheck, Reply, Edit2, Trash2 } from 'lucide-react';
import { Message } from '@/lib/models/message';
import { formatTime } from '@/lib/utils/formatTime';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
    message: Message;
    replyToMessage?: Message | null;
    onReply?: (messageId: string) => void;
    onEdit?: (messageId: string) => void;
    onDelete?: (messageId: string) => void;
    conversationId: string;
    currentUserId: string;
}

export function MessageBubble({
    message,
    replyToMessage,
    onReply,
    onEdit,
    onDelete,
    conversationId,
    currentUserId,
}: MessageBubbleProps) {
    const [showActions, setShowActions] = useState(false);
    const isOwnMessage = message.senderId === currentUserId;

    return (
        <div
            className={cn('flex w-full', isOwnMessage ? 'justify-start' : 'justify-end')}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="group relative max-w-[85%] sm:max-w-[75%] md:max-w-[70%]">
                <div className="flex flex-col min-w-[60px] max-w-full">
                    {/* Reply Preview */}
                    {replyToMessage && (
                        <div
                            className={cn(
                                'mb-1 px-3 py-2 rounded-lg text-xs border-r-2',
                                isOwnMessage
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                    : 'bg-gray-100 dark:bg-zinc-800 border-gray-400 dark:border-gray-600'
                            )}
                        >
                            <p className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                                {replyToMessage.senderId === currentUserId ? 'شما' : 'کاربر'}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 truncate">{replyToMessage.content}</p>
                        </div>
                    )}

                    {/* Message Bubble */}
                    <div
                        className={cn(
                            'rounded-2xl px-3 sm:px-4 py-2 break-words',
                            isOwnMessage
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-bl-none'
                        )}
                    >
                        {/* Message Content */}
                        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>

                        {/* Time & Status */}
                        <div
                            className={cn(
                                'flex items-center gap-1 mt-1 text-xs',
                                isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                            )}
                        >
                            <span>{formatTime(message.createdAt)}</span>
                            {isOwnMessage && (
                                <>
                                    {message.isRead ? (
                                        <CheckCheck className="w-3 h-3" />
                                    ) : (
                                        <Check className="w-3 h-3" />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Menu */}
                {showActions && (
                    <div
                        className={cn(
                            'absolute top-0 flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-10',
                            isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'
                        )}
                    >
                        {onReply && (
                            <button
                                onClick={() => onReply(message.id)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                                title="پاسخ"
                            >
                                <Reply className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                        )}
                        {isOwnMessage && onEdit && (
                            <button
                                onClick={() => onEdit(message.id)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                                title="ویرایش"
                            >
                                <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                        )}
                        {isOwnMessage && onDelete && (
                            <button
                                onClick={() => onDelete(message.id)}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                                title="حذف"
                            >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

