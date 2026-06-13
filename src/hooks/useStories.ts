import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { storyApi, noteApi, StoryUser, ProfileNote } from '@/lib/socialApi'
import { postApi } from '@/lib/backendApi'

const POSTS_PER_PAGE = 15

export function useActiveStories() {
  return useQuery<StoryUser[]>({
    queryKey: ['stories', 'active'],
    queryFn: () => storyApi.getActive(),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useCurrentUserNote() {
  const queryClient = useQueryClient()

  const query = useQuery<ProfileNote | null>({
    queryKey: ['note', 'me'],
    queryFn: () => noteApi.getMine(),
    staleTime: 30 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: (content: string) => noteApi.create(content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['note'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => noteApi.delete(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['note'] }),
  })

  return {
    note: query.data,
    isLoading: query.isLoading,
    createNote: createMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}

export function useBatchNotes(userIds: string[]) {
  return useQuery<Record<string, ProfileNote>>({
    queryKey: ['notes', 'batch', userIds.sort().join(',')],
    queryFn: () => noteApi.batch(userIds),
    enabled: userIds.length > 0,
    staleTime: 60 * 1000,
  })
}

export function useFollowingFeed() {
  return useInfiniteQuery({
    queryKey: ['posts', 'following'],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined
      const response = await postApi.following(POSTS_PER_PAGE, cursor)
      return {
        posts: response.posts,
        nextCursor: response.nextCursor,
        hasMore: response.hasMore,
      }
    },
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: undefined as string | undefined,
    staleTime: 2 * 60 * 1000,
  })
}
