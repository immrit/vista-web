import { useInfiniteQuery } from '@tanstack/react-query';
import { postApi } from '@/lib/backendApi';
import { PostWithProfile } from '@/lib/types';

interface PostsResponse {
  posts: PostWithProfile[];
  nextCursor?: string;
  hasMore: boolean;
}

const POSTS_PER_PAGE = 10;

export function useInfinitePosts() {
  return useInfiniteQuery<PostsResponse, Error>({
    queryKey: ['posts', 'infinite'],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      const response = await postApi.explore(POSTS_PER_PAGE, cursor);

      return {
        posts: response.posts,
        nextCursor: response.nextCursor,
        hasMore: response.hasMore,
      };
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: undefined,
    staleTime: 5 * 60 * 1000, // 5 دقیقه
    gcTime: 10 * 60 * 1000, // 10 دقیقه
  });
}
