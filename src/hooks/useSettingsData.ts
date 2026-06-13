'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '@/lib/backendApi'
import { apiClient } from '@/lib/apiClient'
import { normalizeProfile } from '@/lib/backendApi'
import type { Profile } from '@/lib/types'

export function usePrivacySettings() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['settings', 'privacy'],
    queryFn: () => profileApi.getPrivacySettings(),
  })
  const mutation = useMutation({
    mutationFn: (settings: Record<string, unknown>) => profileApi.updatePrivacySettings(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'privacy'] }),
  })
  return { settings: query.data || {}, isLoading: query.isLoading, update: mutation.mutateAsync, isSaving: mutation.isPending }
}

export function useNotificationSettings() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: () => profileApi.getNotificationSettings(),
  })
  const mutation = useMutation({
    mutationFn: (settings: Record<string, unknown>) => profileApi.updateNotificationSettings(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'notifications'] }),
  })
  return { settings: query.data || {}, isLoading: query.isLoading, update: mutation.mutateAsync, isSaving: mutation.isPending }
}

export function useBlockedUsers() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['settings', 'blocked'],
    queryFn: async () => {
      const data = await apiClient.get<{ profiles?: unknown[] }>('/v1/me/blocked-users')
      return (data.profiles || []).map(p => normalizeProfile(p as Parameters<typeof normalizeProfile>[0])) as Profile[]
    },
  })
  const unblock = useMutation({
    mutationFn: (userId: string) => apiClient.post('/v1/me/unblock', { target_user_id: userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'blocked'] }),
  })
  return { users: query.data || [], isLoading: query.isLoading, unblock: unblock.mutateAsync }
}

export function useSavedPosts() {
  return useQuery({
    queryKey: ['settings', 'saved-posts'],
    queryFn: async () => {
      const data = await apiClient.get<{ posts?: unknown[] }>('/v1/me/saved?limit=50')
      return data.posts || []
    },
  })
}

export function useThemeSettings() {
  const get = () => {
    if (typeof window === 'undefined') return { theme: 'system', reduceMotion: false }
    return {
      theme: localStorage.getItem('vista_theme') || 'system',
      reduceMotion: localStorage.getItem('vista_reduce_motion') === 'true',
    }
  }
  const set = (key: string, value: string) => {
    localStorage.setItem(key, value)
    if (key === 'vista_theme') {
      document.documentElement.classList.toggle('dark', value === 'dark' || (value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
    }
  }
  return { get, set }
}

export function useDataStorageSettings() {
  const get = () => {
    if (typeof window === 'undefined') return {}
    return {
      videoAutoPlay: localStorage.getItem('vista_video_autoplay') !== 'false',
      videoDataSaver: localStorage.getItem('vista_video_data_saver') === 'true',
      uploadQuality: localStorage.getItem('vista_upload_quality') || 'standard',
    }
  }
  const set = (key: string, value: string) => localStorage.setItem(key, value)
  return { get, set }
}
