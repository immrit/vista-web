'use client';

import { useState } from 'react';
import { Check, CheckCheck, MoreVertical, Clock } from 'lucide-react';
import { Message } from '@/lib/models/message';
import { formatMessageTime } from '@/lib/utils/formatTime';
import { MessageReactions } from './MessageReactions';
import { MessageContextMenu } from './MessageContextMenu';
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
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);

    const isOwn = message.isMe;
    const reactions = message.reactions || [];

    const handleEdit = async () => {
        if (editContent.trim() && editContent !== message.content) {
            onEdit?.(message.id);
            setIsEditing(false);
        }
    };

    const handleDelete = async () => {
        if (confirm('آیا از حذف این پیام اطمینان دارید؟')) {
            await onDelete?.(message.id);
        }
        setShowMenu(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setShowMenu(false);
    };

    const statusIcon = !message.isSent ? (
        <Clock className="w-4 h-4 text-gray-400 animate-pulse" />
    ) : message.isRead ? (
        <CheckCheck className="w-4 h-4 text-blue-500" />
    ) : message.isDelivered ? (
        <CheckCheck className="w-4 h-4 text-gray-400" />
    ) : (
        <Check className="w-4 h-4 text-gray-400" />
    );

    return (
        <div className={cn('flex gap-2 group', isOwn ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'relative max-w-[75%] rounded-2xl px-4 py-2',
                    isOwn
                        ? 'bg-indigo-600 text-white rounded-tl-sm' // لبه تیز در بالا-چپ (گوشه راست صفحه)
                        : 'bg-zinc-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 rounded-tr-sm' // لبه تیز در بالا-راست (گوشه چپ صفحه)
                )}
            >
                {/* Reply Preview */}
                {replyToMessage && (
                    <div
                        className={cn(
                            'mb-2 pb-2 border-r-2 pr-2 text-xs',
                            isOwn ? 'border-white/30' : 'border-indigo-500/30'
                        )}
                    >
                        <div className="font-medium opacity-80">
                            {replyToMessage.isMe ? 'شما' : replyToMessage.senderId}
                        </div>
                        <div className="opacity-60 line-clamp-1">{replyToMessage.content}</div>
                    </div>
                )}

                {/* Editing Mode */}
                {isEditing ? (
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleEdit();
                                if (e.key === 'Escape') setIsEditing(false);
                            }}
                            className="w-full bg-transparent border-b border-white/30 outline-none"
                            autoFocus
                        />
                        <div className="flex gap-2 text-xs">
                            <button onClick={handleEdit} className="hover:underline">
                                ذخیره
                            </button>
                            <button onClick={() => setIsEditing(false)} className="hover:underline">
                                لغو
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Content */}
                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>

                        {/* Media Attachments */}
                        {message.attachmentUrl && (
                            <div className="mt-2 space-y-2">
                                {message.attachmentType === 'image' ? (
                                    <img
                                        src={message.attachmentUrl}
                                        alt="Media"
                                        className="max-w-full h-auto cursor-pointer hover:opacity-90 transition rounded-lg"
                                        onClick={() => window.open(message.attachmentUrl, '_blank')}
                                    />
                                ) : message.attachmentType === 'video' ? (
                                    <video src={message.attachmentUrl} controls className="max-w-full h-auto rounded-lg" />
                                ) : message.attachmentType === 'audio' ? (
                                    <audio src={message.attachmentUrl} controls className="w-full" />
                                ) : (
                                    <a
                                        href={message.attachmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0017.414 6L14 2.586A2 2 0 0012.586 2H8z" />
                                        </svg>
                                        <span className="text-sm">فایل ضمیمه</span>
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Message Info */}
                        <div
                            className={cn(
                                'flex items-center gap-1 mt-1 text-xs',
                                isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                            )}
                        >
                            <span>{formatMessageTime(message.createdAt)}</span>
                            {message.updatedAt && message.updatedAt !== message.createdAt && (
                                <span>(ویرایش شده)</span>
                            )}
                            {isOwn && statusIcon}
                        </div>
                    </>
                )}

                {/* Reactions */}
                {reactions.length > 0 && (
                    <MessageReactions
                        reactions={reactions}
                        messageId={message.id}
                        conversationId={conversationId}
                        currentUserId={currentUserId}
                    />
                )}

                {/* Context Menu Button */}
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className={cn(
                        'absolute top-2 p-1 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition',
                        isOwn ? 'left-2' : 'right-2'
                    )}
                >
                    <MoreVertical className="w-4 h-4" />
                </button>

                {/* Context Menu */}
                {showMenu && (
                    <MessageContextMenu
                        isOwn={isOwn}
                        onReply={() => {
                            onReply?.(message.id);
                            setShowMenu(false);
                        }}
                        onEdit={() => {
                            setIsEditing(true);
                            setShowMenu(false);
                        }}
                        onDelete={handleDelete}
                        onCopy={handleCopy}
                        onReact={() => {
                            setShowMenu(false);
                        }}
                        className={isOwn ? 'left-0' : 'right-0'}
                    />
                )}
            </div>
        </div>
    );
}

