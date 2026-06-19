'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Flag, MessageCircle, MoreHorizontal, Pencil, Pin, PinOff, Search, Send, Trash2, X } from 'lucide-react';
import { postApi } from '@/lib/backendApi';
import { apiClient } from '@/lib/apiClient';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from 'sonner';

const REPORT_REASONS = [
  { value: 'inappropriate', label: 'محتوای نامناسب' },
  { value: 'spam', label: 'اسپم یا تبلیغات' },
  { value: 'violence', label: 'خشونت یا آزار' },
  { value: 'fake', label: 'حساب جعلی یا کلاهبرداری' },
  { value: 'copyright', label: 'نقض حق مؤلف' },
  { value: 'other', label: 'سایر' },
];

interface PostMenuProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    image_url?: string | null;
    video_url?: string | null;
    music_url?: string | null;
    is_pinned?: boolean;
  };
  currentUserId: string;
  onPostDeleted?: () => void;
  onEdit?: () => void;
  onPinToggled?: (isPinned: boolean) => void;
}

interface ChatConv {
  id: string;
  name: string;
  avatar?: string | null;
}

export function PostMenu({ post, currentUserId, onPostDeleted, onEdit, onPinToggled }: PostMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [isReporting, setIsReporting] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareConvs, setShareConvs] = useState<ChatConv[]>([]);
  const [shareSearch, setShareSearch] = useState('');
  const [shareSelectedId, setShareSelectedId] = useState<string | null>(null);
  const [isSharingToChat, setIsSharingToChat] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwnPost = post.user_id === currentUserId;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (!confirm('آیا از حذف این پست مطمئن هستید؟')) return;
    setIsDeleting(true);
    try {
      await postApi.delete(post.id);
      onPostDeleted?.();
      setIsOpen(false);
    } catch {
      toast.error('خطا در حذف پست');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReport = async () => {
    setIsReporting(true);
    try {
      await postApi.report(post.id, post.user_id, reportReason);
      toast.success('گزارش با موفقیت ثبت شد');
      setShowReportSheet(false);
      setIsOpen(false);
    } catch {
      toast.error('خطا در ثبت گزارش');
    } finally {
      setIsReporting(false);
    }
  };

  const handlePinToggle = async () => {
    setIsPinning(true);
    setIsOpen(false);
    try {
      if (post.is_pinned) {
        await postApi.unpin(post.id);
        onPinToggled?.(false);
        toast.success('پین برداشته شد');
      } else {
        await postApi.pin(post.id);
        onPinToggled?.(true);
        toast.success('پست پین شد');
      }
    } catch {
      toast.error('خطا');
    } finally {
      setIsPinning(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(post.content || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('خطا در کپی');
    }
  };

  const openShareSheet = async () => {
    setShowShareSheet(true);
    setIsOpen(false);
    try {
      const data = await apiClient.get<{ conversations?: Record<string, unknown>[] }>('/v1/chat/conversations?limit=50');
      setShareConvs((data.conversations || []).map((c: Record<string, unknown>) => ({
        id: String(c.id),
        name: String(c.name || c.other_user_name || c.peer_name || 'کاربر'),
        avatar: (c.image || c.avatar_url || c.other_user_avatar || null) as string | null,
      })));
    } catch {
      setShareConvs([]);
    }
  };

  const handleShareToChat = async () => {
    if (!shareSelectedId) return;
    setIsSharingToChat(true);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const postUrl = `${baseUrl}/post/${post.id}`;
    const shareContent = post.content
      ? `${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}\n\n${postUrl}`
      : postUrl;
    try {
      await apiClient.post(`/v1/chat/conversations/${shareSelectedId}/messages`, { content: shareContent });
      toast.success('پست به چت ارسال شد');
      setShowShareSheet(false);
      setShareSelectedId(null);
    } catch {
      toast.error('خطا در ارسال');
    } finally {
      setIsSharingToChat(false);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <MoreHorizontal className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-2 z-50">
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            >
              {copied ? <Check className="w-4 h-4 text-green-500 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
              <span className="text-sm">{copied ? 'کپی شد' : 'کپی متن'}</span>
            </button>

            <button
              onClick={openShareSheet}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm">ارسال به چت</span>
            </button>

            {isOwnPost && (
              <button
                onClick={() => { onEdit?.(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
              >
                <Pencil className="w-4 h-4 shrink-0" />
                <span className="text-sm">ویرایش پست</span>
              </button>
            )}
            {isOwnPost && (
              <button
                onClick={handlePinToggle}
                disabled={isPinning}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition disabled:opacity-50"
              >
                {post.is_pinned ? <PinOff className="w-4 h-4 shrink-0" /> : <Pin className="w-4 h-4 shrink-0" />}
                <span className="text-sm">{post.is_pinned ? 'برداشتن پین' : 'پین کردن'}</span>
              </button>
            )}

            {isOwnPost && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span className="text-sm">{isDeleting ? 'در حال حذف...' : 'حذف پست'}</span>
              </button>
            )}

            {!isOwnPost && (
              <button
                onClick={() => { setShowReportSheet(true); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition"
              >
                <Flag className="w-4 h-4 shrink-0" />
                <span className="text-sm">گزارش پست</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Share to Chat Sheet */}
      {showShareSheet && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowShareSheet(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md flex flex-col max-h-[75vh] animate-slide-in-bottom sm:animate-none">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg">ارسال به چت</h3>
              <button onClick={() => setShowShareSheet(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input value={shareSearch} onChange={e => setShareSearch(e.target.value)} placeholder="جستجو..." className="w-full h-10 pr-9 pl-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm outline-none" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {shareConvs.filter(c => c.name.toLowerCase().includes(shareSearch.toLowerCase())).map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setShareSelectedId(shareSelectedId === conv.id ? null : conv.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                >
                  <div className="relative shrink-0">
                    <Avatar src={conv.avatar} alt={conv.name} size="sm" />
                    {shareSelectedId === conv.id && (
                      <div className="absolute inset-0 rounded-full bg-vista-primary/80 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium">{conv.name}</span>
                </button>
              ))}
            </div>
            {shareSelectedId && (
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={handleShareToChat}
                  disabled={isSharingToChat}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-vista-gradient text-white font-semibold text-sm disabled:opacity-60"
                >
                  {isSharingToChat ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  ارسال پست
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Sheet */}
      {showReportSheet && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowReportSheet(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 animate-slide-in-bottom sm:animate-none">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">گزارش پست</h3>
              <button onClick={() => setShowReportSheet(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">دلیل گزارش را انتخاب کنید:</p>

            <div className="space-y-2 mb-6">
              {REPORT_REASONS.map(r => (
                <label key={r.value} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.value}
                    checked={reportReason === r.value}
                    onChange={() => setReportReason(r.value)}
                    className="accent-vista-primary w-4 h-4"
                  />
                  <span className="text-sm text-zinc-800 dark:text-zinc-200">{r.label}</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleReport}
              disabled={isReporting}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isReporting ? 'در حال ارسال...' : 'ارسال گزارش'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
