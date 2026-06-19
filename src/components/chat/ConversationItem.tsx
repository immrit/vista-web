'use client';

import { useState, useRef } from 'react';
import { Archive, ArchiveRestore, Trash2, Pin, PinOff, BellOff, Bell } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils/formatTime';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

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
        is_archived?: boolean;
        is_pinned?: boolean;
        is_muted?: boolean;
    };
    isSelected: boolean;
    onClick: () => void;
    onArchiveToggle?: (id: string, archived: boolean) => void;
    onDelete?: (id: string) => void;
    onPinToggle?: (id: string, pinned: boolean) => void;
    onMuteToggle?: (id: string, muted: boolean) => void;
}

export function ConversationItem({ conversation, isSelected, onClick, onArchiveToggle, onDelete, onPinToggle, onMuteToggle }: ConversationItemProps) {
    const hasUnread = conversation.unreadCount > 0;
    const [showMenu, setShowMenu] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isArchived = Boolean(conversation.is_archived);
    const isPinned = Boolean(conversation.is_pinned);
    const isMuted = Boolean(conversation.is_muted);

    const openMenu = (x: number, y: number) => {
        setMenuPos({ x, y });
        setShowMenu(true);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        openMenu(e.clientX, e.clientY);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        longPressTimer.current = setTimeout(() => {
            openMenu(touch.clientX, touch.clientY);
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const handlePin = async () => {
        setShowMenu(false);
        try {
            await apiClient.post(`/v1/chat/conversations/${conversation.id}/pin`, { pinned: !isPinned });
            onPinToggle?.(conversation.id, !isPinned);
            toast.success(isPinned ? 'از سنجاق خارج شد' : 'سنجاق شد');
        } catch { toast.error('خطا'); }
    };

    const handleMute = async () => {
        setShowMenu(false);
        try {
            await apiClient.post(`/v1/chat/conversations/${conversation.id}/mute`, { muted: !isMuted });
            onMuteToggle?.(conversation.id, !isMuted);
            toast.success(isMuted ? 'اعلان‌ها فعال شد' : 'اعلان‌ها خاموش شد');
        } catch { toast.error('خطا'); }
    };

    const handleArchive = async () => {
        setShowMenu(false);
        try {
            await apiClient.post(`/v1/chat/conversations/${conversation.id}/archive`, { archived: !isArchived });
            onArchiveToggle?.(conversation.id, !isArchived);
            toast.success(isArchived ? 'از آرشیو خارج شد' : 'آرشیو شد');
        } catch {
            toast.error('خطا');
        }
    };

    const handleDelete = async () => {
        setShowMenu(false);
        if (!confirm('این گفتگو حذف شود؟')) return;
        try {
            await apiClient.delete(`/v1/chat/conversations/${conversation.id}`);
            onDelete?.(conversation.id);
            toast.success('گفتگو حذف شد');
        } catch {
            toast.error('خطا در حذف');
        }
    };

    return (
        <>
        {showMenu && (
            <>
                <div className="fixed inset-0 z-50" onClick={() => setShowMenu(false)} />
                <div
                    className="fixed z-[60] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl py-2 min-w-[180px]"
                    style={{ top: menuPos.y, left: menuPos.x, transform: 'translate(-50%, 8px)' }}
                >
                    <button
                        onClick={handlePin}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                        {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        {isPinned ? 'برداشتن سنجاق' : 'سنجاق کردن'}
                    </button>
                    <button
                        onClick={handleMute}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                        {isMuted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        {isMuted ? 'فعال کردن اعلان' : 'خاموش کردن اعلان'}
                    </button>
                    <button
                        onClick={handleArchive}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                        {isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                        {isArchived ? 'خروج از آرشیو' : 'آرشیو'}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <Trash2 className="w-4 h-4" />
                        حذف گفتگو
                    </button>
                </div>
            </>
        )}
        <button
            onClick={onClick}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd}
            className={cn(
                'w-full p-3.5 flex items-center gap-3 transition active:scale-[0.99]',
                isSelected
                    ? 'bg-indigo-500/10 dark:bg-indigo-500/15'
                    : 'hover:bg-vista-surface-variant/80 dark:hover:bg-vista-surface-variant-dark/80',
            )}
        >
            {/* Avatar with Online Status */}
            <div className="relative flex-shrink-0">
                <Avatar
                    src={conversation.otherUserAvatar}
                    alt={conversation.otherUserName}
                    size="lg"
                    className={cn(hasUnread && 'ring-2 ring-indigo-500')}
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
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isPinned && <Pin className="w-3 h-3 text-vista-primary" />}
                        {isMuted && <BellOff className="w-3 h-3 text-zinc-400" />}
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(conversation.lastMessageTime)}</span>
                    </div>
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
        </>
    );
}








