'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Flag, MoreHorizontal, Trash2 } from 'lucide-react';
import { postApi } from '@/lib/backendApi';

interface PostMenuProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    image_url?: string | null;
    video_url?: string | null;
    music_url?: string | null;
  };
  currentUserId: string;
  onPostDeleted?: () => void;
}

export function PostMenu({ post, currentUserId, onPostDeleted }: PostMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [copied, setCopied] = useState(false);
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
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('خطا در حذف پست');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReport = async () => {
    setIsReporting(true);
    try {
      await postApi.report(post.id, post.user_id);
      alert('گزارش شما با موفقیت ثبت شد.');
      setIsOpen(false);
    } catch (error) {
      console.error('Error reporting post:', error);
      alert('خطا در ثبت گزارش');
    } finally {
      setIsReporting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(post.content || 'پست بدون متن');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying text:', error);
      alert('خطا در کپی کردن متن');
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
      >
        <MoreHorizontal className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-2 z-50">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            <span className="text-sm">{copied ? 'کپی شد' : 'کپی متن'}</span>
          </button>

          {isOwnPost && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">{isDeleting ? 'در حال حذف...' : 'حذف پست'}</span>
            </button>
          )}

          {!isOwnPost && (
            <button
              onClick={handleReport}
              disabled={isReporting}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition disabled:opacity-50"
            >
              <Flag className="w-4 h-4" />
              <span className="text-sm">{isReporting ? 'در حال ثبت...' : 'گزارش پست'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
