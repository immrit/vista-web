import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { postApi } from '@/lib/backendApi';
import { PostWithProfile } from '@/lib/types';
import { useAuth } from './useAuth';

export function useOptimisticPost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [optimisticLikes, setOptimisticLikes] = useState<Map<string, { count: number; isLiked: boolean }>>(new Map());

  const likePost = useCallback(async (postId: string, currentPost: PostWithProfile) => {
    if (!user) return;

    const wasLiked = currentPost.is_liked ?? false;
    const currentCount = currentPost.likes_count ?? 0;
    const fallback = {
      count: Math.max(0, currentCount + (wasLiked ? -1 : 1)),
      isLiked: !wasLiked,
    };

    setOptimisticLikes((prev) => {
      const next = new Map(prev);
      next.set(postId, fallback);
      return next;
    });

    try {
      const result = await postApi.toggleLike(postId, currentPost.user_id);
      setOptimisticLikes((prev) => {
        const next = new Map(prev);
        next.set(postId, {
          count: result.like_count ?? fallback.count,
          isLiked: result.is_liked ?? fallback.isLiked,
        });
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      console.error('Error toggling like:', error);
      setOptimisticLikes((prev) => {
        const next = new Map(prev);
        next.delete(postId);
        return next;
      });
    }
  }, [queryClient, user]);

  const applyOptimisticUpdates = useCallback((posts: PostWithProfile[]): PostWithProfile[] => {
    if (optimisticLikes.size === 0) return posts;

    return posts.map((post) => {
      const optimistic = optimisticLikes.get(post.id);
      if (!optimistic) return post;
      return {
        ...post,
        likes_count: optimistic.count,
        is_liked: optimistic.isLiked,
      };
    });
  }, [optimisticLikes]);

  return {
    likePost,
    applyOptimisticUpdates,
    hasOptimisticUpdates: optimisticLikes.size > 0,
  };
}
