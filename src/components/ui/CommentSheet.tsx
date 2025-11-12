'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { supabase, Post, Profile, Comment } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import GoldenTickBadge from './GoldenTickBadge';

interface CommentWithProfile extends Comment {
    profiles?: Profile;
    replies?: CommentWithProfile[];
}

interface PostWithProfile extends Post {
    profiles?: Profile;
}

interface CommentSheetProps {
    isOpen: boolean;
    onClose: () => void;
    post: PostWithProfile;
    onUpdate?: (updatedPost: PostWithProfile) => void;
}

export function CommentSheet({ isOpen, onClose, post, onUpdate }: CommentSheetProps) {
    const { user, profile } = useAuth();
    const [comments, setComments] = useState<CommentWithProfile[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyText, setReplyText] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const loadComments = useCallback(async () => {
        setIsLoading(true);
        try {
            // Load main comments
            const { data: commentsData, error: commentsError } = await supabase
                .from('comments')
                .select(`
                    *,
                    profiles!comments_user_id_fkey (*)
                `)
                .eq('post_id', post.id)
                .is('parent_comment_id', null)
                .order('created_at', { ascending: false });

            if (commentsError) throw commentsError;

            // Load replies for each comment
            const commentsWithReplies = await Promise.all(
                (commentsData || []).map(async (comment) => {
                    const { data: repliesData, error: repliesError } = await supabase
                        .from('comments')
                        .select(`
                            *,
                            profiles!comments_user_id_fkey (*)
                        `)
                        .eq('parent_comment_id', comment.id)
                        .order('created_at', { ascending: true });

                    if (repliesError) throw repliesError;

                    return {
                        ...comment,
                        replies: repliesData || []
                    };
                })
            );

            setComments(commentsWithReplies);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            const errorDetails = error instanceof Error ? { 
                message: error.message, 
                name: error.name,
                stack: error.stack 
            } : error;
            console.error('Error loading comments:', errorMessage, errorDetails);
        } finally {
            setIsLoading(false);
        }
    }, [post.id]);

    useEffect(() => {
        if (isOpen) {
            loadComments();
        }
    }, [isOpen, loadComments]);

    const handleAddComment = async () => {
        if (!user || !profile || !newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    content: newComment.trim(),
                    post_id: post.id,
                    user_id: user.id,
                })
                .select(`
                    *,
                    profiles!comments_user_id_fkey (*)
                `)
                .single();

            if (error) throw error;

            setComments(prev => [data, ...prev]);
            setNewComment('');

            // Update post comment count
            if (onUpdate) {
                const updatedPost = { ...post };
                onUpdate(updatedPost);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            console.error('Error adding comment:', errorMessage, error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddReply = async (parentCommentId: string) => {
        if (!user || !profile || !replyText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    content: replyText.trim(),
                    post_id: post.id,
                    user_id: user.id,
                    parent_comment_id: parentCommentId,
                })
                .select(`
                    *,
                    profiles!comments_user_id_fkey (*)
                `)
                .single();

            if (error) throw error;

            // Add reply to the correct comment
            setComments(prev => prev.map(comment => {
                if (comment.id === parentCommentId) {
                    return {
                        ...comment,
                        replies: [...(comment.replies || []), data]
                    };
                }
                return comment;
            }));

            setReplyText('');
            setReplyingTo(null);

            // Update post comment count
            if (onUpdate) {
                const updatedPost = { ...post };
                onUpdate(updatedPost);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            console.error('Error adding reply:', errorMessage, error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return 'همین الان';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} دقیقه پیش`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} ساعت پیش`;
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} روز پیش`;
        } else {
            return date.toLocaleDateString('fa-IR');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[80vh] md:max-h-[70vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">نظرات</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            در حال بارگذاری نظرات...
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            هنوز نظری ثبت نشده است.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className="border-b border-zinc-100 dark:border-zinc-800 pb-4 last:border-b-0">
                                    <div className="flex gap-3">
                                        {comment.profiles?.avatar_url ? (
                                            <img
                                                src={comment.profiles.avatar_url}
                                                alt="avatar"
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-400">
                                                {comment.profiles?.full_name?.charAt(0) || comment.profiles?.username?.charAt(0) || '👤'}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {comment.profiles?.full_name || comment.profiles?.username}
                                                    </span>
                                                    {/* TODO: Replace with actual golden tick status */}
                                                    {false && <GoldenTickBadge size="sm" />}
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatTimeAgo(comment.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                                                {comment.content}
                                            </p>
                                            <button
                                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                className="text-xs text-blue-500 hover:text-blue-600 transition"
                                            >
                                                پاسخ
                                            </button>
                                        </div>
                                    </div>

                                    {/* Reply Input */}
                                    {replyingTo === comment.id && (
                                        <div className="mt-3 mr-11 flex gap-2">
                                            <input
                                                type="text"
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="نظر خود را بنویسید..."
                                                className="flex-1 px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddReply(comment.id)}
                                            />
                                            <button
                                                onClick={() => handleAddReply(comment.id)}
                                                disabled={isSubmitting || !replyText.trim()}
                                                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Replies - Always show all replies */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="mt-3 mr-11">
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                {comment.replies.length} پاسخ
                                            </div>
                                            <div className="space-y-3">
                                                {comment.replies.map((reply) => (
                                                    <div key={reply.id} className="flex gap-2">
                                                        {reply.profiles?.avatar_url ? (
                                                            <img
                                                                src={reply.profiles.avatar_url}
                                                                alt="avatar"
                                                                className="w-6 h-6 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                                                                {reply.profiles?.full_name?.charAt(0) || reply.profiles?.username?.charAt(0) || '👤'}
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                                        {reply.profiles?.full_name || reply.profiles?.username}
                                                                    </span>
                                                                    {/* TODO: Replace with actual golden tick status */}
                                                                    {false && <GoldenTickBadge size="sm" />}
                                                                </div>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {formatTimeAgo(reply.created_at)}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                                                                {reply.content}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Comment Input */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="نظر خود را بنویسید..."
                            className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                            disabled={!user || !profile}
                        />
                        <button
                            onClick={handleAddComment}
                            disabled={isSubmitting || !newComment.trim() || !user || !profile}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 