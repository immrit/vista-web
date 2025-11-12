import { useState, useCallback } from 'react';
import { supabase, Post, Profile } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface PostWithProfile extends Post {
  profiles?: Profile;
  is_liked?: boolean;
}

export function useOptimisticPost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [optimisticLikes, setOptimisticLikes] = useState<Map<string, { count: number; isLiked: boolean }>>(new Map());

  const likePost = useCallback(async (postId: string, currentPost: PostWithProfile) => {
    if (!user) return;

    const isLiked = currentPost.is_liked || false;
    const currentCount = currentPost.likes_count || 0;

    // فوری UI رو آپدیت کن
    const newCount = currentCount + (isLiked ? -1 : 1);
    setOptimisticLikes((prev) => {
      const next = new Map(prev);
      next.set(postId, {
        count: newCount,
        isLiked: !isLiked,
      });
      return next;
    });

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        if (error) throw error;
      }

      // موفق شد، optimistic رو پاک کن
      setOptimisticLikes((prev) => {
        const next = new Map(prev);
        next.delete(postId);
        return next;
      });

      // Invalidate queries برای refresh
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      console.error('Error toggling like:', error);

      // خطا خورد، برگردون عقب
      setOptimisticLikes((prev) => {
        const next = new Map(prev);
        next.delete(postId);
        return next;
      });
    }
  }, [user, queryClient]);

  // Merge کن optimistic با واقعی
  const applyOptimisticUpdates = useCallback((posts: PostWithProfile[]): PostWithProfile[] => {
    if (optimisticLikes.size === 0) return posts;

    return posts.map((post) => {
      const optimistic = optimisticLikes.get(post.id);
      if (optimistic) {
        return {
          ...post,
          likes_count: optimistic.count,
          is_liked: optimistic.isLiked,
        };
      }
      return post;
    });
  }, [optimisticLikes]);

  return {
    likePost,
    applyOptimisticUpdates,
    hasOptimisticUpdates: optimisticLikes.size > 0,
  };
}
