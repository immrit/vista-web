import { postCache } from '@/lib/cache/PostCache';
import { postApi } from '@/lib/backendApi';
import { PostWithProfile } from '@/lib/types';

export function useCachedPosts() {
  const fetchPosts = async (page: number, pageSize: number = 10): Promise<PostWithProfile[]> => {
    const cacheKey = `posts:page:${page}:size:${pageSize}`;
    
    return postCache.get(cacheKey, async () => {
      const response = await postApi.feed(pageSize, page * pageSize);
      return response.posts;
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


