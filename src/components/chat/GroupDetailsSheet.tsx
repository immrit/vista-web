'use client';

import { useState, useEffect } from 'react';
import { X, Search, Bell, BellOff, Trash2, Share2, Users, UserPlus, Copy, ShieldAlert, LogOut } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { groupApi, GroupConversation, GroupMember } from '@/lib/groupApi';

interface GroupDetailsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: any;
    currentUserId: string;
}

export function GroupDetailsSheet({
    isOpen,
    onClose,
    conversation,
    currentUserId,
}: GroupDetailsSheetProps) {
    const [isMuted, setIsMuted] = useState(false);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [groupDetails, setGroupDetails] = useState<GroupConversation | null>(null);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && conversation?.id) {
            fetchMembers();
        }
    }, [isOpen, conversation]);

    const fetchMembers = async () => {
        setLoadingMembers(true);
        try {
            const [details, data] = await Promise.all([
                groupApi.getGroupInfo(conversation.id).catch(() => null),
                groupApi.listMembers(conversation.id),
            ]);
            setGroupDetails(details);
            setMembers(data);
        } catch (error) {
            console.error('Error fetching group members:', error);
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleCopyInviteLink = () => {
        const group = groupDetails || conversation;
        if (!group?.invite_code) return;
        
        const publicLink = `${window.location.origin}/group/${encodeURIComponent(group.invite_code)}`;
        navigator.clipboard.writeText(publicLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleLeaveGroup = async () => {
        if (!confirm('آیا از خروج از این گروه اطمینان دارید؟')) return;

        try {
            await groupApi.leaveGroup(conversation.id);
            alert('شما از گروه خارج شدید');
            window.location.href = '/messages';
        } catch (error) {
            console.error('Error leaving group:', error);
            alert('خطا در خروج از گروه');
        }
    };

    const handleDeleteGroup = async () => {
        if (!confirm('آیا از حذف این گروه اطمینان دارید؟ تمام پیام‌ها و اعضا حذف خواهند شد.')) return;

        try {
            await groupApi.deleteGroup(conversation.id);
            alert('گروه با موفقیت حذف شد');
            window.location.href = '/messages';
        } catch (error) {
            console.error('Error deleting group:', error);
            alert('خطا در حذف گروه');
        }
    };

    if (!isOpen) return null;

    const group = groupDetails || conversation;
    const isAdmin = group?.created_by === currentUserId;

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
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">اطلاعات گروه</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto h-[calc(100%-64px)]">
                    {/* Group Header Info */}
                    <div className="p-6 text-center border-b border-zinc-200 dark:border-zinc-800 relative">
                        <div className="relative inline-block mb-4">
                            <Avatar
                                src={group?.image}
                                alt={conversation?.name || 'گروه'}
                                size="xl"
                                className="mx-auto"
                            />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {conversation?.name || 'گروه ویستا'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center justify-center gap-1">
                            <Users className="w-4 h-4" />
                            {members.length > 0 ? members.length : conversation?.member_count || 1} عضو
                            {conversation?.max_members ? ` (از ${conversation.max_members})` : ''}
                        </p>
                        
                        {group?.invite_code && (
                            <div className="mt-4 inline-flex items-center justify-center w-full">
                                <button
                                    onClick={handleCopyInviteLink}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium w-full justify-center"
                                >
                                    {copied ? <Share2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'کپی شد!' : 'کپی لینک دعوت'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="p-4 space-y-2 border-b border-zinc-200 dark:border-zinc-800">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition text-right"
                        >
                            {isMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                            <span className="text-gray-900 dark:text-white">
                                {isMuted ? 'فعال کردن اعلان‌ها' : 'بی‌صدا کردن'}
                            </span>
                        </button>
                        <button
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition text-right"
                        >
                            <Search className="w-5 h-5" />
                            <span className="text-gray-900 dark:text-white">جستجو در گفتگو</span>
                        </button>
                    </div>

                    {/* Members List */}
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">اعضای گروه</h4>
                            {isAdmin && (
                                <button className="text-blue-500 hover:text-blue-600 p-1">
                                    <UserPlus className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        
                        {loadingMembers ? (
                            <div className="text-center py-4 text-gray-500 text-sm">در حال بارگذاری اعضا...</div>
                        ) : members.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 text-sm">عضوی یافت نشد.</div>
                        ) : (
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                {members.map((member) => (
                                    <div key={member.user_id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                src={member.avatar_url}
                                                alt={member.full_name || member.username || 'کاربر'}
                                                size="sm"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {member.user_id === currentUserId ? 'شما' : (member.full_name || member.username || 'کاربر')}
                                                </p>
                                                {member.is_admin && (
                                                    <span className="text-[10px] text-blue-500 font-medium">مدیر گروه</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Danger Zone */}
                    <div className="p-4 space-y-2 mb-8">
                        <button
                            onClick={handleLeaveGroup}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-right text-red-600 dark:text-red-400"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>خروج از گروه</span>
                        </button>
                        
                        {isAdmin && (
                            <button
                                onClick={handleDeleteGroup}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-right text-red-600 dark:text-red-400"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span>حذف کامل گروه</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
