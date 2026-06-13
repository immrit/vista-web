import { apiClient } from './apiClient'
import { normalizeProfile } from './backendApi'
import type { Profile } from './types'

export interface StoryResponse {
  id: string
  user_id: string
  media_url: string
  media_type: 'image' | 'video' | string
  caption?: string | null
  duration_type?: string
  privacy_type?: string
  created_at: string
  expires_at?: string
  view_count?: number
  is_viewed?: boolean
  interactive_elements?: unknown[]
  music_url?: string | null
  music_title?: string | null
}

export interface StoryUser {
  user_id: string
  username?: string
  full_name?: string
  avatar_url?: string
  is_verified?: boolean
  has_unseen?: boolean
  stories: StoryResponse[]
}

export interface ProfileNote {
  user_id: string
  content: string
  created_at: string
  expires_at: string
}

export const storyApi = {
  async getActive(): Promise<StoryUser[]> {
    const data = await apiClient.get<{ users?: StoryUser[] }>('/v1/stories/active')
    return data.users || []
  },

  async getUserStories(userId: string): Promise<StoryResponse[]> {
    const data = await apiClient.get<{ stories?: StoryResponse[] }>(
      `/v1/stories/users/${encodeURIComponent(userId)}`
    )
    return data.stories || []
  },

  async create(input: {
    media_url: string
    media_type: string
    caption?: string
    privacy_type?: string
    allowed_user_ids?: string[]
  }): Promise<StoryResponse> {
    return apiClient.post<StoryResponse>('/v1/stories', input)
  },

  async markViewed(storyId: string): Promise<void> {
    await apiClient.post(`/v1/stories/${encodeURIComponent(storyId)}/view`)
  },

  async delete(storyId: string): Promise<void> {
    await apiClient.delete(`/v1/stories/${encodeURIComponent(storyId)}`)
  },

  async reply(storyId: string, message: string): Promise<void> {
    await apiClient.post(`/v1/stories/${encodeURIComponent(storyId)}/reply`, { message })
  },
}

export const noteApi = {
  async getMine(): Promise<ProfileNote | null> {
    try {
      return await apiClient.get<ProfileNote>('/v1/me/note')
    } catch {
      return null
    }
  },

  async create(content: string): Promise<ProfileNote> {
    return apiClient.post<ProfileNote>('/v1/me/note', { content })
  },

  async delete(): Promise<void> {
    await apiClient.delete('/v1/me/note')
  },

  async batch(userIds: string[]): Promise<Record<string, ProfileNote>> {
    if (userIds.length === 0) return {}
    const data = await apiClient.post<Record<string, ProfileNote>>('/v1/profiles/notes/batch', {
      user_ids: userIds,
    })
    return data || {}
  },
}

export const followApi = {
  async follow(targetUserId: string) {
    return apiClient.post<{ status: string; message?: string }>('/v1/me/follow', {
      target_user_id: targetUserId,
    })
  },

  async unfollow(targetUserId: string) {
    return apiClient.post<{ status: string }>('/v1/me/unfollow', {
      target_user_id: targetUserId,
    })
  },
}

export const notificationApi = {
  async list(limit = 30, offset = 0) {
    return apiClient.get<{ notifications?: unknown[]; has_more?: boolean }>(
      `/v1/notifications?limit=${limit}&offset=${offset}`
    )
  },

  async markAllRead() {
    return apiClient.post('/v1/notifications/read-all')
  },

  async markRead(id: string) {
    return apiClient.patch(`/v1/notifications/${encodeURIComponent(id)}`)
  },
}
