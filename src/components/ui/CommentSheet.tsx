'use client';

import { useState, useEffect } from 'react';
import { X, Send, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, Comment, Profile } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface CommentWithProfile extends Comment {
    profiles?: Profile;
    replies?: CommentWithProfile[];
}

interface CommentSheetProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
    postOwnerId: string;
}

export function CommentSheet({ isOpen, onClose, postId, postOwnerId }: CommentSheetProps) {
    const { user, profile } = useAuth();
    const [comments, setComments] = useState<CommentWithProfile[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            loadComments();
        }
    }, [isOpen, postId]);

    const loadComments = async () => {
        setIsLoading(true);
        try {
            // Load main comments
            const { data: mainComments, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    profiles:profiles!comments_user_id_fkey(
                        id,
                        username,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('post_id', postId)
                .is('parent_comment_id', null)
                .order('created_at', { ascending: true });

            if (!error && mainComments) {
                // Load replies for each comment
                const commentsWithReplies = await Promise.all(
                    mainComments.map(async (comment) => {
                        const { data: replies } = await supabase
                            .from('comments')
                            .select(`
                                *,
                                profiles:profiles!comments_user_id_fkey(
                                    id,
                                    username,
                                    full_name,
                                    avatar_url
                                )
                            `)
                            .eq('parent_comment_id', comment.id)
                            .order('created_at', { ascending: true });

                        return {
                            ...comment,
                            replies: replies || []
                        };
                    })
                );

                setComments(commentsWithReplies);
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!user || !profile || !newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    post_id: postId,
                    user_id: user.id,
                    owner_id: postOwnerId,
                    content: newComment.trim()
                })
                .select(`
                    *,
                    profiles:profiles!comments_user_id_fkey(
                        id,
                        username,
                        full_name,
                        avatar_url
                    )
                `)
                .single();

            if (!error && data) {
                setNewComment('');
                setComments(prev => [...prev, { ...data, replies: [] }]);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddReply = async (parentCommentId: string) => {
        if (!user || !profile || !replyText.trim()) return;

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    post_id: postId,
                    user_id: user.id,
                    owner_id: postOwnerId,
                    parent_comment_id: parentCommentId,
                    content: replyText.trim()
                })
                .select(`
                    *,
                    profiles:profiles!comments_user_id_fkey(
                        id,
                        username,
                        full_name,
                        avatar_url
                    )
                `)
                .single();

            if (!error && data) {
                setReplyText('');
                setReplyingTo(null);
                // Add reply to the correct comment
                setComments(prev =>
                    prev.map(comment =>
                        comment.id === parentCommentId
                            ? { ...comment, replies: [...(comment.replies || []), data] }
                            : comment
                    )
                );
                // Auto-expand replies when adding a new reply
                setExpandedReplies(prev => new Set([...prev, parentCommentId]));
            }
        } catch (error) {
            console.error('Error adding reply:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleReplies = (commentId: string) => {
        setExpandedReplies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'الان';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} دقیقه پیش`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ساعت پیش`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} روز پیش`;

        return date.toLocaleDateString('fa-IR');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl max-h-[80vh] md:max-h-[70vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        نظرات ({comments.length})
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            در حال بارگذاری نظرات...
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            هنوز نظری ثبت نشده است.
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="space-y-3">
                                {/* Main Comment */}
                                <div className="flex items-start gap-3">
                                    {comment.profiles?.avatar_url ? (
                                        <img
                                            src={comment.profiles.avatar_url}
                                            alt="avatar"
                                            className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-300 flex-shrink-0">
                                            {comment.profiles?.full_name?.charAt(0) || comment.profiles?.username?.charAt(0) || '👤'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-4 py-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                    {comment.profiles?.full_name || comment.profiles?.username || 'کاربر'}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatTimeAgo(comment.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                                {comment.content}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <button
                                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                            >
                                                <Reply className="w-3 h-3" />
                                                پاسخ
                                            </button>
                                            {comment.replies && comment.replies.length > 0 && (
                                                <button
                                                    onClick={() => toggleReplies(comment.id)}
                                                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                                                >
                                                    {expandedReplies.has(comment.id) ? (
                                                        <ChevronUp className="w-3 h-3" />
                                                    ) : (
                                                        <ChevronDown className="w-3 h-3" />
                                                    )}
                                                    {comment.replies.length} پاسخ
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Reply Input */}
                                {replyingTo === comment.id && (
                                    <div className="mr-11 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="پاسخ خود را بنویسید..."
                                            className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-full bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddReply(comment.id)}
                                        />
                                        <button
                                            onClick={() => handleAddReply(comment.id)}
                                            disabled={isSubmitting || !replyText.trim()}
                                            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full transition"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* Replies */}
                                {comment.replies && comment.replies.length > 0 && expandedReplies.has(comment.id) && (
                                    <div className="mr-11 space-y-3">
                                        {comment.replies.map((reply) => (
                                            <div key={reply.id} className="flex items-start gap-3">
                                                {reply.profiles?.avatar_url ? (
                                                    <img
                                                        src={reply.profiles.avatar_url}
                                                        alt="avatar"
                                                        className="w-6 h-6 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 flex-shrink-0">
                                                        {reply.profiles?.full_name?.charAt(0) || reply.profiles?.username?.charAt(0) || '👤'}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="bg-zinc-100 dark:bg-zinc-700 rounded-xl px-3 py-2">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-xs text-gray-900 dark:text-white">
                                                                {reply.profiles?.full_name || reply.profiles?.username || 'کاربر'}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {formatTimeAgo(reply.created_at)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-800 dark:text-gray-200">
                                                            {reply.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Add Comment Input */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-3">
                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="avatar"
                                className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-300">
                                {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || '👤'}
                            </div>
                        )}
                        <div className="flex-1 flex items-center gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="نظر خود را بنویسید..."
                                className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={isSubmitting || !newComment.trim()}
                                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full transition"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 