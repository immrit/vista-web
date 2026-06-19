import { apiClient } from './apiClient'
import { normalizeProfile } from './backendApi'
import type { Profile } from './types'

export interface StoryResponse {
  id: string
  user_id: string
  media_url: string
  media_type: 'image' | 'video' | string
  caption?: string | null
  duration_type?: '24h' | '48h' | string
  privacy_type?: string
  created_at: string
  expires_at?: string
  view_count?: number
  is_viewed?: boolean
  interactive_elements?: any[]
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
    duration_type?: '24h' | '48h'
    interactive_elements?: any[]
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

  async getViewers(storyId: string): Promise<Array<{ user_id: string; username: string; full_name?: string; avatar_url?: string; viewed_at: string }>> {
    const data = await apiClient.get<{ viewers?: Array<{ user_id: string; username: string; full_name?: string; avatar_url?: string; viewed_at: string }> }>(
      `/v1/stories/${encodeURIComponent(storyId)}/viewers`
    )
    return data.viewers || []
  },

  async react(storyId: string, emoji: string): Promise<void> {
    await apiClient.post(`/v1/stories/${encodeURIComponent(storyId)}/react`, { emoji })
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

export interface StoryHighlight {
  id: string
  user_id: string
  title: string
  cover_url?: string | null
  story_ids: string[]
  created_at: string
}

export const highlightApi = {
  async list(userId: string): Promise<StoryHighlight[]> {
    try {
      const data = await apiClient.get<{ highlights?: StoryHighlight[] }>(`/v1/stories/highlights?user_id=${encodeURIComponent(userId)}`)
      return data.highlights || []
    } catch { return [] }
  },

  async getStories(highlightId: string): Promise<StoryResponse[]> {
    try {
      const data = await apiClient.get<{ stories?: StoryResponse[] }>(`/v1/stories/highlights/${encodeURIComponent(highlightId)}/stories`)
      return data.stories || []
    } catch { return [] }
  },

  async create(title: string, storyIds: string[], coverUrl?: string): Promise<StoryHighlight> {
    return apiClient.post<StoryHighlight>('/v1/stories/highlights', { title, story_ids: storyIds, cover_url: coverUrl })
  },

  async update(highlightId: string, title: string, coverUrl?: string): Promise<void> {
    await apiClient.patch(`/v1/stories/highlights/${encodeURIComponent(highlightId)}`, { title, cover_url: coverUrl })
  },

  async delete(highlightId: string): Promise<void> {
    await apiClient.delete(`/v1/stories/highlights/${encodeURIComponent(highlightId)}`)
  },

  async addStories(highlightId: string, storyIds: string[]): Promise<void> {
    await apiClient.post(`/v1/stories/highlights/${encodeURIComponent(highlightId)}/stories`, { story_ids: storyIds })
  },
}

export const blockApi = {
  async block(userId: string): Promise<void> {
    await apiClient.post(`/v1/me/block/${encodeURIComponent(userId)}`)
  },
  async unblock(userId: string): Promise<void> {
    await apiClient.delete(`/v1/me/block/${encodeURIComponent(userId)}`)
  },
  async reportUser(userId: string, reason: string): Promise<void> {
    await apiClient.post('/v1/me/report-user', { reported_user_id: userId, reason })
  },
}

export const muteApi = {
  async mute(userId: string): Promise<void> {
    await apiClient.post(`/v1/me/mute/${encodeURIComponent(userId)}`)
  },
  async unmute(userId: string): Promise<void> {
    await apiClient.delete(`/v1/me/mute/${encodeURIComponent(userId)}`)
  },
  async listMuted(): Promise<Array<{ user_id: string; username: string; full_name?: string; avatar_url?: string }>> {
    try {
      const data = await apiClient.get<{ users?: Array<{ user_id: string; username: string; full_name?: string; avatar_url?: string }> }>('/v1/me/muted-users')
      return data.users || []
    } catch {
      return []
    }
  }
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
