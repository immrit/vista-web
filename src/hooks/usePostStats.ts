'use client';

import { useCallback, useEffect, useState } from 'react';
import { commentApi, postApi } from '@/lib/backendApi';

interface UsePostStatsProps {
  postId: string;
  initialLikesCount: number;
  initialCommentsCount: number;
}

export function usePostStats({ postId, initialLikesCount, initialCommentsCount }: UsePostStatsProps) {
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);

  useEffect(() => {
    setLikesCount(initialLikesCount);
    setCommentsCount(initialCommentsCount);
  }, [initialLikesCount, initialCommentsCount]);

  const refreshStats = useCallback(async () => {
    if (!postId) return;

    try {
      const [post, commentCount] = await Promise.all([
        postApi.get(postId),
        commentApi.count(postId),
      ]);

      setLikesCount(post.likes_count || 0);
      setCommentsCount(commentCount || post.comments_count || 0);
    } catch (error) {
      console.error('Error refreshing post stats:', error);
    }
  }, [postId]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    likesCount,
    commentsCount,
    refreshStats,
  };
}
