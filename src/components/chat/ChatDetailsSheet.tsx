'use client';

import { useState, useEffect } from 'react';
import { X, Search, Image as ImageIcon, Video, Music, File, Bell, BellOff, UserX, Trash2, Share2, User } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/apiClient';

interface ChatDetailsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: any;
    profile: any;
    currentUserId: string;
}

export function ChatDetailsSheet({
    isOpen,
    onClose,
    conversation,
    profile,
    currentUserId,
}: ChatDetailsSheetProps) {
    const [activeTab, setActiveTab] = useState<'media' | 'files'>('media');
    const [isMuted, setIsMuted] = useState(false);
    const [sharedMedia, setSharedMedia] = useState<any[]>([]);
    const [sharedFiles, setSharedFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch shared media/files
    useEffect(() => {
        if (isOpen && conversation) {
            fetchSharedContent();
        }
    }, [isOpen, conversation]);

    const fetchSharedContent = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get<{ messages?: any[] }>(
                `/v1/chat/conversations/${conversation.id}/messages?limit=50`
            );

            const media: any[] = [];
            const files: any[] = [];

            response.messages?.forEach(msg => {
                const url = msg.attachment_url || msg.media_url;
                const type = msg.attachment_type || msg.message_type;
                if (url) {

                    if (type === 'image' || type === 'video') {
                        media.push({
                            url,
                            type,
                            created_at: msg.created_at,
                        });
                    } else {
                        files.push({
                            url,
                            name: url.split('/').pop(),
                            created_at: msg.created_at,
                        });
                    }
                }
            });

            setSharedMedia(media);
            setSharedFiles(files);
        } catch (error) {
            console.error('Error fetching shared content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMuteToggle = async () => {
        try {
            await apiClient.post(`/v1/chat/conversations/${conversation.id}/mute`);
            setIsMuted(!isMuted);
        } catch (error) {
            console.error('Error toggling mute:', error);
        }
    };

    const handleBlockUser = async () => {
        if (!confirm('آیا از مسدود کردن این کاربر اطمینان دارید؟')) return;

        try {
            await apiClient.post('/v1/me/block', {
                target_user_id: profile?.id || profile?.user_id,
            });
            alert('کاربر مسدود شد');
            onClose();
        } catch (error) {
            console.error('Error blocking user:', error);
        }
    };

    const handleDeleteConversation = async () => {
        if (!confirm('آیا از حذف این گفتگو اطمینان دارید؟ تمام پیام‌ها حذف خواهند شد.')) return;

        try {
            await apiClient.delete(`/v1/chat/conversations/${conversation.id}`);
            alert('گفتگو حذف شد');
            onClose();
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-40 animate-fadeIn" onClick={onClose} />

            {/* Sheet */}
            <div
                className={cn(
                    'fixed top-0 left-0 h-full w-full md:w-[400px] bg-white dark:bg-zinc-900 z-50 shadow-2xl',
                    'transform transition-transform duration-300',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">جزئیات چت</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto h-[calc(100%-64px)]">
                    {/* Profile Section */}
                    <div className="p-6 text-center border-b border-zinc-200 dark:border-zinc-800">
                        <div className="relative inline-block mb-4">
                            <Avatar
                                src={profile?.avatar_url}
                                alt={profile?.full_name || profile?.username}
                                size="xl"
                                className="mx-auto"
                            />
                            {profile?.is_online && (
                                <div className="absolute bottom-2 left-2 w-5 h-5 bg-green-500 border-4 border-white dark:border-zinc-900 rounded-full" />
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {profile?.full_name || profile?.username}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">@{profile?.username}</p>
                        {profile?.bio && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{profile?.bio}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {profile?.is_online ? 'آنلاین' : `آخرین بازدید ${profile?.last_seen || 'نامشخص'}`}
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="p-4 space-y-2 border-b border-zinc-200 dark:border-zinc-800">
                        <button
                            onClick={handleMuteToggle}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition text-right"
                        >
                            {isMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                            <span className="text-gray-900 dark:text-white">
                                {isMuted ? 'فعال کردن اعلان‌ها' : 'بی‌صدا کردن'}
                            </span>
                        </button>
                        {profile?.username && (
                            <button
                                onClick={() => (window.location.href = `/profile/${profile.username}`)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition text-right"
                            >
                                <User className="w-5 h-5" />
                                <span className="text-gray-900 dark:text-white">مشاهده پروفایل</span>
                            </button>
                        )}
                        <button
                            onClick={() => {
                                /* TODO: Search in conversation */
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition text-right"
                        >
                            <Search className="w-5 h-5" />
                            <span className="text-gray-900 dark:text-white">جستجو در گفتگو</span>
                        </button>
                    </div>

                    {/* Shared Media & Files */}
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                        {/* Tab Switcher */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setActiveTab('media')}
                                className={cn(
                                    'flex-1 px-4 py-2 rounded-lg font-medium transition',
                                    activeTab === 'media'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                                )}
                            >
                                رسانه ({sharedMedia.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('files')}
                                className={cn(
                                    'flex-1 px-4 py-2 rounded-lg font-medium transition',
                                    activeTab === 'files'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                                )}
                            >
                                فایل‌ها ({sharedFiles.length})
                            </button>
                        </div>

                        {/* Content */}
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                            </div>
                        ) : activeTab === 'media' ? (
                            <div className="grid grid-cols-3 gap-2">
                                {sharedMedia.length === 0 ? (
                                    <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
                                        هیچ رسانه‌ای به اشتراک گذاشته نشده
                                    </div>
                                ) : (
                                    sharedMedia.map((item, index) => (
                                        <div
                                            key={index}
                                            className="aspect-square bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition"
                                            onClick={() => item.url && window.open(item.url, '_blank')}
                                        >
                                            {item.type === 'image' ? (
                                                <img src={item.url} alt="Media" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Video className="w-8 h-8 text-purple-500" />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {sharedFiles.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        هیچ فایلی به اشتراک گذاشته نشده
                                    </div>
                                ) : (
                                    sharedFiles.map((file, index) => (
                                        <a
                                            key={index}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
                                        >
                                            <File className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(file.created_at).toLocaleDateString('fa-IR')}
                                                </p>
                                            </div>
                                        </a>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Danger Zone */}
                    <div className="p-4 space-y-2">
                        <button
                            onClick={handleBlockUser}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-right text-red-600 dark:text-red-400"
                        >
                            <UserX className="w-5 h-5" />
                            <span>مسدود کردن کاربر</span>
                        </button>
                        <button
                            onClick={handleDeleteConversation}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-right text-red-600 dark:text-red-400"
                        >
                            <Trash2 className="w-5 h-5" />
                            <span>حذف گفتگو</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
