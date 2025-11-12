'use client';

import { Reply, Edit2, Trash2, Copy, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageContextMenuProps {
    isOwn: boolean;
    onReply: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onCopy: () => void;
    onReact: () => void;
    className?: string;
}

export function MessageContextMenu({
    isOwn,
    onReply,
    onEdit,
    onDelete,
    onCopy,
    onReact,
    className,
}: MessageContextMenuProps) {
    return (
        <div
            className={cn(
                'absolute top-full mt-2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-10 min-w-[180px]',
                className
            )}
        >
            <div className="p-2 space-y-1">
                <button
                    onClick={onReact}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition text-right"
                >
                    <Smile className="w-4 h-4" />
                    <span className="text-sm">واکنش</span>
                </button>
                <button
                    onClick={onReply}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition text-right"
                >
                    <Reply className="w-4 h-4" />
                    <span className="text-sm">پاسخ</span>
                </button>
                <button
                    onClick={onCopy}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition text-right"
                >
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">کپی</span>
                </button>
                {isOwn && (
                    <>
                        <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-1" />
                        <button
                            onClick={onEdit}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition text-right"
                        >
                            <Edit2 className="w-4 h-4" />
                            <span className="text-sm">ویرایش</span>
                        </button>
                        <button
                            onClick={onDelete}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition text-right text-red-600 dark:text-red-400"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm">حذف</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}


