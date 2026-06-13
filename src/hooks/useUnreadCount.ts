'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'

export function useUnreadCount() {
  const { data } = useQuery({
    queryKey: ['unread-conversations-count'],
    queryFn: async () => {
      const res = await apiClient.get<{ conversations?: { unread_count?: number }[] }>(
        '/v1/chat/conversations?limit=50'
      )
      const list = res.conversations || []
      return list.reduce((sum, c) => sum + (c.unread_count || 0), 0)
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
  return data ?? 0
}
