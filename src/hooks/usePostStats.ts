'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UsePostStatsProps {
    postId: string;
    initialLikesCount: number;
    initialCommentsCount: number;
}

export function usePostStats({ postId, initialLikesCount, initialCommentsCount }: UsePostStatsProps) {
    const [likesCount, setLikesCount] = useState(initialLikesCount);
    const [commentsCount, setCommentsCount] = useState(initialCommentsCount);

    useEffect(() => {
        // Set initial values
        setLikesCount(initialLikesCount);
        setCommentsCount(initialCommentsCount);
    }, [initialLikesCount, initialCommentsCount]);

    const refreshStats = useCallback(async () => {
        try {
            // Count likes directly from likes table
            const { count: likesCountResult } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', postId);

            // Count comments directly from comments table
            const { count: commentsCountResult } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', postId);

            console.log(`Post ${postId} - Likes: ${likesCountResult}, Comments: ${commentsCountResult}`);

            // Update state with actual counts
            setLikesCount(likesCountResult || 0);
            setCommentsCount(commentsCountResult || 0);
        } catch (error) {
            console.error('Error refreshing post stats:', error);
        }
    }, [postId]);

    // Initial load of stats
    useEffect(() => {
        if (postId) {
            refreshStats();
        }
    }, [postId, refreshStats]);

    // Listen for real-time updates on likes table
    useEffect(() => {
        const likesChannel = supabase
            .channel(`post-likes-${postId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'likes',
                    filter: `post_id=eq.${postId}`
                },
                async () => {
                    console.log(`Likes changed for post ${postId}, refreshing stats...`);
                    // Refresh stats when likes change
                    await refreshStats();
                }
            )
            .subscribe();

        // Listen for real-time updates on comments table
        const commentsChannel = supabase
            .channel(`post-comments-${postId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comments',
                    filter: `post_id=eq.${postId}`
                },
                async () => {
                    console.log(`Comments changed for post ${postId}, refreshing stats...`);
                    // Refresh stats when comments change
                    await refreshStats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(likesChannel);
            supabase.removeChannel(commentsChannel);
        };
    }, [postId, refreshStats]);

    return {
        likesCount,
        commentsCount,
        refreshStats
    };
} 