import { useInfiniteQuery } from '@tanstack/react-query';
import { postCache } from '@/lib/cache/PostCache';
import { createClient } from '@/lib/supabase/client';
import { PostWithProfile } from '@/lib/types';

interface PostsResponse {
  posts: PostWithProfile[];
  nextPage: number | undefined;
}

const POSTS_PER_PAGE = 10;

export function useInfinitePosts() {
  return useInfiniteQuery<PostsResponse, Error>({
    queryKey: ['posts', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const page = pageParam as number;
      const cacheKey = `posts:page:${page}:size:${POSTS_PER_PAGE}`;
      const clientSupabase = createClient();

      // استفاده از cache
      const data = await postCache.get<PostWithProfile[]>(cacheKey, async () => {
        const { data, error } = await clientSupabase
          .from('posts')
          .select('*, profiles:profiles!posts_user_id_fkey(*)')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .range(page * POSTS_PER_PAGE, (page + 1) * POSTS_PER_PAGE - 1);

        if (error) {
          throw error;
        }

        return (data || []) as PostWithProfile[];
      });

      return {
        posts: data,
        nextPage: data.length === POSTS_PER_PAGE ? page + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 دقیقه
    gcTime: 10 * 60 * 1000, // 10 دقیقه
  });
}

