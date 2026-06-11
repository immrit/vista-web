import { apiClient } from './apiClient'

export interface GroupInvitePreview {
  id: string
  name: string
  image?: string | null
  invite_enabled: boolean
  member_count: number
  max_members: number
  is_full: boolean
  is_member?: boolean
  type: 'group' | string
}

export interface GroupConversation {
  id: string
  user_id?: string
  peer_id?: string
  conversation_type?: string
  name?: string
  image?: string
  created_by?: string
  max_members?: number
  last_message_at?: string
  last_message_text?: string
  unread_count?: number
  created_at?: string
  invite_code?: string
  invite_enabled?: boolean
  member_count?: number
}

export interface GroupMember {
  user_id: string
  is_admin: boolean
  joined_at: string
  // Profile data joined by frontend
  username?: string
  full_name?: string
  avatar_url?: string
}

export interface CreateGroupInput {
  name: string
  image_url?: string
  member_ids?: string[]
  max_members?: number
}

export interface UpdateGroupInput {
  name?: string
  image_url?: string
}

export interface UpdateInviteInput {
  invite_code: string
  invite_enabled: boolean
}

function sanitizeInviteCode(code: string) {
  return code.trim().replace(/^\/+|\/+$/g, '')
}

export const groupApi = {
  // Preview an invite (public)
  previewInvite(code: string) {
    const inviteCode = sanitizeInviteCode(code)
    return apiClient.get<GroupInvitePreview>(`/v1/chat/groups/invite/${encodeURIComponent(inviteCode)}`)
  },

  // Join by invite
  joinByInvite(code: string) {
    const inviteCode = sanitizeInviteCode(code)
    return apiClient.post<GroupConversation>(`/v1/chat/groups/join/${encodeURIComponent(inviteCode)}`)
  },

  // Create a new group
  createGroup(input: CreateGroupInput) {
    return apiClient.post<GroupConversation>('/v1/chat/groups', input)
  },

  // Get group info
  getGroupInfo(conversationId: string) {
    return apiClient.get<GroupConversation>(`/v1/chat/groups/${conversationId}`)
  },

  // Update group name/image
  updateGroupInfo(conversationId: string, input: UpdateGroupInput) {
    return apiClient.patch<{ success: boolean }>(`/v1/chat/groups/${conversationId}`, input)
  },

  // Delete group (admin only)
  deleteGroup(conversationId: string) {
    return apiClient.delete<{ success: boolean }>(`/v1/chat/groups/${conversationId}`)
  },

  // List group members
  listMembers(conversationId: string) {
    return apiClient.get<{ members: GroupMember[] }>(`/v1/chat/groups/${conversationId}/members`)
      .then(res => res.members || [])
  },

  // Add members
  addMembers(conversationId: string, userIds: string[]) {
    return apiClient.post<{ added: number }>(`/v1/chat/groups/${conversationId}/members`, { member_ids: userIds })
  },

  // Remove a member
  removeMember(conversationId: string, userId: string) {
    return apiClient.delete<{ success: boolean }>(`/v1/chat/groups/${conversationId}/members/${userId}`)
  },

  // Leave group
  leaveGroup(conversationId: string) {
    return apiClient.post<{ success: boolean }>(`/v1/chat/groups/${conversationId}/leave`)
  },

  // Update invite link settings
  updateInvite(conversationId: string, input: UpdateInviteInput) {
    return apiClient.patch<{ success: boolean }>(`/v1/chat/groups/${conversationId}/invite`, input)
  },
}
