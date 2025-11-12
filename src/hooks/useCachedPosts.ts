import { postCache } from '@/lib/cache/PostCache';
import { supabase } from '@/lib/supabase';
import { PostWithProfile } from '@/lib/types';

export function useCachedPosts() {
  const fetchPosts = async (page: number, pageSize: number = 10): Promise<PostWithProfile[]> => {
    const cacheKey = `posts:page:${page}:size:${pageSize}`;
    
    return postCache.get(cacheKey, async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:profiles!posts_user_id_fkey(*)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) {
        throw error;
      }
      
      return (data || []) as PostWithProfile[];
    });
  };

  const invalidatePost = (postId: string) => {
    postCache.invalidatePattern(/^posts:/);
  };

  const invalidateAllPosts = () => {
    postCache.invalidatePattern(/^posts:/);
  };

  return { fetchPosts, invalidatePost, invalidateAllPosts };
}



